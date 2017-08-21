'use strict'
const Promise = require('bluebird')
const assert = require('assert')
const validateInput = require('../ValidationTools').validateInput
const Diag = require('../diag')

const D = new Diag('Handler')

class Handler {
    /**
     * Returns the specified object as a JSON response properly formatted for lambda.
     * @param {*any} jsonBody
     */
  responseAsJson (jsonBody, statusCode = 200) {
    jsonBody = jsonBody || '{}'
    let response = {
      statusCode: statusCode,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonBody)
    }
    return response
  }

  responseAsError (message, statusCode) {
    let response = {
      statusCode: statusCode,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({message: message})
    }
    return response
  }

  /**
   * Returns the UserID/principal ID of the request as a promise
   * If the request is not being made by an authenticated user, then an error will be raised.
   */
  getRequestPrincipal (event, context) {
    return Promise.try(() => {
      assert(context, 'context required')
      assert(context.protected && context.protected.claims, 'protected claims required. ensure authorized')
      assert(context.protected.claims.prn, 'prn claim required')
      let prn = context.protected.claims.prn
      assert(typeof prn === 'number', `unexpected prn type:${typeof prn}`)
      return prn
    })
  }

  validateInput (expectation, event) {
    D.log('validateInput event:', event)
    const body = JSON.parse(event.body)
    return validateInput(expectation, body)
  }
}
module.exports = Handler
