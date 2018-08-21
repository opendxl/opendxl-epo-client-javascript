# McAfee ePolicy Orchestrator (ePO) DXL JavaScript Client Library
[![Latest NPM Version](https://img.shields.io/npm/v/@opendxl/dxl-epo-client.svg)](https://www.npmjs.com/package/@opendxl/dxl-epo-client)
[![Build Status](https://img.shields.io/travis/opendxl/opendxl-epo-client-javascript/master.svg)](https://travis-ci.org/opendxl/opendxl-epo-client-javascript)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Overview

The
[McAfee ePolicy Orchestrator](https://www.mcafee.com/us/products/epolicy-orchestrator.aspx)
(ePO) DXL JavaScript client library provides a high level wrapper for invoking
ePO remote commands via the
[Data Exchange Layer](http://www.mcafee.com/us/solutions/data-exchange-layer.aspx)
(DXL) fabric.

The purpose of this library is to allow users to invoke ePO remote commands
without having to focus on lower-level details such as ePO-specific DXL topics
and message formats.

This client requires an ePO DXL service to be running and available on the DXL
fabric.

* If version 5.0 or later of the DXL ePO extensions are installed on your ePO
  server, an ePO DXL service should already be running on the fabric.
* If you are using an earlier version of the DXL ePO extensions, you can use the
  [McAfee ePolicy Orchestrator (ePO) DXL Python Service](https://github.com/opendxl/opendxl-epo-service-python).

## Documentation

See the [Wiki](https://github.com/opendxl/opendxl-epo-client-javascript/wiki)
for an overview of the McAfee ePolicy Orchestrator (ePO) DXL JavaScript Client
Library and examples.

See the
[McAfee ePolicy Orchestrator (ePO) DXL JavaScript Client Library Documentation](https://opendxl.github.io/opendxl-epo-client-javascript/jsdoc)
for installation instructions, API documentation, and examples.

## Installation

To start using the McAfee ePolicy Orchestrator (ePO) DXL JavaScript Client
Library:

* Download the [Latest Release](https://github.com/opendxl/opendxl-epo-client-javascript/releases/latest)
* Extract the release .zip file
* View the `README.html` file located at the root of the extracted files.
  * The `README` links to the documentation which includes installation instructions, API details, and samples.
  * The SDK documentation is also available on-line [here](https://opendxl.github.io/opendxl-epo-client-javascript/jsdoc).

## Bugs and Feedback

For bugs, questions and discussions please use the
[GitHub Issues](https://github.com/opendxl/opendxl-epo-client-javascript/issues).

## LICENSE

Copyright 2018 McAfee, LLC

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.
