### Prerequisites

* OpenDXL JavaScript Client (Node.js) library installed
  * <https://github.com/opendxl/opendxl-client-javascript>

* The OpenDXL JavaScript Client (Node.js) prerequisites must be satisfied
  * <https://opendxl.github.io/opendxl-client-javascript/jsdoc/tutorial-installation.html>

* McAfee ePolicy Orchestrator (ePO) service is running and available on DXL
  fabric
  * <https://github.com/opendxl/opendxl-epo-service-python> (Python-based service implementation)

* OpenDXL JavaScript Client (Node.js) has permission to invoke ePO remote commands
  * <https://opendxl.github.io/opendxl-epo-service-python/pydoc/authorization.html#client-authorization>

* Node.js 4.0 or higher installed.

### Installation

Before installing the ePO DXL JavaScript client library, change to the
directory which you extracted from the SDK zip file. For example:

```sh
cd {@releasezipname}
```

To install the client from a local tarball for a Mac or Linux-based operating
system, run the following command:

```sh
npm install lib/{@releasetarballname} --save
```

To install the client from a local tarball for Windows, run:

```sh
npm install lib\{@releasetarballname} --save
```

To install the client via the
[npm package registry](https://www.npmjs.com/package/@opendxl/dxl-epo-client), run:

```sh
npm install @opendxl/dxl-epo-client --save
```
