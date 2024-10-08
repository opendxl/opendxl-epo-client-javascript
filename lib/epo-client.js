'use strict'

const os = require('os')
const inherits = require('inherits')
const dxl = require('@opendxl/dxl-client')
const Request = dxl.Request
const bootstrap = require('@opendxl/dxl-bootstrap')
const Client = bootstrap.Client
const MessageUtils = bootstrap.MessageUtils
const OutputFormat = require('./output-format')

// The type of the ePO DXL "remote" service that is registered with the fabric
const DXL_EPO_REMOTE_SERVICE_TYPE = '/mcafee/service/epo/remote'

// The prefix for ePO DXL "remote" service request topics
const DXL_EPO_REMOTE_REQUEST_PREFIX = DXL_EPO_REMOTE_SERVICE_TYPE + '/'

// The type of the ePO DXL "commands" service that is registered with the fabric
const DXL_EPO_COMMANDS_SERVICE_TYPE = '/mcafee/service/epo/commands'

// The prefix for ePO DXL "commands" service request topics
const DXL_EPO_COMMANDS_REQUEST_PREFIX = '/mcafee/service/epo/command/'

// The prefix which appears before the remote command name in a request to
// the ePO DXL "commands" service.
const DXL_EPO_COMMANDS_REQUEST_COMMAND_PREFIX = '/remote/'

// The DXL topic to query for registered ePO service instances
const DXL_SERVICE_REGISTRY_QUERY_TOPIC = '/mcafee/service/dxl/svcregistry/query'

// The default DXL topic to listen to for ePO threat event messages
const EPO_THREAT_EVENT_TOPIC = '/mcafee/event/epo/threat/response'

// The name of the ePO 'help' remote command
const EPO_HELP_COMMAND = 'core.help'

// JSON output format for ePO remote command
const OUTPUT_FORMAT_JSON = 'json'

/**
 * @classdesc Responsible for all communication with the
 * Data Exchange Layer (DXL) fabric.
 * @external DxlClient
 * @see {@link https://opendxl.github.io/opendxl-client-javascript/jsdoc/Client.html}
 */

/**
 * @classdesc Event messages are sent using the
 * [sendEvent]{@link https://opendxl.github.io/opendxl-client-javascript/jsdoc/Client.html#sendEvent}
 * method of a client instance.
 * @external Event
 * @see {@link https://opendxl.github.io/opendxl-client-javascript/jsdoc/Event.html}
 */

/**
 * @classdesc This client provides a high level wrapper for invoking ePO remote
 * commands via the Data Exchange Layer (DXL) fabric.
 *
 * The purpose of this library is to allow users to invoke ePO remote commands
 * without having to focus on lower-level details such as ePO-specific DXL
 * topics and message formats.
 *
 * **ePO Unique Identifier**
 *
 * DXL supports communicating with multiple ePO servers on a single DXL fabric.
 * However, each instance of this client can only be associated with one ePO
 * server (the server it will be invoking remote commands on).
 *
 * The ePO unique identifier specified must match the identifier that was
 * associated with the particular ePO when a corresponding ePO DXL service was
 * started.
 *
 * If only one ePO server is connected to the DXL fabric this parameter is
 * optional (the client will automatically determine the ePO's unique
 * identifier).
 *
 * The {@link EpoClient.lookupEpoUniqueIdentifiers} method can be used to
 * determine the unique identifiers for ePO servers that are currently exposed
 * to the fabric.
 *
 * @param {external:DxlClient} dxlClient - The DXL client to use for
 *   communication with the ePO DXL service
 * @param {String} [epoUniqueId] - The unique identifier used to specify the ePO
 *   server that this client will communicate with.
 * @constructor
 */
