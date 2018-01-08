/* eslint-env mocha */
/* eslint-disable padded-blocks */
'use strict'
require('./support/setup.js')
const expect = require('chai').expect

const ServerlessInvoker = require('serverless-http-invoker')

var invoker = new ServerlessInvoker()
let emptyEvent

describe('static file serving checks', function () {
  beforeEach(function () {
    emptyEvent = {
      body: '',
      headers: {}
    }
  })

  it('must have csrftoken inserted into template', function () {
    return invoker.invoke(`GET index.html`, emptyEvent)
      .then(r => {
        console.log('r:', r)
        expect(r).to.have.property('body')
        return expect(r.body).to.match(/<input id="csrftoken" type="hidden" value="[^"]+"/)
      })
  })
})
