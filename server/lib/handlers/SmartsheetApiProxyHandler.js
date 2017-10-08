'use strict'
const Promise = require('bluebird')
const Handler = require('./Handler')
const Diag = require('../diag')
const HttpError = require('../HttpError')
const assert = require('assert')
const SmartsheetApi = require('../SmartsheetApi')
const RequestWhitelist = require('../RequestWhitelist')

const D = new Diag('SmartsheetApiProxyHandler')

class SmartsheetApiProxyHandler extends Handler {
  constructor (db) {
    super()
    assert(db, 'db required')
    this.db = db
  }

  /**
   * Handles all HTTP methods
   */
  handle (event, context) {
    return Promise.try(() => {
      // D.log('event:', JSON.stringify(event, null, 2))
      for (let requiredClaim of ['prn', 'aud']) {
        if (!(requiredClaim in context.protected.claims)) {
          return this.responseAsError(`missing required claim ${requiredClaim}`, 401)
        }
      }

      for (let requiredPathParam of ['request']) {
        if (!(requiredPathParam in event.pathParameters)) {
          return this.responseAsError(`missing required path parameter ${requiredPathParam}`, 401)
        }
      }
      let pluginManifestUrl = context.protected.claims.aud
      let userId = context.protected.claims.prn
      return this.lookupSmartsheetApiTokenForUser(pluginManifestUrl, userId).then(apiTokenRecord => {
        if (apiTokenRecord == null) {
          return this.responseAsError(`No access token for this user (${userId}) and plugin (${pluginManifestUrl}).`, 401)
        }
        let requestPath = event.pathParameters.request
        return this.verifyRequestInWhitelist(pluginManifestUrl, event.httpMethod, requestPath).then(() => {
          const tokens = {
            'access_token': apiTokenRecord.access_token,
            'refresh_token': apiTokenRecord.refresh_token,
            'expires_at': apiTokenRecord.expires_at
          }
          const ssApi = new SmartsheetApi(tokens)
          return ssApi.httpRequest(event.httpMethod, requestPath, event.body, false).then(apiResponse => {
            let response = {
              statusCode: apiResponse.statusCode,
              headers: apiResponse.headers,
              body: apiResponse.headers
            }
            return response
          })
        })
      })
    })
  }

  verifyRequestInWhitelist (pluginManifestUrl, requestMethod, requestPath) {
    return Promise.try(() => {
      return this.db.getPlugin(pluginManifestUrl).then(p => {
        if (p) {
          const whitelist = new RequestWhitelist('requestWhitelist' in p ? p.requestWhitelist : [])
          if (!whitelist.isRequestPermitted(requestMethod, requestPath)) {
            throw new HttpError(403, `Request '${requestMethod} ${requestPath}' is not allowed for ${pluginManifestUrl}.`)
          }
        } else {
          throw new HttpError(404, `Plugin ${pluginManifestUrl} not found.`)
        }
      })
    })
  }

  lookupSmartsheetApiTokenForUser (pluginManifestUrl, userId) {
    return this.db.getApiTokenForPluginUser(pluginManifestUrl, userId).then(tokenRecord => {
      return tokenRecord
    })
  }
}

module.exports = SmartsheetApiProxyHandler