function EpoClient (dxlClient, epoUniqueId) {
  const that = this

  Client.call(this, dxlClient)

  /**
   * Text string used for displaying the status of an asynchronous attempt
   * to obtain the unique id of an ePO server.
   * @type {string}
   * @private
   */
  this._epoIdSearchStatus =
    'ePO unique identifier not yet determined'

  /**
   * Unique identifier of the ePO server on which to invoke remote commands.
   * @type {String}
   * @private
   */
  this._epoUniqueId = epoUniqueId

  /**
   * Controls whether the built-in ePO "commands" (true) or standalone "remote"
   * service {@link https://github.com/opendxl/opendxl-epo-service-python}
   * (false) is used to make command requests.
   * @type {Boolean}
   * @private
   */
  this._useEpoCommandsService = true

  /**
   * Whether or not the ePO service type - "commands" or "remote" - and
   * unique id has been determined.
   * @type {Boolean}
   * @private
   */
  this._epoServiceDetermined = false

  /**
   * Determines the ePO service to which commands should be sent the DXL fabric.
   * If an empty `epoUniqueId` was provided during client construction, an
   * attempt will be made to dynamically determine the unique ID of an ePO
   * server running on the fabric.
   * @param {Function} [callback] - Callback function which should be invoked
   *   after the unique identifier and service type - "commands" or "remote"
   *   has been determined.
   *
   *   If determination of the ePO unique identifier fails, the first parameter
   *   supplied to the callback contains an `Error` object with failure details.
   *   An `Error` object could be delivered for any of the following conditions:
   *
   *   * No value is provided for the `epoUniqueId` parameter during client
   *     construction and zero or more than 1 ePO service is found on the DXL
   *     fabric.
   *   * A value is provided for the `epoUniqueId` parameter during client
   *     construction but no ePO service matching the id is found on the DXL
   *     fabric.
   *   * An error occurs when trying to make DXL requests to the broker to
   *     query for available ePO services.
   * @private
   */
  this._determineService = function (callback) {
    const client = this
    const epoUniqueId = client._epoUniqueId

    const setServiceInfoFunction = function (error, useEpoCommandsService) {
      if (!error) {
        client._epoServiceDetermined = true
        client._useEpoCommandsService = useEpoCommandsService
      }
      if (callback) {
        callback(error)
      }
    }

    if (epoUniqueId) {
      client._isEpoUniqueIdForCommandsService(epoUniqueId,
        setServiceInfoFunction)
    } else {
      client._getEpoId(setServiceInfoFunction)
    }
  }

  /**
   * Lookup the ePO unique identifier.
   * @param {Function} [callback] - Callback function which should be
   *   invoked after the ePO unique identifier has been determined and the
   *   client is ready to use. If an either no unique identifier or more than
   *   one unique identifier can be found, an `Error` object is specified as
   *   the first parameter to the callback.
   * @private
   */
  this._getEpoId = function (callback) {
    lookupEpoUniqueIdentifiers(dxlClient,
      function (error, epoUniqueIds, useEpoCommandsService) {
        if (epoUniqueIds) {
          switch (epoUniqueIds.length) {
            case 0:
              error = new Error(
                'No ePO DXL services are registered with the DXL fabric')
              break
            case 1:
              that._epoUniqueId = epoUniqueIds[0]
              break
            default:
              error = new Error(
                'Multiple ePO DXL services are registered with the DXL fabric' +
                ' (' + epoUniqueIds + ').' +
                ' A specific ePO unique identifier must be specified.'
              )
          }
        }
        that._epoIdSearchStatus = error ? error.message : 'ePO id found'
        if (callback) {
          callback(error, useEpoCommandsService)
        }
      })
  }

  /**
   * Determines if the supplied `epoUniqueId` maps to an ePO DXL "commands" or
   * a "remote" service.
   * @param {String} [epoUniqueId] - The unique identifier used to specify the
   *   ePO server that this client will communicate with.
   * @param {Function} [callback] - Callback function which should be invoked
   *   with the result of the attempt to determine the service type for the
   *   id. If the attempt to determine the service type fails, the first
   *   parameter supplied to the callback contains an `Error` object with
   *   failure details. If the service type can successfully be determined, the
   *   second parameter supplied to the callback is `true` if the unique
   *   identifier matches a "commands" service, else `false` if the unique
   *   identifier matches a "remote" service.
   * @private
   */
  this._isEpoUniqueIdForCommandsService = function (epoUniqueId, callback) {
    lookupEpoRemoteServiceUniqueIds(dxlClient,
      function (error, epoIds) {
        if (epoIds) {
          if (epoIds.indexOf(epoUniqueId) < 0) {
            lookupEpoCommandsServiceUniqueIds(dxlClient,
              function (error, epoIds) {
                let idForCommandsService = false
                if (!error) {
                  if (epoIds.indexOf(epoUniqueId) < 0) {
                    error = new Error('No ePO DXL services are registered ' +
                      'with the DXL fabric for id: ' + epoUniqueId)
                  } else {
                    idForCommandsService = true
                  }
                }
                callback(error, idForCommandsService)
              })
          } else {
            callback(error, false)
          }
        } else {
          callback(error, false)
        }
      }
    )
  }

  /**
   * Invokes the ePO DXL service for the purposes of executing a remote command.
   * @param {String} requestTopic - DXL request topic to use for the request.
   * @param {Object} payload - The object to use as the payload of the DXL
   *   request.
   * @param {String} outputFormat - The output format for ePO to use when
   *   returning the response.
   * @param {Function} [callback] - Callback function to invoke with the result
   *   of the remote command execution. If an error occurs when performing the
   *   command, the first parameter supplied to the callback contains an `Error`
   *   object with failure details. On successful execution of the command, the
   *   remote command output is provided as the second parameter to the
   *   callback.
   * @private
   */
  this._invokeEpoService = function (requestTopic, payload, outputFormat,
    callback) {
    if (this._epoUniqueId) {
      const request = new Request(requestTopic)
      MessageUtils.objectToJsonPayload(request, payload)
      this._dxlClient.asyncRequest(request, function (error, response) {
        let responsePayload = null
        if (response) {
          try {
            switch (outputFormat) {
              case OutputFormat.BINARY:
                responsePayload = response.payload
                break
              case OutputFormat.STRING:
                responsePayload = MessageUtils.decodePayload(response)
                break
              default:
                responsePayload = MessageUtils.jsonPayloadToObject(response)
            }
          } catch (err) {
            error = err
          }
        }
        if (callback) {
          callback(error, responsePayload)
        }
      })
    } else {
      if (callback) {
        callback(new Error(this._epoIdSearchStatus))
      }
    }
  }

  /**
   * Invokes the ePO DXL "commands" service for the purposes of executing a
   * remote command.
   * @param {String} commandName - The name of the remote command to invoke.
   * @param {String} outputFormat - The output format for ePO to use when
   *   returning the response.
   * @param {Object} params - An object containing the parameters for the
   *   command.
   * @param {Function} callback - Callback function to invoke with the result
   *   of the remote command execution. If an error occurs when performing the
   *   command, the first parameter supplied to the callback contains an `Error`
   *   object with failure details. On successful execution of the command, the
   *   remote command output is provided as the second parameter to the
   *   callback.
   * @private
   */
  this._invokeEpoCommandsService = function (commandName, outputFormat,
    params, callback) {
    this._invokeEpoService(DXL_EPO_COMMANDS_REQUEST_PREFIX +
      this._epoUniqueId + DXL_EPO_COMMANDS_REQUEST_COMMAND_PREFIX +
      commandName.replace('.', '/'),
    params,
    outputFormat,
    callback
    )
  }

  /**
   * Invokes the ePO DXL "remote" service for the purposes of executing a
   * remote command.
   * @param {String} commandName - The name of the remote command to invoke.
   * @param {String} outputFormat - The output format for ePO to use when
   *   returning the response.
   * @param {Object} params - An object containing the parameters for the
   *   command.
   * @param {Function} callback - Callback function to invoke with the result
   *   of the remote command execution. If an error occurs when performing the
   *   command, the first parameter supplied to the callback contains an `Error`
   *   object with failure details. On successful execution of the command, the
   *   remote command output is provided as the second parameter to the
   *   callback.
   * @private
   */
  this._invokeEpoRemoteService = function (commandName, outputFormat, params,
    callback) {
    this._invokeEpoService(DXL_EPO_REMOTE_REQUEST_PREFIX + this._epoUniqueId,
      {
        command: commandName,
        output: OUTPUT_FORMAT_JSON,
        params
      },
      outputFormat,
      callback
    )
  }

  this._runCommand = function (commandName, outputFormat, params, callback) {
    if (this._useEpoCommandsService) {
      this._invokeEpoCommandsService(commandName, outputFormat, params,
        callback)
    } else {
      this._invokeEpoRemoteService(commandName, outputFormat, params,
        callback)
    }
  }
}

