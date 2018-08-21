### Prerequisites

* OpenDXL JavaScript Client (Node.js) library installed
  * <https://github.com/opendxl/opendxl-client-javascript>

* The OpenDXL JavaScript Client (Node.js) prerequisites must be satisfied
  * <https://opendxl.github.io/opendxl-client-javascript/jsdoc/tutorial-installation.html>

* McAfee ePolicy Orchestrator (ePO) service is running and available on DXL
  fabric

  * If version 5.0 or later of the DXL ePO extensions are installed on your ePO
    server, an ePO DXL service should already be running on the fabric.

  * If you are using an earlier version of the DXL ePO extensions, you can use the
    [McAfee ePolicy Orchestrator (ePO) DXL Python Service](https://github.com/opendxl/opendxl-epo-service-python).

* OpenDXL JavaScript Client (Node.js) has permission to invoke ePO remote commands

  * If version 5.0 or later of DXL ePO extensions are installed on your ePO
    server, follow the steps on the
    [ePO DXL Python Client Authorization](https://opendxl.github.io/opendxl-epo-client-python/pydoc/authorization.html)
    page to ensure that the OpenDXL JavaScript client has appropriate
    authorization to perform ePO remote commands.

  * If you are using the standalone
    [ePO DXL Python Service](https://github.com/opendxl/opendxl-epo-service-python)
    to proxy remote commands to the ePO server, follow the steps on the
    [ePO DXL Python Service Authorization](https://opendxl.github.io/opendxl-epo-service-python/pydoc/authorization.html#client-authorization)
    page to ensure that the OpenDXL Python client has appropriate authorization
    to perform ePO remote commands.

* Node.js 4.0 or higher installed.

### Installation

Before installing the ePO DXL JavaScript client library, change to the
directory which you extracted from the SDK zip file. For example:

```sh
cd {@releasezipname}
```

To install the library from a local tarball for a Mac or Linux-based operating
system, run the following command:

```sh
npm install ./lib/{@releasetarballname} --save
```

To install the library from a local tarball for Windows, run:

```sh
npm install .\lib\{@releasetarballname} --save
```

To install the library via the
[npm package registry](https://www.npmjs.com/package/@opendxl/dxl-epo-client), run:

```sh
npm install @opendxl/dxl-epo-client --save
```
