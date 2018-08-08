// This sample invokes and displays the results of the "core help" remote
// command via the ePO DXL service. The "core help" command lists the
// remote commands that are exposed by the particular ePO server.
//
// NOTE: Prior to running this sample you must provide values for the following
//       constants in this file:
//
//       EPO_UNIQUE_ID : The unique identifier used to identify the ePO server
//                       on the DXL fabric.
//
//                       If only one ePO server is connected to the DXL fabric
//                       this constant can be set to null (the client will
//                       automatically determine the ePO's unique identifier).

'use strict'

var common = require('../common')
var dxl = common.require('@opendxl/dxl-client')
var MessageUtils = common.require('@opendxl/dxl-bootstrap').MessageUtils
var EpoClient = common.require('@opendxl/dxl-epo-client').EpoClient

// Create DXL configuration from file
var config = dxl.Config.createDxlConfigFromFile(common.CONFIG_FILE)

// Create the client
var client = new dxl.Client(config)

// The ePO unique identifier
var EPO_UNIQUE_ID = null

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
        // Run the help command
        epoClient.help(function (helpError, helpText) {
          // Destroy the client - frees up resources so that the application
          // stops running
          client.destroy()
          if (helpError) {
            console.log('Error getting help: ' + helpError.message)
          } else {
            // Display the help
            console.log(MessageUtils.decode(helpText))
          }
        })
      }
    }
  )
})