inherits(EpoClient, Client)

/**
 * Looks up the ePO unique ids for a matching ePO service type.
 * @param {external:DxlClient} dxlClient - The DXL client to use for
 *   communication with the ePO DXL service
 * @param {String} serviceType - The service type to return data for.
 * @param {Function} processServiceCallback - Callback function which is
 *   invoked for each service which is found. The first parameter supplied to
 *   the callback is an array of ePO unique id strings found so far. The
 *   callback can append additional unique ids that it finds in the service info
 *   onto the id array. The second parameter supplied to the callback is an
 *   object containing information for the registered service.
 * @param {Function} doneCallback - Callback function which is invoked with
 *   the result of the unique id lookup. If an error occurs when performing the
 *   lookup, the first parameter supplied to the callback contains an `Error`
 *   object with failure details. On successful execution of the lookup, the
 *   second parameter supplied to the callback is an array of strings whose
 *   values are the ePO unique ids found in the lookup.
 * @private
 */
function lookupEpoUniqueIdsForServiceType (dxlClient, serviceType,
  processServiceCallback,
  doneCallback) {
  // Query the DXL broker registry for info on services matching the service
  // type
  const request = new Request(DXL_SERVICE_REGISTRY_QUERY_TOPIC)
  MessageUtils.objectToJsonPayload(request, { serviceType })
  dxlClient.asyncRequest(request,
    function (error, response) {
      let epoIds = null
      if (response) {
        try {
          epoIds = []
          const responseObj = MessageUtils.jsonPayloadToObject(response)
          const services = responseObj.services
          if (services) {
            Object.keys(services).forEach(
              function (serviceId) {
                const epoId = processServiceCallback(epoIds, services[serviceId])
                if (epoId && epoId.indexOf(epoId) < 0) {
                  epoIds.push(epoId)
                }
              })
          }
        } catch (err) {
          error = err
        }
      }
      doneCallback(error, epoIds)
    })
}

