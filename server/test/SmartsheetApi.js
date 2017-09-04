/* eslint-env mocha */
/* eslint-disable padded-blocks */
'use strict'
require('./support/setup.js')
const expect = require('chai').expect

const Promise = require('bluebird')
const SmartsheetApi = require('../lib/SmartsheetApi.js')

describe('SmartsheetApi', function () {
  // only needed if the tests don't push mock responses on: this.timeout(7000)

  const testTokens = {
    access_token: 'aaa',
    token_type: 'bearer',
    refresh_token: 'rrr',
    expires_at: '1498549175394'
  }

  let API

  before(function () {
    // runs before all tests in this block
    const secrets = require('../data/private/ss-oauth.json')
    process.env.SS_CLIENT_ID = secrets.clientID
    process.env.SS_CLIENT_SECRET = secrets.secret
    API = new SmartsheetApi(testTokens)
  })

  describe('me', function () {
    it('should return an error with invalid token', function () {
      // we want to make sure the request at least goes through and we get an expected invalid token error (or in the future an invalid refresh token):
      SmartsheetApi._mockResponseStack.push({
        statusCode: 401,
        body: '{\n  "errorCode" : 1002,\n  "message" : "Your Access Token is invalid.",\n  "refId" : "rno24bb0fcqi"\n}'
      })
      return expect(API.me()).to.eventually.be.rejectedWith(/Your Access Token is invalid/)
    })
  })

  describe('refreshToken', function () {
    it('should return an error with invalid code', function () {
      SmartsheetApi._mockResponseStack.push({
        statusCode: 400,
        body: '{\n  "errorCode" : 1071,\n  "message" : "Invalid Grant. The authorization code or refresh token provided was invalid.",\n  "error" : "invalid_grant",\n  "refId" : "12yod97q4f4dc"\n}'
      })
      const result = API.refreshToken('invalid-code', null)
      return expect(result).to.eventually.be.rejectedWith(/Invalid Grant\. The authorization code or refresh token provided was invalid/)
    })

    it('should return an error with invalid refresh_token', function () {
      SmartsheetApi._mockResponseStack.push({
        statusCode: 400,
        body: '{\n  "errorCode" : 1071,\n  "message" : "Invalid Grant. The authorization code or refresh token provided was invalid.",\n  "error" : "invalid_grant",\n  "refId" : "17dq2c99oz19p"\n}'
      })
      const result = API.refreshToken(null, 'invalid-refresh-token')
      return expect(result).to.eventually.be.rejectedWith(/Invalid Grant\. The authorization code or refresh token provided was invalid/)
    })

    it('should have a valid response with code', function () {
      SmartsheetApi._mockResponseStack.push({
        statusCode: 200,
        body: JSON.stringify({
          access_token: 'blahaccesstoken',
          token_type: 'blaaaahtokentype',
          refresh_token: 'blllaaahrefreshtoken',
          expires_in: 7 * 24 * 60 * 60
        })
      })
      let t = API.refreshToken('mpoe02a7tc8qmhq', null)
      // t.then(v => console.log('t resp:', v))
      let props = ['access_token', 'token_type', 'refresh_token', 'expires_at']
      for (let p of props) {
        expect(t).to.eventually.have.property(p)
      }
      return t
    })

    it('should have a valid response with refresh_token', function () {
      SmartsheetApi._mockResponseStack.push({
        statusCode: 200,
        body: JSON.stringify({
          access_token: 'blahaccesstoken',
          token_type: 'blaaaahtokentype',
          refresh_token: 'blllaaahrefreshtoken',
          expires_in: 7 * 24 * 60 * 60
        })
      })
      return Promise.try(() => {
        let t = API.refreshToken(null, '2qx07zt7rqq349luj0zl1hqzd7')
        // t.then(v => console.log('t resp:', v))
        let props = ['access_token', 'token_type', 'refresh_token', 'expires_at']
        for (let p of props) {
          expect(t).to.eventually.have.property(p)
        }
        return t
      })
    })
  })
})
