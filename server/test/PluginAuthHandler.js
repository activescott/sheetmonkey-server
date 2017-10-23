/* eslint-env mocha */
/* eslint-disable padded-blocks */
'use strict'
require('./support/setup.js')
const expect = require('chai').expect
const querystring = require('querystring')
const ServerlessInvoker = require('serverless-http-invoker')
const DynamoDB = require('../lib/DynamoDB')
const DB = require('../lib/DB')
const randomUserID = require('./support/tools').randomUserID
const Constants = require('../lib/Constants')
const SmartsheetApi = require('../lib/SmartsheetApi')
const TokenTool = require('./support/TokenTool')

describe('PluginAuthHandler', function () {
  var db
  var userID
  var emptyEvent = {
    body: '',
    headers: {}
  }

  var invoker = new ServerlessInvoker()

  before(function () {
    db = new DB(new DynamoDB(), 'sheetmonkey-server-beta-users', 'sheetmonkey-server-beta-plugins', 'sheetmonkey-server-beta-apiTokens')
  })

  beforeEach(function () {
    // runs before each test in this block
    // Kill any pending responses that might have been left over:
    SmartsheetApi._mockResponseStack = []
    // cleanup any plugins added by tests:
    return db.deleteAllPlugins().then(() => {
      userID = randomUserID()
    })
  })

  describe('pluginauthflow', function () {

    it('extensionID in state param must be an expected extensionID (this is critical to avoid attacker from being able to send any extensionID to grab secure tokens with their own extension)', function () {
      const testPlugin = { manifestUrl: `https://blah.com/${userID}.json`, ownerID: userID, apiClientID: 'clid', apiClientSecret: 'secret' }
      return db.addPlugin(testPlugin).then(() => {
        const manifestUrl = encodeURIComponent('https://blah.blah/someplugin.manifest')
        const qs = querystring.stringify({
          'code': 123456,
          'expires_in': 90,
          'state': 'notalegitextensionid'
        })
        const response = invoker.invoke(`GET api/pluginauthcallback/${manifestUrl}?` + qs, emptyEvent)
        return response.then(r => {
          expect(r).to.have.property('statusCode', 400)
          return expect(r.headers).to.not.have.property('Location')
        })
      })
    })

    it('should redirect to extension', function () {
      const testPlugin = { manifestUrl: `https://blah.com/${userID}.json`, ownerID: userID, apiClientID: 'clid', apiClientSecret: 'secret' }
      return db.addPlugin(testPlugin).then(() => {
        // Push the mock HTTP Responses onto SmartsheetApi:
        //  The /me response:
        const fakeUID = 48569348493401200
        SmartsheetApi._mockResponseStack.push({
          statusCode: 200,
          body: JSON.stringify({
            email: 'john.doe@smartsheet.com',
            firstName: 'John',
            lastName: 'Doe',
            id: fakeUID,
            admin: true,
            licensedSheetCreator: true,
            groupAdmin: true,
            resourceViewer: true,
            alternateEmails: [{
              id: 12345,
              email: 'altEmail1@smartsheet.com',
              confirmed: true
            }],
            sheetCount: 0,
            lastLogin: '2016-11-23T19:27:31Z',
            customWelcomeScreenViewed: '2016-11-23T19:46:34Z'
          })
        })
        //  The token refresh response:
        SmartsheetApi._mockResponseStack.push({
          statusCode: 200,
          body: JSON.stringify({
            access_token: 'blahaccesstoken',
            token_type: 'blaaaahtokentype',
            refresh_token: 'blllaaahrefreshtoken',
            expires_in: 7 * 24 * 60 * 60
          })
        })

        const manifestUrl = encodeURIComponent(testPlugin.manifestUrl)
        const extensionID = Constants.legitExtentionIDs[0]
        const qs = querystring.stringify({
          'code': 123456,
          'expires_in': 90,
          'state': extensionID
        })

        // now run normally
        const response = invoker.invoke(`GET api/pluginauthcallback/${manifestUrl}?` + qs, emptyEvent)
        return response.then(r => {
          expect(r).to.have.property('statusCode', 302)
          expect(r.headers).to.have.property('Location')
          const qsStr = r.headers.Location.substring(r.headers.Location.lastIndexOf('?') + 1)
          const qsParsed = querystring.parse(qsStr)
          console.log('qsParsed:', qsParsed)
          const jwtParsed = TokenTool.decodeToken(qsParsed.tokenInfo)
          expect(jwtParsed).to.have.property('aud', testPlugin.manifestUrl)
          return expect(jwtParsed).to.have.property('prn', fakeUID)
        })
      })
    })

    it('should fail if no plugin is registered with specified manifestUrl', function () {
      // NOTE: in this case we're not adding the plugin corresponding to this manifestUrl so it should fail
      const manifestUrl = encodeURIComponent('https://blah.blah/someplugin.manifest')
      const qs = querystring.stringify({
        'code': 123456,
        'expires_in': 90,
        'state': Constants.legitExtentionIDs[0]
      })
      const response = invoker.invoke(`GET api/pluginauthcallback/${manifestUrl}?` + qs, emptyEvent)
      return response.then(r => {
        return expect(r).to.have.property('statusCode', 404)
      })
    })

    it('should require code querystring', function () {
      const manifestUrl = encodeURIComponent('https://blah.blah/someplugin.manifest')
      const qs = querystring.stringify({
        'XXX-code': 123456,
        'expires_in': 90,
        'state': 'whatever'
      })
      const response = invoker.invoke(`GET api/pluginauthcallback/${manifestUrl}?` + qs, emptyEvent)
      return response.then(r => {
        return expect(r).to.have.property('statusCode', 400)
      })
    })

    it('should require expires_in querystring', function () {
      const manifestUrl = encodeURIComponent('https://blah.blah/someplugin.manifest')
      const qs = querystring.stringify({
        'code': 123456,
        'XXX-expires_in': 90,
        'state': 'whatever'
      })
      const response = invoker.invoke(`GET api/pluginauthcallback/${manifestUrl}?` + qs, emptyEvent)
      return response.then(r => {
        return expect(r).to.have.property('statusCode', 400)
      })
    })

    it('should require state querystring', function () {
      const manifestUrl = encodeURIComponent('https://blah.blah/someplugin.manifest')
      const qs = querystring.stringify({
        'code': 123456,
        'expires_in': 90,
        'XXX-state': 'whatever'
      })
      const response = invoker.invoke(`GET api/pluginauthcallback/${manifestUrl}?` + qs, emptyEvent)
      return response.then(r => {
        return expect(r).to.have.property('statusCode', 400)
      })
    })

    it('should report error querystring if provided', function () {
      const manifestUrl = encodeURIComponent('https://blah.blah/someplugin.manifest')
      const qs = querystring.stringify({
        'XXX-code': 123456,
        'expires_in': 90,
        'state': 'whatever',
        'error': 'Whatever smartsheet says is wrong is wrong.'
      })
      const response = invoker.invoke(`GET api/pluginauthcallback/${manifestUrl}?` + qs, emptyEvent)
      return response.then(r => {
        expect(r).to.have.property('body')
        expect(r.body).to.match(/Smartsheet error detail: Whatever smartsheet says is wrong is wrong\./)
        return expect(r).to.have.property('statusCode', 400)
      })
    })

  })
})