/**
 * Looks up the unique identifiers for the ePO servers that are currently
 * exposed to the DXL fabric via an ePO "commands" service. "commands" services
 * are registered by version 5.0 and later of the ePO DXL extensions.
 * @param {external:DxlClient} dxlClient - The DXL client to use for
 *   communication with the ePO DXL service
 * @param {Function} callback - Callback function which is invoked with the
 *   result of the unique id lookup. If an error occurs when performing the
 *   lookup, the first parameter supplied to the callback contains an `Error`
 *   object with failure details. On successful execution of the lookup, the
 *   second parameter supplied to the callback is an array of strings whose
 *   values are the ePO unique ids found in the lookup.
 * @private
 */
function lookupEpoCommandsServiceUniqueIds (dxlClient, callback) {
  lookupEpoUniqueIdsForServiceType(dxlClient,
    DXL_EPO_COMMANDS_SERVICE_TYPE,
    function (epoIds, service) {
      if (service.metaData && service.metaData.epoGuid) {
        const epoId = service.metaData.epoGuid
        if (epoIds.indexOf(epoId) < 0) {
          epoIds.push(epoId)
        }
      }
    },
    callback)
}

/**
 * Looks up the unique identifiers for the ePO servers that are currently
 * exposed to the DXL fabric via an ePO "remote" service. "remote" services are
 * registered by the standalone
 * [ePO DXL Python Service](https://github.com/opendxl/opendxl-epo-service-python).
 * @param {external:DxlClient} dxlClient - The DXL client to use for
 *   communication with the ePO DXL service
 * @param {Function} callback - Callback function which is invoked with the
 *   result of the unique id lookup. If an error occurs when performing the
 *   lookup, the first parameter supplied to the callback contains an `Error`
 *   object with failure details. On successful execution of the lookup, the
 *   second parameter supplied to the callback is an array of strings whose
 *   values are the ePO unique ids found in the lookup.
 * @private
 */
function lookupEpoRemoteServiceUniqueIds (dxlClient, callback) {
  lookupEpoUniqueIdsForServiceType(dxlClient,
    DXL_EPO_REMOTE_SERVICE_TYPE,
    function (epoIds, service) {
      const requestChannels = service.requestChannels
      if (requestChannels) {
        requestChannels.forEach(function (channel) {
          if (channel.startsWith(DXL_EPO_REMOTE_REQUEST_PREFIX)) {
            const epoId = channel.substring(DXL_EPO_REMOTE_REQUEST_PREFIX.length)
            if (epoIds.indexOf(epoId) < 0) {
              epoIds.push(epoId)
            }
          }
        })
      }
    },
    callback)
}

/**
 * Retrieves an array of strings containing the unique identifiers for the ePO
 * servers that are currently exposed to the DXL fabric.
 * @param {external:DxlClient} dxlClient - The DXL client with which to perform
 *   the request
 * @param {Function} callback - Callback function to invoke with the unique
 *   identifiers which are found. If an error occurs when performing the lookup,
 *   the first parameter supplied to the callback contains an `Error` object
 *   with failure details. On successful lookup, the array of unique identifier
 *   strings is provided as the second parameter to the callback and the
 *   third parameter to the callback is a boolean representing whether a
 *   "commands" (`true`) or a "remote" (`false`) should be used. If at least
 *   one "remote" service is available, a "remote" service should be used.
 * @private
 */
