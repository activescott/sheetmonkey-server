/* eslint-env mocha */
/* eslint-disable padded-blocks */
/* eslint-disable no-unused-expressions */
'use strict'
require('./support/setup.js')
const expect = require('chai').expect

const RequestWhitelist = require('../lib/RequestWhitelist')

describe('RequestWhitelist', function () {

  var whitelist = null

  before(function () {
    whitelist = null
  })

  function registerUrls (permittedRequests) {
    whitelist = new RequestWhitelist(permittedRequests)
  }

  function expectIsPermitted (method, path) {
    return expect(whitelist.isRequestPermitted(method, path), `${method} ${path}`)
  }

  describe('simple URLs', function () {
    before(function () {
      registerUrls([
        'GET /sheets'
      ])
    })

    it('should permit simple URLs', function () {
      expectIsPermitted('GET', '/sheets').to.be.true
    })

    it('should decline simple URLs based on path or method', function () {
      expectIsPermitted('GET', '/peets').to.be.false
      expectIsPermitted('PUT', '/sheets').to.be.false
    })
  })

  it('should accept URLs with a placeholder', function () {
    registerUrls([
      'GET /sheets/{sheetID}'
    ])
    expectIsPermitted('GET', '/sheets/123').to.be.true
    expectIsPermitted('PUT', '/sheets/123').to.be.false
  })

  it('should accept URLs with multiple placeholders', function () {
    registerUrls([
      'GET /sheets/{sheetID}/rows/{rowID}'
    ])
    expectIsPermitted('GET', '/sheets/123/rows/345').to.be.true
    expectIsPermitted('GET', '/xsheets/123/rows/345').to.be.false
    expectIsPermitted('GET', '/sheets/123/xrows/345').to.be.false
  })

})
