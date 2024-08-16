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

const common = require('../common')
const dxl = common.require('@opendxl/dxl-client')
const MessageUtils = common.require('@opendxl/dxl-bootstrap').MessageUtils
const epo = common.require('@opendxl/dxl-epo-client')
const EpoClient = epo.EpoClient

// Create DXL configuration from file
const config = dxl.Config.createDxlConfigFromFile(common.CONFIG_FILE)

// Create the client
const client = new dxl.Client(config)

// The ePO unique identifier
const EPO_UNIQUE_ID = null

// The search text
const SEARCH_TEXT = '<specify-find-search-text>'

// Connect to the fabric, supplying a callback function which is invoked
// when the connection has been established
client.connect(function () {
  // Create the ePO client
  const epoClient = new EpoClient(client, EPO_UNIQUE_ID)

  // Run the system find command
  epoClient.runCommand('system.find',
    {
      responseCallback: function (searchError, responseObj) {
        // Destroy the client - frees up resources so that the application
        // stops running
        client.destroy()
        if (searchError) {
          console.log('Error finding system: ' + searchError.message)
        } else {
          // Display the results
          console.log(MessageUtils.objectToJson(responseObj, true))
        }
      },
      params: { searchText: SEARCH_TEXT }
    }
  )
})
