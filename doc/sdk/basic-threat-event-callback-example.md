This sample demonstrates registering a callback with the DXL fabric to receive
threat events when ePO sends them. The topic and payload for each event which is
received is displayed in JSON format.

### Prerequisites

* The samples configuration step has been completed (see {@tutorial samples}).

### Running

To run this sample execute the
``sample/basic/basic-threat-event-callback-example.js`` script as follows:

```sh
$ node sample/basic/basic-threat-event-callback-example.js
```

The output should appear similar to the following:

```
Waiting for threat event notifications...
```

At this point the sample is listening for threat events from the DXL fabric.

The actual steps to force a threat event to be sent by ePO are outside the scope
of this client library. After the event has been sent, the event information
should appear with the console that the sample is running (similar to the
output below):

```
Threat event on topic: /mcafee/event/epo/threat/response
<event json...> 
```

### Details

The majority of the sample code is shown below:

```js
// Connect to the fabric, supplying a callback function which is invoked
// when the connection has been established
client.connect(function () {
  // Create the ePO client
  var epoClient = new EpoClient(client)

  // Register the ePO threat event callback with the client
  epoClient.addThreatEventCallback(function (threatEventObj, originalEvent) {
    // Display the DXL topic that the event was received on
    console.log('Threat event on topic: ' + originalEvent.destinationTopic)

    // Dump the threat event object
    console.log(MessageUtils.objectToJson(threatEventObj, true))
  })

  // Wait forever
  console.log('Waiting for threat event notifications...')
})
```

Once a connection is established to the DXL fabric, the callback function
supplied to the DXL client instance's
[connect()](https://opendxl.github.io/opendxl-client-javascript/jsdoc/Client.html#connect)
method will be invoked. From within the callback function, an {@link EpoClient}
instance is created.

Next, the EpoClient instance's
[addThreatEventCallback()]{@link EpoClient#addThreatEventCallback} method
is called with a callback function to invoke as each threat event is received. 

When a threat event is received, the event callback is invoked with two
parameters:

* A JavaScript object, `threatEventObj`, which is decoded from the threat
  event JSON payload.
* The full DXL
  [event message](https://opendxl.github.io/opendxl-client-javascript/jsdoc/Event.html)
  which is sent for the threat event.

The threat event object is formatted as a pretty-printed string via a call to
the
[MessageUtils.objectToJson()](https://opendxl.github.io/opendxl-bootstrap-javascript/jsdoc/module-MessageUtils.html#.jsonToObject)
method and then displayed to the console.