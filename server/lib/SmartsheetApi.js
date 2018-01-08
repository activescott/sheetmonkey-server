'use strict'
const Promise = require('bluebird')
const Diag = require('./Diag')
const crypto = require('crypto')
const assert = require('assert')
const request = require('request')

const D = new Diag('SmartsheetApi')

const BASE_URL = 'https://api.smartsheet.com/2.0'

class SmartsheetApi {
  /**
   * Initializes a new SmartsheetApi instance.
   * @param {*object} tokens (optional) An object with `access_token`, `refresh_token`, and `expires_at` values.
   */
  constructor (tokens, clientID, clientSecret) {
    // Caller may not provide tokens (as he'll get them via this.refreshTokens later, so we'll start with some expired tokens to keep the rest of the code happy)
    this._tokens = tokens || SmartsheetApi.createExpiredTokens()
    if (!clientID) {
      assert('SS_CLIENT_ID' in process.env, 'missing environment variable: SS_CLIENT_ID')
      this._clientID = process.env.SS_CLIENT_ID
    } else {
      assert(clientSecret, 'clientID was provided by not secret.')
      this._clientID = clientID
    }
    if (!clientSecret) {
      assert('SS_CLIENT_SECRET' in process.env, 'missing environment variable: SS_CLIENT_SECRET')
      this._clientSecret = process.env.SS_CLIENT_SECRET
    } else {
      assert(clientID, 'clientSecret was provided but not secret.')
      this._clientSecret = clientSecret
    }
  }

  static createExpiredTokens () {
    return {
      access_token: 'xxx',
      refresh_token: 'xxx',
      expires_at: (Date.now() - 10000) / 1000 // Date works in milliseconds since epoch, but expires_at is seconds since epoch
    }
  }

  /**
   * Exchanges the specified code for the access/refresh token and expires values. Returned object looks like:
   *  {
   *   "access_token":"xxxxx",
   *   "token_type":"bearer",
   *   "refresh_token":"xxxx",
   *   "expires_at":1498549175
   *  }
   * Also sets the current object's tokens value with the returned tokens.
   *
   * Only one of code or refreshToken should be specified!
   * @param {*string} code The authorization code from the OAuth redirect.
   * @param {*string} refreshToken The refreshToken to use to refresh a token.
   */
  refreshToken (code, refreshToken) {
    assert(this._clientID, 'Client ID not provided')
    assert(this._clientSecret, 'Client Secret not provided')
    assert(code || refreshToken, 'Expected code or refresh token')
    const hashInput = `${this._clientSecret}|${code || refreshToken}`
    const hasher = crypto.createHash('sha256')
    hasher.update(hashInput)
    const hash = hasher.digest('hex')
    const formData = {
      'client_id': this._clientID,
      'hash': hash
    }
    if (code) {
      formData.grant_type = 'authorization_code'
      formData.code = code
    } else {
      formData.grant_type = 'refresh_token'
      formData.refresh_token = refreshToken
    }
    const options = {
      method: 'POST',
      url: BASE_URL + '/token',
      form: formData // <- Note that request.post will translate `form` to application/x-www-form-urlencoded data
    }
    D.log('refreshToken request:', options)
    return SmartsheetApi._httpRequestImpl(options)
      .then(httpResponse => {
        D.log('refreshToken httpResponse:', httpResponse)
        if (httpResponse.statusCode !== 200) {
          throw new Error(`Smartsheet returned an error. Status code: ${httpResponse.statusCode}. Status message: ${httpResponse.statusMessage}. Body:${httpResponse.body}`)
        }
        const body = JSON.parse(httpResponse.body)
        let response = {};
        ['access_token', 'token_type', 'refresh_token'].forEach(p => {
          response[p] = body[p]
        })
        // Note Smartsheet's API returns expires_in which is in seconds. We convert to JWT-style IntDate (The number of seconds from 1970-01-01T0:0:0Z as measured in UTC until the desired date/time):
        const nowInSeconds = Date.now() / 1000
        response.expires_at = nowInSeconds + body.expires_in
        this._tokens = response
        return response
      })
  }

  httpGet (path) {
    return this.httpRequest('GET', path)
  }

  /**
   * Makes the specified http request to the smartsheet API
   * @param {*string} httpMethod http method (default: "GET")
   * @param {*string} path http request path (relative to the Smartsheet API base URL)
   * @param {*string} body entity body for PATCH, POST and PUT requests
   */
  httpRequest (httpMethod, path, body = '', throwOnError = true) {
    return Promise.try(() => {
      // TODO: check validity of token and refresh if needed. Also need to raise an event so caller can save the new tokens.

      // https://www.npmjs.com/package/request#requestoptions-callback
      if (!path.startsWith('/')) {
        path = '/' + path
      }
      const options = {
        url: BASE_URL + path,
        method: httpMethod || 'GET',
        headers: {
          'Authorization': `Bearer ${this._tokens.access_token}`
        }
      }
      if (body) {
        options.body = body
      }
      // D.log('sending request: ', options)
      return SmartsheetApi._httpRequestImpl(options).then(httpResponse => {
        // D.log('httpResponse:', httpResponse)
        if (httpResponse.statusCode < 200 || httpResponse.statusCode >= 300) {
          if (throwOnError) {
            throw new Error(`Unexpected statusCode from Smartsheet:${httpResponse.statusCode}. Response body:${httpResponse.body}`)
          }
        }
        return httpResponse
      })
    })
  }

  /**
   * Gets the current User: http://smartsheet-platform.github.io/api-docs/?shell#get-current-user
   */
  me () {
    return this.httpGet('/users/me').then(httpResponse => {
      let meResponse
      try {
        meResponse = JSON.parse(httpResponse.body)
      } catch (e) {
        D.log('me: Error parsing JSON response:', httpResponse.body)
        throw new Error('me: Error parsing JSON response')
      }
      return meResponse
    })
  }
}

/** for mocking the underlying HTTP Request Impl */

const httpRequestDefaultImpl = (options) => {
  // https://www.npmjs.com/package/request#requestoptions-callback
  // In tests, the test can push on some httpResponse results to mock the actual HTTP API. We serve those here:
  if (SmartsheetApi._mockResponseStack && SmartsheetApi._mockResponseStack.length > 0) {
    return Promise.resolve(SmartsheetApi._mockResponseStack.pop())
  }
  return Promise.fromCallback(cb => request(options, cb), { multiArgs: true }).then(responseValues => {
    // request returns an array where the first element is the responseObject and the second is the body (which is also available via response.body). I'm simplifying here.
    return responseValues[0]
  })
}

SmartsheetApi._httpRequestImpl = SmartsheetApi._httpRequestDefaultImpl = httpRequestDefaultImpl
SmartsheetApi._mockResponseStack = []

module.exports = SmartsheetApi
