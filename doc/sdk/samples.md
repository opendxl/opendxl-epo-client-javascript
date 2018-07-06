The ePO DXL JavaScript client distribution contains a configuration file
(`dxlclient.config`) located in the ``sample`` sub-directory that must be
populated in order for the samples to connect to the DXL fabric.

The steps to populate this configuration file are the same as those documented
in the `OpenDXL JavaScript Client (Node.js) SDK`, see the
[OpenDXL JavaScript Client (Node.js) SDK Samples](https://opendxl.github.io/opendxl-client-javascript/jsdoc/tutorial-samples.html)
page for more information.

The following is an example of a populated configuration file:

```ini
[Certs]
BrokerCertChain=c:\\certificates\\brokercerts.crt
CertFile=c:\\certificates\\client.crt
PrivateKey=c:\\certificates\\client.key

[Brokers]
{5d73b77f-8c4b-4ae0-b437-febd12facfd4}={5d73b77f-8c4b-4ae0-b437-febd12facfd4};8883;mybroker.mcafee.com;192.168.1.12
{24397e4d-645f-4f2f-974f-f98c55bdddf7}={24397e4d-645f-4f2f-974f-f98c55bdddf7};8883;mybroker2.mcafee.com;192.168.1.13
```
