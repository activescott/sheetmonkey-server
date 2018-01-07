'use strict'
const Handler = require('./Handler')
const Diag = require('../diag')
const JwtHandler = require('./JwtHandler')
const Promise = require('bluebird')
const assert = require('assert')

const D = new Diag('OAuthClientHandler')

class OAuthClientHandler extends Handler {
  constructor (smartsheetApi, db) {
    super()
    assert(smartsheetApi, 'smartsheetApi required')
    this.smartsheetApi = smartsheetApi
    assert(db, 'db arg required')
    this.db = db
  }
  /**
   * Handles the OAuth redirect with the Authorization Code ala http://smartsheet-platform.github.io/api-docs/#obtaining-the-authorization-code
   * @param {*} event
   * @param {*} context
   */
  handleOAuthRedirect (event, context) {
    return Promise.try(() => {
      // extract paramters code, expires_in, state, and error:
      let params = event.queryStringParameters || {}

      if (!('state' in params)) {
        return this.writeError('Login failed: no state.', 400)
      }
      if (!JwtHandler.isValidJwtSignature(params.state)) {
        return this.writeError('Login failed: invalid state.', 400)
      }
      if ('error' in params) {
        return this.writeError('Login failed:' + params.error, 400)
      }
      if (!('code' in params)) {
        return this.writeError('Login failed: No code provided.', 400)
      }

      // exchange code for token: http://smartsheet-platform.github.io/api-docs/#obtaining-an-access-token
      return this.smartsheetApi.refreshToken(params.code, null).then(tokens => {
        return this.smartsheetApi.me().then(ssUser => {
          // save access token, expire time, and refresh token to DB:
          const userObj = {}
          // copy over token and user properties we want:
          const tokenProps = ['access_token', 'refresh_token', 'expires_at']
          const userProps = ['id', 'email']
          tokenProps.forEach(p => {
            userObj[p] = tokens[p]
          })
          userProps.forEach(p => {
            userObj[p] = ssUser[p]
          })

          const updateUserIfExists = addUserResult => {
            if (addUserResult) {
              return addUserResult
            }
            D.log('User already exists. Updating...')
            return this.db.updateUser(userObj).then(updatedUser => {
              return updatedUser
            })
          }

          const handleAddedOrUpdatedUser = addUserResult => {
            D.log('User saved:', addUserResult)
            // write cookie to authenticate user with cookie from here on out.
            const MINUTES = 60
            const DAYS = MINUTES * 60 * 24
            const expiresInSeconds = 2 * DAYS
            const cookieJwt = JwtHandler.newToken(addUserResult.id, expiresInSeconds)
            const cookieExpiresStr = new Date(Date.now() + expiresInSeconds * 1000).toUTCString()
            // Now redirect to index??
            const response = {
              statusCode: 200,
              headers: {
                'Set-Cookie': `jwt=${cookieJwt}; Path=/; Expires=${cookieExpiresStr}`,
                'Content-Type': 'text/html',
                'Refresh': '0; url=/index.html' // <- https://en.wikipedia.org/wiki/URL_redirection#Refresh_Meta_tag_and_HTTP_refresh_header
              },
              body: `<p>Login succeeded! Redirecting to <a href="/index.html">Home</a>...</p>`
            }
            return response
          }

          return this.db.addUser(userObj)
            .then(updateUserIfExists)
            .then(handleAddedOrUpdatedUser)
        })
      }).catch(err => {
        return this.responseAsError(`Login failed: Error getting token: ${err}`, 500)
      })
    })
  }
}

module.exports = OAuthClientHandler
