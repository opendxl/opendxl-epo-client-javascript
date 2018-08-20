'use strict'

var os = require('os')
var inherits = require('inherits')
var dxl = require('@opendxl/dxl-client')
var Request = dxl.Request
var bootstrap = require('@opendxl/dxl-bootstrap')
var Client = bootstrap.Client
var MessageUtils = bootstrap.MessageUtils
var OutputFormat = require('./output-format')

// The type of the ePO DXL service that is registered with the fabric
var DXL_SERVICE_TYPE = '/mcafee/service/epo/remote'

// The prefix for ePO DXL service request topics
var DXL_REQUEST_PREFIX = DXL_SERVICE_TYPE + '/'

// The DXL topic to query for registered ePO service instances
var DXL_SERVICE_REGISTRY_QUERY_TOPIC = '/mcafee/service/dxl/svcregistry/query'

// The default DXL topic to listen to for ePO threat event messages
var EPO_THREAT_EVENT_TOPIC = '/mcafee/event/epo/threat/response'

// The name of the ePO 'help' remote command
var EPO_HELP_COMMAND = 'core.help'

// JSON output format for ePO remote command
var OUTPUT_FORMAT_JSON = 'json'

/**
 * @classdesc Responsible for all communication with the
 * Data Exchange Layer (DXL) fabric.
 * @external DxlClient
 * @see {@link https://opendxl.github.io/opendxl-client-javascript/jsdoc/Client.html}
 */

/**
 * @classdesc Event messages are sent using the
 * [sendEvent]{@link https://opendxl.github.io/opendxl-client-javascript/jsdoc/Client.html#sendEvent} method of a client
 * instance.
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
 * The {@link EpoClient.lookupEpoUniqueIdentifiers} method can be used to determine the
 * unique identifiers for ePO servers that are currently exposed to the fabric.
 *
 * @param {external:DxlClient} dxlClient - The DXL client to use for
 *   communication with the ePO DXL service
 * @param {String} [epoUniqueId=null] - The unique identifier used to specify
 *   the ePO server that this client will communicate with.
 * @param {Function} [callback=null] - Callback function which should be invoked
 *   after the ePO unique identifier has been determined and the client is
 *   ready to use.
 * @constructor
 */
function EpoClient (dxlClient, epoUniqueId, callback) {
  var that = this

  Client.call(this, dxlClient)

  this._epoIdSearchStatus =
    'ePO unique identifier not yet determined'
  this._epoUniqueId = epoUniqueId

  /**
   * Lookup the ePO unique identifier.
   * @param {Function} [callback=null] - Callback function which should be
   *   invoked after the ePO unique identifier has been determined and the
   *   client is ready to use.
   * @throws {Error} If either no unique identifier or more than one unique
   *   identifier can be found.
   * @private
   */
  this._getEpoId = function (callback) {
    EpoClient.lookupEpoUniqueIdentifiers(dxlClient,
      function (error, epoUniqueIds) {
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
        that._epoIdSearchStatus =
          error ? error.message : 'ePO id found'
        if (callback) {
          callback(error)
        }
      })
  }

  if (!epoUniqueId) {
    if (dxlClient.connected) {
      this._getEpoId(callback)
    } else {
      dxlClient.once('connect', function () { that._getEpoId(callback) })
    }
  } else {
    if (callback) {
      setImmediate(callback)
    }
  }
}

inherits(EpoClient, Client)

/**
 * Returns an array of strings containing the unique identifiers for the ePO
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
  var request = new Request(DXL_SERVICE_REGISTRY_QUERY_TOPIC)
  MessageUtils.objectToJsonPayload(request, {serviceType: DXL_SERVICE_TYPE})
  dxlClient.asyncRequest(request, function (error, response) {
    var returnIds = null
    if (response) {
      try {
        var responseObj = MessageUtils.jsonPayloadToObject(response)
        returnIds = []
        var services = responseObj.services
        if (services) {
          Object.keys(services).forEach(function (serviceKey) {
            var requestChannels = services[serviceKey].requestChannels
            if (requestChannels) {
              requestChannels.forEach(function (channel) {
                if (channel.startsWith(DXL_REQUEST_PREFIX)) {
                  returnIds.push(channel.substring(DXL_REQUEST_PREFIX.length))
                }
              })
            }
          })
        }
      } catch (err) {
        error = err
      }
    }
    callback(error, returnIds)
  })
}

/**
 * Returns the list of remote commands that are supported by the ePO server
 * this client is communicating with.
 * @param {Function} callback - Callback function to invoke with the remote
 *   commands which are found. If an error occurs when performing the command,
 *   the first parameter supplied to the callback contains an `Error` object
 *   with failure details. On successful execution of the command, the remote
 *   command output is provided as the second parameter to the callback.
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
EpoClient.prototype.help = function (callback) {
  this.runCommand(EPO_HELP_COMMAND,
    function (error, response) {
      callback(error, response.join(os.EOL))
    },
    {},
    OutputFormat.OBJECT)
}

/**
 * Invokes an ePO remote command on the ePO server this client is communicating
 * with.
 * @param {String} commandName - The name of the remote command to invoke.
 * @param {Function} callback - Callback function to invoke with the results of
 *   the remote command. If an error occurs when performing the command,
 *   the first parameter supplied to the callback contains an `Error` object
 *   with failure details. On successful execution of the command, the remote
 *   command output is provided as the second parameter to the callback. If
 *   supported for the remote command, the raw response payload should be
 *   formatted in JSON. The type of the response payload can be set via the
 *   `outputFormat` option.
 * @param {Object} [options] - Additional options to supply for the remote
 *   command.
 * @param {Object} [options.params={}] - An object containing the parameters for
 *   the command.
 * @param {String} [options.outputFormat=object] - The output format for ePO
 *   to use when returning the response. The list of `output formats` can be
 *   found in the [OutputFormat]{@link module:OutputFormat} constants module.
 * @throws {TypeError} If the `outputFormat` is not valid.
 * @example <caption>Example Usage</caption>
 * epoClient.runCommand('system.find',
 *   function (searchError, responseText) {
 *     if (searchError) {
 *       console.log('Error finding system: ' + searchError.message)
 *     } else {
 *       console.log(JSON.stringify(responseObj, null, 2))
 *     }
 *   },
 *   {params: {searchText: 'mySystem'}}
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
EpoClient.prototype.runCommand = function (commandName, callback, options) {
  var params = options.params || {}

  var outputFormat = options.outputFormat
  if (outputFormat) {
    OutputFormat.validate(outputFormat)
  } else {
    outputFormat = OutputFormat.OBJECT
  }

  if (this._epoUniqueId) {
    var request = new Request(DXL_REQUEST_PREFIX + this._epoUniqueId)
    MessageUtils.objectToJsonPayload(request, {
      command: commandName,
      output: OUTPUT_FORMAT_JSON,
      params: params
    })
    this._dxlClient.asyncRequest(request, function (error, response) {
      var responsePayload = null
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
      callback(error, responsePayload)
    })
  } else {
    callback(new Error(this._epoIdSearchStatus))
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
        var payload = MessageUtils.jsonPayloadToObject(event)
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
