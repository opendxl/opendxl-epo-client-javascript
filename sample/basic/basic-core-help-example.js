'use strict'

var common = require('../common')
var dxl = require('@opendxl/dxl-client')
var epo = common.requireEpoClient()
var EpoClient = epo.EpoClient
var MessageUtils = require('@opendxl/dxl-bootstrap').MessageUtils

// Create DXL configuration from file
var config = dxl.Config.createDxlConfigFromFile(common.CONFIG_FILE)

// Create the client
var client = new dxl.Client(config)

var EPO_UNIQUE_ID = null

// Connect to the fabric, supplying a callback function which is invoked
// when the connection has been established
client.connect(function () {
  var epoClient = new EpoClient(client, EPO_UNIQUE_ID,
    function (clientError) {
      if (clientError) {
        client.destroy()
        console.log('Error creating ePO client: ' + clientError.message)
      } else {
        epoClient.help(function (helpError, helpText) {
          client.destroy()
          if (helpError) {
            console.log('Error getting help: ' + helpError.message)
          } else {
            console.log(MessageUtils.decode(helpText))
          }
        })
      }
    }
  )
})
