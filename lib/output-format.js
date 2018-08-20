/**
 * @module OutputFormat
 * @description Constants that are used to indicate the `output format`
 * for ePO to use when responding to a remote command invocation.
 */

'use strict'

module.exports = {
  /**
   * Return response payload as a `binary`
   * [Buffer]{@link https://nodejs.org/api/buffer.html}.
   */
  BINARY: 'binary',
  /**
   * Return response payload as a `string`.
   */
  STRING: 'string',
  /**
   * Return response payload as a JavaScript `object`.
   */
  OBJECT: 'object',
  /**
   * Validates that the specified format is valid (binary, string, object).
   * @param {String} outputFormat - The output format
   * @throws {TypeError} If the format is not valid.
   */
  validate: function (outputFormat) {
    if ([module.exports.BINARY,
      module.exports.STRING,
      module.exports.OBJECT].indexOf(outputFormat) < 0) {
      throw TypeError('Invalid output format: ' + outputFormat)
    }
  }
}
