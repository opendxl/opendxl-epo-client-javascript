'use strict'

var fs = require('fs')
var path = require('path')

var CONFIG_FILE_NAME = 'dxlclient.config'

module.exports = {
  CONFIG_FILE: path.join(__dirname, CONFIG_FILE_NAME),
  requireEpoClient: function () {
    var localPackageName = '@opendxl/dxl-epo-client'
    var packageFile = path.join(__dirname, '..', 'package.json')
    var module
    // Use local library sources if the example is being run from within a local
    // repository clone.
    if (fs.existsSync(packageFile)) {
      var packageInfo = JSON.parse(fs.readFileSync(packageFile))
      if (packageInfo.name === localPackageName) {
        module = require(path.dirname(packageFile))
      }
    }
    if (!module) {
      // The example does not appear to be running from within a local
      // repository clone, so attempt to require by the package name.
      module = require(localPackageName)
    }
    return module
  }
}
