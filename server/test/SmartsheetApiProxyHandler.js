/* eslint-env mocha */
/* eslint-disable padded-blocks, no-unused-expressions */
'use strict'
require('./support/setup.js')
const expect = require('chai').expect
const ServerlessInvoker = require('serverless-http-invoker')
const randomUserID = require('./support/tools').randomUserID
const getExpiresAtDateValue = require('./support/tools').getExpiresAtDateValue
const DynamoDB = require('../lib/DynamoDB')
const DB = require('../lib/DB')
const SmartsheetApi = require('../lib/SmartsheetApi')

const JwtHandler = require('../lib/handlers/JwtHandler')

describe('SmartsheetApiProxyHandler', function () {
  var invoker = new ServerlessInvoker()
  var userID
  var db

  before(function () {
    userID = randomUserID()
    db = new DB(new DynamoDB(), 'sheetmonkey-server-beta-users', 'sheetmonkey-server-beta-plugins', 'sheetmonkey-server-beta-apiTokens')
  })

  beforeEach(function () {
    // runs before each test in this block
    // Kill any pending responses that might have been left over:
    SmartsheetApi._mockResponseStack = []

    // cleanup any plugins added by tests:
    return db.deleteAllPlugins().then(() => {
      return db.deleteAllApiTokens().then(() => {
        userID = randomUserID()
      })
    })
  })

  function buildAuthorizedHeaders (userIDOverride, manifestUrlOverwride, expiresAtSecondsOverride) {
    userIDOverride = userIDOverride || userID
    manifestUrlOverwride = manifestUrlOverwride || `https://${userIDOverride}.manifest`
    const payload = {
      prn: userIDOverride,
      aud: manifestUrlOverwride
    }
    return buildAuthorizationHeaderCustom(payload, expiresAtSecondsOverride)
  }

  function buildAuthorizationHeaderCustom (claims, expiresAtSeconds) {
    claims['iss'] = 'sheetmonkey-server'
    if (!expiresAtSeconds) {
      expiresAtSeconds = (new Date().valueOf() + 10000) / 1000
    }
    claims['exp'] = expiresAtSeconds

    const jwt = JwtHandler.encodeToken(claims)
    return {
      'Authorization': 'Bearer ' + jwt
    }
  }

  it('should reject without auth', function () {
    let event = {
      body: JSON.stringify({}),
      headers: []
    }

    let responses = []
    responses.push(invoker.invoke(`GET api/ssapiproxy/sheets/123`, event))
    responses.push(invoker.invoke(`POST api/ssapiproxy/sheets/123`, event))
    responses.push(invoker.invoke(`PUT api/ssapiproxy/sheets/123`, event))
    responses.push(invoker.invoke(`DELETE api/ssapiproxy/sheets/123`, event))

    return Promise.all(responses).then(results => results.forEach(r => expect(r).to.have.property('statusCode', 401)))
  })

  it('should reject without expected claims in token', function () {
    let event = {
      body: JSON.stringify({}),
      headers: buildAuthorizationHeaderCustom([])
    }

    let responses = []
    responses.push(invoker.invoke(`GET api/ssapiproxy/sheets/123`, event))
    responses.push(invoker.invoke(`POST api/ssapiproxy/sheets/123`, event))
    responses.push(invoker.invoke(`PUT api/ssapiproxy/sheets/123`, event))
    responses.push(invoker.invoke(`DELETE api/ssapiproxy/sheets/123`, event))

    return Promise.all(responses).then(results => results.forEach(r => expect(r).to.have.property('statusCode', 401)))
  })

  it('should reject with expired token', function () {
    let event = {
      body: JSON.stringify({}),
      headers: buildAuthorizedHeaders(null, null, (new Date().valueOf() - 1000) / 1000)
    }
    return invoker.invoke(`GET api/ssapiproxy/sheets/123`, event).then(result => expect(result).to.have.property('statusCode', 401))
  })

  function addTestPlugin (requestWhitelist) {
    const testPlugin = {
      manifestUrl: `https://blah.com/${userID}.json`,
      ownerID: userID,
      apiClientID: 'clid',
      apiClientSecret: 'secret',
      requestWhitelist: requestWhitelist
    }
    return db.addPlugin(testPlugin)
  }

  it('should succesfully proxy an API call', function () {

    // FIRST, we add a some mock responses for SmartsheetApi to avoid the actual network traffic:
    /* eslint-disable quotes */
    SmartsheetApi._mockResponseStack.push({
      'statusCode': 200,
      'body': '{"accessLevel":"OWNER","projectSettings":{"workingDays":[],"nonWorkingDays":[],"lengthOfDay":6},"columns":[],"createdAt":"2012-07-24T18:22:29-07:00","id":4583173393803140,"modifiedAt":"2012-07-24T18:30:52-07:00","name":"sheet 1","permalink":"https://app.smartsheet.com/b/home?lx=pWNSDH9itjBXxBzFmyf-5w","rows":[]}',
      "headers": {
        "date": "Mon, 24 Jul 2012 00:00:00 GMT",
        "content-type": "application/json;charset=UTF-8",
        "connection": "close"
      }
    })
    /* eslint-enable quotes */

    // THE TEST
    const requestWhitelist = ['GET sheets/{sheetid}']
    return addTestPlugin(requestWhitelist).then(p => {
      // NOTE: if SS_API_TOKEN is in environment this request will work against real API
      let testToken = process.env.SS_API_TOKEN || `token-for-${userID}`
      return db.addApiTokenForPluginUser(p.manifestUrl, userID, testToken, testToken, 123456).then(token => {
        // console.log('saved token:', token)
        let event = {
          body: JSON.stringify({}),
          headers: buildAuthorizedHeaders(userID, p.manifestUrl)
        }

        let responses = []
        responses.push(invoker.invoke(`GET api/ssapiproxy/sheets/213181139314564`, event))

        return Promise.all(responses).then(results => results.forEach(r => {
          return expect(r).to.have.property('statusCode', 200)
        }))
      })
    })
  })

  it('should reject if current authenticated user doesn\'t have API token in DB', function () {
    const requestWhitelist = ['GET sheets/{sheetid}']
    return addTestPlugin(requestWhitelist).then(p => {
      // NOTE: missing addApiTokenForPluginUser here
      let event = {
        body: JSON.stringify({}),
        headers: buildAuthorizedHeaders(userID, p.manifestUrl)
      }

      let responses = []
      responses.push(invoker.invoke(`GET api/ssapiproxy/sheets/123`, event))

      return Promise.all(responses).then(results => results.forEach(r => {
        expect(r.body.message).to.match(/No access token for this user \(\d+\) and plugin.*/)
        return expect(r).to.have.property('statusCode', 401)
      }))
    })
  })

  it('should reject if API isn\'t whitelisted', function () {
    const requestWhitelist = ['GET sheets_xxx/{sheetid}']
    return addTestPlugin(requestWhitelist).then(p => {
      // NOTE: if SS_API_TOKEN is in environment this request will work against real API
      let testToken = process.env.SS_API_TOKEN || `token-for-${userID}`
      return db.addApiTokenForPluginUser(p.manifestUrl, userID, testToken, testToken, getExpiresAtDateValue(60)).then(token => {
        // console.log('saved token:', token)
        let event = {
          body: JSON.stringify({}),
          headers: buildAuthorizedHeaders(userID, p.manifestUrl)
        }

        let responses = []
        responses.push(invoker.invoke(`GET api/ssapiproxy/sheets/213181139314564`, event))

        return Promise.all(responses).then(results => results.forEach(r => {
          return expect(r).to.have.property('statusCode', 403)
        }))
      })
    })
  })

})
