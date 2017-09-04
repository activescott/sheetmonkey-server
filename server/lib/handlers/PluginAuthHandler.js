'use strict'
const Handler = require('./Handler')
const Diag = require('../diag')
const Promise = require('bluebird')
const DynamoDB = require('../DynamoDB')
const DB = require('../DB')
const Constants = require('../Constants')
const SmartsheetApi = require('../SmartsheetApi')
const JwtHandler = require('./JwtHandler')
const StaticFileHandler = require('./StaticFileHandler')
const assert = require('assert')

const path = require('path')
const D = new Diag(path.parse(__filename).name)

class PluginAuthHandler extends Handler {
  constructor () {
    super()
    this.db = new DB(new DynamoDB(), process.env.DDB_USERS_TABLE, process.env.DDB_PLUGINS_TABLE)
  }

  get (event, context) {
    return Promise.try(() => {
      const qs = event.queryStringParameters
      const pp = event.pathParameters
      // D.log('qs:', qs)
      // D.log('pp:', pp)

      // Which plugin is this for?
      if (!('manifestUrl' in pp)) {
        return StaticFileHandler.writeError('plugin manifestUrl not specified', 400)
      }
      let smartsheetErrorMessage = ''
      if ('error' in qs) {
        smartsheetErrorMessage = 'Smartsheet error detail: ' + qs.error + '\n'
      }

      for (let requiredQueryString of ['code', 'expires_in', 'state']) {
        if (!(requiredQueryString in qs)) {
          return StaticFileHandler.responseAsError(`${smartsheetErrorMessage}${requiredQueryString} query string not specified`, 400)
        }
      }
      if (Constants.legitExtentionIDs.indexOf(qs.state) < 0) {
        return StaticFileHandler.responseAsError(`invalid extensionid: ${qs.state}`, 400)
      }
      pp.manifestUrl = decodeURIComponent(pp.manifestUrl)

      // Lookup the plugin:
      return this.db.getPlugin(pp.manifestUrl).then(plugin => {
        if (!plugin) {
          return StaticFileHandler.responseAsError('plugin not found', 404)
        }
        if (!('apiClientID' in plugin) || !('apiClientSecret' in plugin)) {
          return StaticFileHandler.responseAsError('plugin does not have client id and secret registered', 400)
        }
        // Exchange code for token
        return this.exchangeCodeForToken(plugin, qs.code).then(tokenInfo => {
          // Put token details in a JWT
          const payload = {
            access_token: tokenInfo.access_token,
            // refresh_token: tokenInfo.refresh_token,
            expires_at: tokenInfo.expires_at,
            prn: tokenInfo.id,
            prneml: tokenInfo.email
          }
          const jwt = JwtHandler.encodeToken(payload)
          const redirectUri = `https://${qs.state}.chromiumapp.org/${encodeURIComponent(pp.manifestUrl)}?tokenInfo=${encodeURIComponent(jwt)}`

          // Send JWT to browser extension
          let response = {
            statusCode: 302,
            headers: {
              'Location': redirectUri,
              'Content-Type': 'text/html'
            },
            body: `<html><body>TODO: Redirecting to ${redirectUri}...</body></html>`
          }
          return response
        })
      })
    })
  }
  exchangeCodeForToken (plugin, code) {
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
