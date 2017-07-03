/* eslint-env mocha */
/* eslint-disable padded-blocks */
'use strict'
require('../support/setup.js')
const expect = require('chai').expect

const Promise = require('bluebird')
const TokenTool = require('../support/TokenTool')

const LambdaAuthorizer = require('../../lib/auth/LambdaAuthorizer')

const authorizer = new LambdaAuthorizer(TokenTool.crt)
module.exports.myFunc = authorizer.protectHandler((event, context, callback) => {
  console.log(context.protected.claims)
  return Promise.resolve({ body: 'hello world' })
})

const dummyHandler = (event, context, callback) => {
  let resp = {
    statusCode: 200,
    body: 'hello world'
  }
  return Promise.resolve(resp)
}

describe('LambdaAuthorizer', function () {

  function expectResponseWithStatusCode (expectedStatusCode, event, context, boundHandler) {
    const result = boundHandler(event, context, (errForAwsLambda, responseForAwsLambda) => {
      // note, here we are esentially mocking AWS Lambda calling into the handlers:
      // console.log('invoked, errForAwsLambda:', errForAwsLambda, ' responseForAwsLambda:', responseForAwsLambda)
      expect(responseForAwsLambda.body).to.be.a('string')
      expect(responseForAwsLambda).to.have.property('statusCode', expectedStatusCode)
      return 'handler invoked.'
    })
    return Promise.resolve(result)
      .then(result => {
        console.log('result of boundHandler:', result)
        return expect(result).to.equal('handler invoked.')
      })
  }

  it('should reject without header', function () {
    const event = { headers: { 'not-a-real-header': 'hi' } }
    const context = {}
    const boundProtectedHandler = authorizer.protectHandler(dummyHandler)
    return expectResponseWithStatusCode(401, event, context, boundProtectedHandler)
  })

  it('should reject invalid token', function () {
    const event = { headers: { 'Authorize': 'Bearer not.a.valid.token' } }
    const context = {}
    const boundProtectedHandler = authorizer.protectHandler(dummyHandler)
    return expectResponseWithStatusCode(401, event, context, boundProtectedHandler)
  })

  it('should accept authorized token', function () {
    const payload = {
      prn: 123
    }
    const tok = TokenTool.newToken(payload)

    const event = { headers: { 'Authorization': `Bearer ${tok}` } }
    const context = {}
    const boundProtectedHandler = authorizer.protectHandler(dummyHandler)
    return expectResponseWithStatusCode(200, event, context, boundProtectedHandler)
  })

  it('should add prn claim to context', function (done) {
    const payload = {
      prn: 123
    }
    const tok = TokenTool.newToken(payload)

    const event = { headers: { 'Authorization': `Bearer ${tok}` } }
    const context = {}
    const boundProtectedHandler = authorizer.protectHandler((event, context, callback) => {
      return callback(null, `prn:${context.protected.claims.prn}`)
    })
    boundProtectedHandler(event, context, (errForAwsLambda, responseForAwsLambda) => {
      // we're essentially aws lambda here, just expect cb_result to get called and have result boo
      expect(responseForAwsLambda).to.equal('prn:123')
      done()
    })
  })

  it('should work with handler returns a promise (should "then" it)', function () {
    // this is what all of the tests above do since dummyHandler has a promise.
  })

  it('should work when handler doesn\'t return promise', function (done) {
    const payload = {
      prn: 123
    }
    const tok = TokenTool.newToken(payload)

    const event = { headers: { 'Authorization': `Bearer ${tok}` } }
    const context = {}
    const boundProtectedHandler = authorizer.protectHandler((event, context, callback) => {
      callback(null, 'boo')
    })

    boundProtectedHandler(event, context, (errForAwsLambda, responseForAwsLambda) => {
      // we're essentially aws lambda here, just expect cb_result to get called and have result boo
      expect(responseForAwsLambda).to.equal('boo')
      done()
    })
  })

  it('should work when handler returns no result', function (done) {
    const payload = {
      prn: 123
    }
    const tok = TokenTool.newToken(payload)

    const event = { headers: { 'Authorization': `Bearer ${tok}` } }
    const context = {}
    const boundProtectedHandler = authorizer.protectHandler((event, context, callback) => {
      callback(/*deliberately no err and no result*/)
      return undefined
    })

    boundProtectedHandler(event, context, (errForAwsLambda, responseForAwsLambda) => {
      // we're essentially aws lambda here, just expect cb_result to get called and have result boo
      expect(responseForAwsLambda).to.be.undefined // eslint-disable-line
      done()
    })
  })
})