function lookupEpoUniqueIdentifiers (dxlClient, callback) {
  lookupEpoRemoteServiceUniqueIds(dxlClient,
    function (error, epoRemoteServiceIds) {
      if (epoRemoteServiceIds) {
        lookupEpoCommandsServiceUniqueIds(dxlClient,
          function (error, epoServiceIds) {
            if (epoServiceIds) {
              epoRemoteServiceIds.forEach(function (serviceId) {
                if (epoServiceIds.indexOf(serviceId) < 0) {
                  epoServiceIds.push(serviceId)
                }
              })
              epoServiceIds.sort()
              callback(error, epoServiceIds, !epoRemoteServiceIds.length)
            } else {
              callback(error)
            }
          })
      } else {
        callback(error)
      }
    }
  )
}

/**
 * Retrieves an array of strings containing the unique identifiers for the ePO
 * servers that are currently exposed to the DXL fabric.
 * @param {external:DxlClient} dxlClient - The DXL client with which to perform
 *   the request
 * @param {Function} callback - Callback function to invoke with the unique
 *   identifiers which are found. If an error occurs when performing the lookup,
 *   the first parameter supplied to the callback contains an `Error` object
 *   with failure details. On successful lookup, the array of unique identifier
 *   strings is provided as the second parameter to the callback.
 */
EpoClient.lookupEpoUniqueIdentifiers = function (dxlClient, callback) {
  lookupEpoUniqueIdentifiers(dxlClient,
    function (error, epoIds) {
      callback(error, epoIds)
    })
}

/**
 * Returns the list of remote commands that are supported by the ePO server
 * this client is communicating with.
 * @param {Function} responseCallback - Callback function to invoke with the
 *   remote commands which are found. If an error occurs when performing the
 *   command, the first parameter supplied to the callback contains an `Error`
 *   object with failure details. On successful execution of the command, the
 *   remote command output is provided as the second parameter to the callback.
 *
 *   If determination of the ePO unique identifier fails, the first parameter
 *   supplied to the callback contains an `Error` object with failure details.
 *   An `Error` object could be delivered for any of the following conditions:
 *
 *   * No value is provided for the `epoUniqueId` parameter during client
 *     construction and zero or more than 1 ePO service is found on the DXL
 *     fabric.
 *   * A value is provided for the `epoUniqueId` parameter during client
 *     construction but no ePO service matching the id is found on the DXL
 *     fabric.
 *   * An error occurs when trying to make DXL requests to the broker to
 *     query for available ePO services.
 * @example <caption>Example Usage</caption>
 * epoClient.help(function (helpError, helpText) {
 *   if (helpError) {
 *     console.log('Error getting help: ' + helpError.message)
 *   } else {
 *     console.log(helpText)
 *   }
 * })
 * @example <caption>Example Response Text</caption>
 * ComputerMgmt.createAgentDeploymentUrlCmd deployPath groupId [edit] [ahId]
 * [fallBackAhId] [urlName] [agentVersionNumber] [agentHotFix] - Create Agent
 * Deployment URL Command
 * ComputerMgmt.createCustomInstallPackageCmd deployPath [ahId] [fallBackAhId] -
 * Create Custom Install Package Command
 * ComputerMgmt.createDefaultAgentDeploymentUrlCmd tenantId - Create Default
 * Non-Editable Agent Deployment URL Command
 * ComputerMgmt.createTagGroup parentTagGroupId newTagGroupName - Create a new
 * subgroup under an existing tag group.
 * ComputerMgmt.deleteTag tagIds [forceDelete] - Delete one or more tags.
 */
EpoClient.prototype.help = function (responseCallback) {
  if (responseCallback) {
    this.runCommand(EPO_HELP_COMMAND,
      {
        responseCallback: function (error, response) {
          responseCallback(error, response ? response.join(os.EOL) : null)
        },
        outputFormat: OutputFormat.OBJECT
      })
  } else {
    throw new TypeError('No callback provided')
  }
}

