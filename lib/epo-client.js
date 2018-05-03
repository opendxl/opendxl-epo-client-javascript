'use strict'

var inherits = require('inherits')
var dxl = require('@opendxl/dxl-client')
var Request = dxl.Request
var bootstrap = require('@opendxl/dxl-bootstrap')
var Client = bootstrap.Client
var MessageUtils = bootstrap.MessageUtils
var OutputFormat = require('./output-format')

var DXL_SERVICE_TYPE = '/mcafee/service/epo/remote'
var DXL_REQUEST_PREFIX = DXL_SERVICE_TYPE + '/'
var DXL_SERVICE_REGISTRY_QUERY_TOPIC = '/mcafee/service/dxl/svcregistry/query'

var EPO_HELP_COMMAND = 'core.help'

/**
 * The ePO client
 * @param dxlClient
 * @param epoUniqueId
 * @param callback
 * @constructor
 */
function EpoClient (dxlClient, epoUniqueId, callback) {
  var that = this

  Client.call(this, dxlClient)

  this._epoIdSearchStatus =
    'ePO unique identifier not yet determined'
  this._epoUniqueId = epoUniqueId

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

EpoClient.prototype.help = function (callback, outputFormat) {
  this.runCommand(EPO_HELP_COMMAND,
    callback, {}, outputFormat || OutputFormat.VERBOSE)
}

EpoClient.prototype.runCommand = function (commandName, callback,
                                           params, outputFormat) {
  params = params || {}
  if (outputFormat) {
    OutputFormat.validate(outputFormat)
  } else {
    outputFormat = OutputFormat.JSON
  }

  if (this._epoUniqueId) {
    var request = new Request(DXL_REQUEST_PREFIX + this._epoUniqueId)
    MessageUtils.objectToJsonPayload(request, {
      command: commandName,
      output: outputFormat,
      params: params
    })
    this._dxlClient.asyncRequest(request, function (error, response) {
      if (response) {
        response = MessageUtils.decodePayload(response)
      }
      callback(error, response)
    })
  } else {
    callback(new Error(this._epoIdSearchStatus))
  }
}

module.exports = EpoClient
