This sample invokes and displays the results of the "core help" remote command
via the ePO DXL service. The "core help" command lists the remote commands that
are exposed by a particular ePO server.

### Prerequisites

* The samples configuration step has been completed (see {@tutorial samples}).
* An ePO DXL service is running and available on the fabric. If version 5.0
  or later of the DXL ePO extensions are installed on your ePO server, an
  ePO DXL service should already be running on the fabric. If you are using an
  earlier version of the DXL ePO extensions, you can use the
  [ePO DXL Python Service](https://github.com/opendxl/opendxl-epo-service-python).
* The client is authorized to invoke the ePO DXL Service, and the user that is
  connecting to the ePO server (within the ePO DXL service) has permission to
  execute the "core help" remote command (see
  [ePO DXL Python Client Authorization](https://opendxl.github.io/opendxl-epo-client-python/pydoc/authorization.html)).

### Setup

Modify the example to include the `unique identifier` associated with the ePO
to invoke the remote command on.

For more information on the ePO unique identifier, refer to the following:

* [Configuration File for ePO DXL Python Service (uniqueId property)](https://opendxl.github.io/opendxl-epo-service-python/pydoc/configuration.html#dxl-service-configuration-file-dxleposervice-config>)
* The [EpoClient.lookupEpoUniqueIdentifiers()]{@link EpoClient.lookupEpoUniqueIdentifiers}
  method which will return an array of strings containing the identifiers for
  all ePO servers that are currently connected to the fabric.

For example:

```js
var EPO_UNIQUE_ID = 'epo1'
```

If only one ePO server is connected to the DXL fabric this constant can be
set to `null` (the client will automatically determine the ePO's unique
identifier).

### Running

To run this sample execute the ``sample/basic/basic-core-help-example.js``
script as follows:

```sh
$ node sample/basic/basic-core-help-example.js
```

The output should appear similar to the following:

```
ComputerMgmt.createAgentDeploymentUrlCmd deployPath groupId [edit] [ahId]
[fallBackAhId] [urlName] [agentVersionNumber] [agentHotFix] - Create Agent
Deployment URL Command
ComputerMgmt.createCustomInstallPackageCmd deployPath [ahId] [fallBackAhId] -
Create Custom Install Package Command
ComputerMgmt.createDefaultAgentDeploymentUrlCmd tenantId - Create Default
Non-Editable Agent Deployment URL Command
ComputerMgmt.createTagGroup parentTagGroupId newTagGroupName - Create a new
subgroup under an existing tag group.
ComputerMgmt.deleteTag tagIds [forceDelete] - Delete one or more tags.
ComputerMgmt.deleteTagGroup tagGroupIds [deleteTags] - Delete one or more Tag
Groups.
ComputerMgmt.listAllTagGroups - List All Tag Groups in Tag Group Tree
ComputerMgmt.moveTagsToTagGroup tagIds tagGroupId - Move tags to an existing tag
group.
...
```

Each remote command exposed by the particular ePO server is listed along with
its associated parameters.

### Details

The majority of the sample code is shown below:

```js
// Create the client
var client = new dxl.Client(config)

// The ePO unique identifier
var EPO_UNIQUE_ID = null

// Connect to the fabric, supplying a callback function which is invoked
// when the connection has been established
client.connect(function () {
  // Create the ePO client
  var epoClient = new EpoClient(client, EPO_UNIQUE_ID)

  // Run the help command
  epoClient.help(function (helpError, helpText) {
    // Destroy the client - frees up resources so that the application
    // stops running
    client.destroy()
    if (helpError) {
      console.log('Error getting help: ' + helpError.message)
    } else {
      // Display the help
      console.log(helpText)
    }
  })
})
```

Once a connection is established to the DXL fabric, the callback function
supplied to the DXL client instance's
[connect()](https://opendxl.github.io/opendxl-client-javascript/jsdoc/Client.html#connect)
method will be invoked. From within the callback function, an {@link EpoClient}
instance is created. The EpoClient instance will be used to invoke remote
commands on the ePO server.

The `unique identifier` of the ePO server to invoke remote commands on is
specified as an parameter to the client constructor. In this particular case, a
value of `null` is specified, which triggers the client to automatically
determine the ePO server's unique identifier.

Next, the EpoClient instance's [help()]{@link EpoClient#help} method is called
to invoke the `help` remote command on the ePO server. On successful execution
of the ePO remote command, the `helpText` parameter provided to the callback
function contains the command results. If the help command fails due to zero or
multiple ePO servers being connected to the fabric, an error with failure
details will be provided to the `searchError` parameter.
