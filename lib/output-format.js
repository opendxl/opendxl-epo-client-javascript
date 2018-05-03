/**
 * @module OutputFormat
 */

'use strict'

module.exports = {
  JSON: 'json',
  XML: 'xml',
  VERBOSE: 'verbose',
  TERSE: 'terse',
  validate: function (outputFormat) {
    if ([module.exports.JSON,
      module.exports.XML,
      module.exports.VERBOSE,
      module.exports.TERSE].indexOf(outputFormat) < 0) {
      throw TypeError('Invalid output format: ' + outputFormat)
    }
  }
}
