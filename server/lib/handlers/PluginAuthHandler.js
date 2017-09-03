'use strict'
const Handler = require('./Handler')
const Diag = require('../diag')
const Promise = require('bluebird')

const path = require('path')
const D = new Diag(path.parse(__filename).name)

class PluginAuthHandler extends Handler {
  get (event, context) {
    return Promise.try(() => {
      let params = event.queryStringParameters
      D.log('queryStringParameters:', params)
      // get redirect_uri from URL
      /* NOTE: if we do a 302 redirect Chrome never shows the window. It just immediately closes it.
         However, a 302 to the chrome redirect URL works just fine to get teh payload back to the plugin
      */
      let response = {
        statusCode: 200, // 302,
        headers: {
          'X-Location': params.redirect_uri,
          'Content-Type': 'text/html'
        },
        body: `<html><body>TODO: Redirecting to ${params.redirect_uri}...</body></html>`
      }
      return response
    })
  }
}

module.exports = PluginAuthHandler
