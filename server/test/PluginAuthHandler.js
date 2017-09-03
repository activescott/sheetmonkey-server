/* eslint-env mocha */
/* eslint-disable padded-blocks */
'use strict'
require('./support/setup.js')
const expect = require('chai').expect
const querystring = require('querystring')

const ServerlessInvoker = require('serverless-http-invoker')

describe('PluginsHandler', function () {
  var invoker = new ServerlessInvoker()

  describe('pluginauthflow', function () {
    it('should redirect to plugin URI', function () {
      let event = {
        body: '',
        headers: {}
      }

      let redir = 'https://123456.chromiumapp.org/gibberish'
      let parameters = querystring.stringify({
        'pluginId': 'https___activescott_github_io_sheetmonkey_plugins_selectioninfo_manifest_json',
        'scope': 'SCOPE',
        'redirect_uri': redir
      })
      let response = invoker.invoke('GET api/pluginauthflow?' + parameters, event)
      return response.then(r => {
        expect(r).to.have.property('statusCode', 200 /* 302 */)
        return expect(r.headers).to.have.property('X-Location', redir)
      })
    })
  })
})
