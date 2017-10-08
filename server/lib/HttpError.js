'use strict'

// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#ES6_Custom_Error_Class

/**
 * An error with an easy way to specify the HTTP status code for the result.
 */
class HttpError extends Error {
  constructor (httpStatusCode, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params)

    // Custom debugging information
    this.httpStatusCode = httpStatusCode
  }
}

module.exports = HttpError