/**
 * Invokes an ePO remote command on the ePO server this client is communicating
 * with.
 * @param {String} commandName - The name of the remote command to invoke.
 * @param {Object} [options] - Additional options to supply for the remote
 *   command.
 * @param {Function} [options.responseCallback] - Callback function to invoke
 *   with the results of the remote command.
 *
 *   If an error occurs when performing the command, the first parameter
 *   supplied to the callback contains an `Error` object with failure details.
 *   On successful execution of the command, the remote command output is
 *   provided as the second parameter to the callback. If supported for the
 *   remote command, the raw response payload should be formatted in JSON. The
 *   type of the response payload can be set via the `outputFormat` option.
 *
 *   If determination of the ePO unique identifier fails, the first parameter
 *   supplied to the callback contains an `Error` object with failure details.
 *   An `Error` object could be delivered for any of the following conditions:
 *
 *   * No value is provided for the `epoUniqueId` parameter during client
 *     construction and zero or more than 1 ePO service is found on the DXL
 *     fabric.
 *   * A value is provided for the `epoUniqueId` parameter during client
 *     construction but no ePO service matching the id is found on the DXL
 *     fabric.
 *   * An error occurs when trying to make DXL requests to the broker to
 *     query for available ePO services.
 * @param {Object} [options.params] - An object containing the parameters for
 *   the command.
 * @param {String} [options.outputFormat=object] - The output format for ePO
 *   to use when returning the response. The list of `output formats` can be
 *   found in the [OutputFormat]{@link module:OutputFormat} constants module.
 * @throws {TypeError} If the `outputFormat` is not valid.
 * @example <caption>Example Usage</caption>
 * epoClient.runCommand('system.find',
 *   {
 *     responseCallback: function (searchError, responseObj) {
 *       if (searchError) {
 *         console.log('Error finding system: ' + searchError.message)
 *       } else {
 *         console.log(JSON.stringify(responseObj, null, 2))
 *       }
 *     },
 *     params: {searchText: 'mySystem'}
 *   }
 * )
 * @example <caption>Example Response Text</caption>
 * [
 *   {
 *     "EPOBranchNode.AutoID": 7,
 *     "EPOComputerProperties.CPUSerialNum": "N/A",
 *     "EPOComputerProperties.CPUSpeed": 2794,
 *     "EPOComputerProperties.CPUType": "Intel(R) Core(TM) i7-4980HQ CPU @ 2.80GHz",
 *     "EPOComputerProperties.ComputerName": "mySystemForTesting",
 *     "EPOComputerProperties.DefaultLangID": "0409",
 *    ...
 *   }
 * ]
 */
EpoClient.prototype.runCommand = function (commandName, options) {
  const client = this

  const responseCallback = options.responseCallback
  const params = options.params || {}

  let outputFormat = options.outputFormat
  if (outputFormat) {
    OutputFormat.validate(outputFormat)
  } else {
    outputFormat = OutputFormat.OBJECT
  }

  if (client._epoServiceDetermined) {
    client._runCommand(commandName, outputFormat, params, responseCallback)
  } else {
    client._determineService(function (error) {
      if (error) {
        if (responseCallback) {
          responseCallback(error)
        }
      } else {
        client._runCommand(commandName, outputFormat, params, responseCallback)
      }
    })
  }
}

/**
 * Registers an event callback with the client to receive ePO threat events.
 * @param {Function} threatEventResponseCallback - The function that will
 *   receive ePO threat events. The first argument passed to the callback
 *   function is an object decoded from the JSON payload of the event content.
 *   The second argument passed to the callback function is the full DXL
 *   [Event]{@link external:Event} object.
 * @param {String} [topic=/mcafee/event/epo/threat/response] - The topic that
 *   ePO threat events are published to.
 * @example
 * epoClient.addThreatEventCallback(function (threatEventObj, originalEvent) {
 *   console.log('Threat event on topic: ' + originalEvent.destinationTopic)
 *   console.log(threatEventObj)
 * })
 */
EpoClient.prototype.addThreatEventCallback =
  function (threatEventResponseCallback, topic) {
    this._dxlClient.addEventCallback(topic || EPO_THREAT_EVENT_TOPIC,
      function (event) {
        const payload = MessageUtils.jsonPayloadToObject(event)
        threatEventResponseCallback(payload, event)
      })
  }

/**
 * Unregisters an event callback from the client so that it will no longer
 * receive ePO threat events.
 * @param {Function} threatEventResponseCallback - The function to unregister.
 * @param {String} [topic=/mcafee/event/epo/threat/response] - The topic that
 *   ePO threat events are published to.
 */
EpoClient.prototype.removeThreatEventCallback =
  function (threatEventResponseCallback, topic) {
    this._dxlClient.removeEventCallback(
      topic || EPO_THREAT_EVENT_TOPIC, threatEventResponseCallback)
  }

module.exports = EpoClient
