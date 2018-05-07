'use strict'

var common = require('../common')
var dxl = require('@opendxl/dxl-client')
var epo = common.requireEpoClient()
var MessageUtils = require('@opendxl/dxl-bootstrap').MessageUtils
var EpoClient = epo.EpoClient

// Create DXL configuration from file
var config = dxl.Config.createDxlConfigFromFile(common.CONFIG_FILE)

// Create the client
var client = new dxl.Client(config)

// Connect to the fabric, supplying a callback function which is invoked
// when the connection has been established
client.connect(function () {
  var epoClient = new EpoClient(client)
  epoClient.addThreatEventCallback(function (threatEventObj, originalEvent) {
    console.log('Threat event on topic: ' + originalEvent.destinationTopic)
    console.log(MessageUtils.objectToJson(threatEventObj, true))
  })
  console.log('Waiting for threat event notifications...')
})
