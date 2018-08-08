// This sample invokes and displays the results of the "system find" command via
// the ePO DXL service. The results of the find command are displayed in JSON
// format.
//
// NOTE: Prior to running this sample you must provide values for the following
//       constants in this file:
//
//        EPO_UNIQUE_ID : The unique identifier used to identify the ePO server
//                        on the DXL fabric.
//
//                        If only one ePO server is connected to the DXL fabric
//                        this constant can be set to null (the client will
//                        automatically determine the ePO's unique identifier).
//
//       SEARCH_TEXT   : The search text to use (system name, etc.)

'use strict'

var common = require('../common')
var dxl = common.require('@opendxl/dxl-client')
var MessageUtils = common.require('@opendxl/dxl-bootstrap').MessageUtils
var epo = common.require('@opendxl/dxl-epo-client')
var EpoClient = epo.EpoClient
var OutputFormat = epo.OutputFormat

// Create DXL configuration from file
var config = dxl.Config.createDxlConfigFromFile(common.CONFIG_FILE)

// Create the client
var client = new dxl.Client(config)

// The ePO unique identifier
var EPO_UNIQUE_ID = null

// The search text
var SEARCH_TEXT = '<specify-find-search-text>'

// Connect to the fabric, supplying a callback function which is invoked
// when the connection has been established
client.connect(function () {
  // Create the ePO client
  var epoClient = new EpoClient(client, EPO_UNIQUE_ID,
    function (clientError) {
      if (clientError) {
        // Destroy the client - frees up resources so that the application
        // stops running
        client.destroy()
        console.log('Error creating ePO client: ' + clientError.message)
      } else {
        // Run the system find command
        epoClient.runCommand('system.find',
          function (searchError, responseText) {
            // Destroy the client - frees up resources so that the application
            // stops running
            client.destroy()
            if (searchError) {
              console.log('Error finding system: ' + searchError.message)
            } else {
              // Load find result into object
              var responseObj = MessageUtils.jsonToObject(
                MessageUtils.decode(responseText))
              // Display the results
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
