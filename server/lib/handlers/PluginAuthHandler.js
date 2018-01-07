'use strict'
const Handler = require('./Handler')
const Diag = require('../diag')
const Promise = require('bluebird')
const DynamoDB = require('../DynamoDB')
const DB = require('../DB')
const Constants = require('../Constants')
const SmartsheetApi = require('../SmartsheetApi')
const JwtHandler = require('./JwtHandler')
const assert = require('assert')

const path = require('path')
const D = new Diag(path.parse(__filename).name) // eslint-disable-line no-unused-vars

/**
 * Handles the receiving of the Smartsheet OAuth callback/redirect for a plugin.
 */
class PluginAuthHandler extends Handler {
  constructor () {
    super()
    this.db = new DB(new DynamoDB(), process.env.DDB_USERS_TABLE, process.env.DDB_PLUGINS_TABLE, process.env.DDB_API_TOKENS_TABLE)
  }

  get (event, context) {
    return Promise.try(() => {
      const qs = event.queryStringParameters
      const pp = event.pathParameters
      // D.log('qs:', qs)
      // D.log('pp:', pp)
      // D.log('PluginAuthHandler.get: qs:', qs, 'pp:', pp)

      // Which plugin is this for?
      if (!('manifestUrl' in pp)) {
        return this.writeError('plugin manifestUrl not specified', 400)
      }
      let smartsheetErrorMessage = ''
      if ('error' in qs) {
        smartsheetErrorMessage = 'Smartsheet error detail: ' + qs.error + '\n'
      }

      for (let requiredQueryString of ['code', 'expires_in', 'state']) {
        if (!(requiredQueryString in qs)) {
          return this.responseAsError(`${smartsheetErrorMessage} ${requiredQueryString} query string not specified`, 400)
        }
      }
      /* Security Note:
        Extension IDs should not be spoofable. As noted in https://stackoverflow.com/a/23877974/51061 as they are a public key, encoded in base64 format and will require the crx file to be signed with the corresponding private key to be installed.
      */
      if (Constants.legitExtentionIDs.indexOf(qs.state) < 0) {
        return this.responseAsError(`invalid extensionid: ${qs.state}`, 400)
      }
      pp.manifestUrl = decodeURIComponent(pp.manifestUrl)

      // Lookup the plugin:
      return this.db.getPlugin(pp.manifestUrl).then(plugin => {
        D.log('db returned plugin:', plugin)
        if (!plugin) {
          return this.responseAsError('plugin not found', 404)
        }
        if (!('apiClientID' in plugin) || !('apiClientSecret' in plugin)) {
          return this.responseAsError('plugin does not have client id and secret registered', 400)
        }
        // Exchange code for token
        return this.exchangeCodeForToken(plugin, qs.code).then(tokenInfo => {
          return this.db.addApiTokenForPluginUser(pp.manifestUrl, tokenInfo.id, tokenInfo.access_token, tokenInfo.refresh_token, tokenInfo.expires_at).then(() => {
            /** Prepare a JWT to inform the plugin the user and plugin we have an SS API token for this user/plugin.
             *  We never send the SS API tokens to the client, but this JWT will let the extension know that we have one so they can give it back later to make API calls.
             *  This JWT is a bearer token for calling the API for this user & plugin, but it isn't as permissive as the API Access token since plugins must whitelist every API call that they can make. 
             *  Since there is a whitelist, even if this JWT gets leaked to the wrong user, it isn't nearly as hostile as an SS API Token due to the whitelist.
             */
            // TODO: Reconsider expiring this token at the same time as the access token. We have a refresh token, so no real reason to expire it:
            if (typeof tokenInfo.expires_at !== 'number') {
              throw new Error('expected expires_at to be a number!')
            }
            const expiresAtSeconds = tokenInfo.expires_at
            const payload = {
              expires_at: tokenInfo.expires_at,
              prn: tokenInfo.id,
              prneml: tokenInfo.email,
              aud: pp.manifestUrl,
              iss: 'sheetmonkey-server',
              exp: expiresAtSeconds
            }
            const jwt = JwtHandler.encodeToken(payload)
            // now redirect the page back to the special chromiumapp.org url and chrome will detect this rederect and close the window.
            const redirectUri = `https://${qs.state}.chromiumapp.org/${encodeURIComponent(pp.manifestUrl)}?status=success&tokenInfo=${encodeURIComponent(jwt)}`
            D.log('Redirecting to', redirectUri)
            let response = {
              statusCode: 302,
              headers: {
                'Location': redirectUri,
                'Content-Type': 'text/html'
              },
              body: `<html><body>Login successful. You can close this window.</body></html>`
            }
            return response
          })
        })
      })
    })
  }
  exchangeCodeForToken (plugin, code) {
    D.log('exchangeCodeForToken')
    // exchange code for token: http://smartsheet-platform.github.io/api-docs/#obtaining-an-access-token
    assert(plugin.apiClientID && plugin.apiClientSecret, 'plugin doesn\'t have apiClientID or secret!')
    const smartsheetApi = new SmartsheetApi(null, plugin.apiClientID, plugin.apiClientSecret)
    return smartsheetApi.refreshToken(code, null).then(tokens => {
      return smartsheetApi.me().then(ssUser => {
        // save access token, expire time, and refresh token to DB:
        const tokenInfo = {}
        // copy over token and user properties we want:
        const tokenProps = ['access_token', 'refresh_token', 'expires_at']
        const userProps = ['id', 'email']
        tokenProps.forEach(p => {
          tokenInfo[p] = tokens[p]
        })
        userProps.forEach(p => {
          tokenInfo[p] = ssUser[p]
        })
        return tokenInfo
      })
    })
  }
}

module.exports = PluginAuthHandler
