/**
 * @module OutputFormat
 * @description Constants that are used to indicate the `output format`
 * for ePO to use when responding to a remote command invocation.
 */

'use strict'

module.exports = {
  /**
   * JSON format
   */
  JSON: 'json',
  /**
   * XML format
   */
  XML: 'xml',
  /**
   * Text-based format (verbose)
   */
  VERBOSE: 'verbose',
  /**
   * Text-based format (terse)
   */
  TERSE: 'terse',
  /**
   * Validates that the specified format is valid (json, xml, etc.).
   * @param {String} outputFormat - The output format
   * @throws {TypeError} If the format is not valid.
   */
  validate: function (outputFormat) {
    if ([module.exports.JSON,
      module.exports.XML,
      module.exports.VERBOSE,
      module.exports.TERSE].indexOf(outputFormat) < 0) {
      throw TypeError('Invalid output format: ' + outputFormat)
    }
  }
}
