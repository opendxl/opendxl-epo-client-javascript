'use strict'

var common = require('../common')
var dxl = require('@opendxl/dxl-client')
var epo = common.requireEpoClient()
var MessageUtils = require('@opendxl/dxl-bootstrap').MessageUtils
var EpoClient = epo.EpoClient
var OutputFormat = epo.OutputFormat

// Create DXL configuration from file
var config = dxl.Config.createDxlConfigFromFile(common.CONFIG_FILE)

// Create the client
var client = new dxl.Client(config)

var EPO_UNIQUE_ID = null
var SEARCH_TEXT = '<specify-find-search-text>'

// Connect to the fabric, supplying a callback function which is invoked
// when the connection has been established
client.connect(function () {
  var epoClient = new EpoClient(client, EPO_UNIQUE_ID,
    function (clientError) {
      if (clientError) {
        client.destroy()
        console.log('Error creating ePO client: ' + clientError.message)
      } else {
        epoClient.runCommand('system.find',
          function (searchError, responseText) {
            client.destroy()
            if (searchError) {
              console.log('Error finding system: ' + searchError.message)
            } else {
              var responseObj = MessageUtils.jsonToObject(
                MessageUtils.decode(responseText))
              console.log(MessageUtils.objectToJson(responseObj, true))
            }
          },
          {searchText: SEARCH_TEXT},
          OutputFormat.JSON
        )
      }
    }
  )
})
