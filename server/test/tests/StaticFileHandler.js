/* eslint-env mocha */
/* eslint-disable padded-blocks */
'use strict'
require('../support/setup.js')
const expect = require('chai').expect

const path = require('path')

const StaticFileHandler = require('../../lib/handlers/StaticFileHandler.js')

describe('StaticFileHandler', function () {
  describe('constructor', function () {
    it('should not allow empty arg', function () {
      expect(() => new StaticFileHandler()).to.throw(/clientFilesPath must be specified/)
    })

    it('should accept string arg', function () {
      expect(() => new StaticFileHandler('some/path')).to.not.throw(Error)
    })
  })

  describe('get', function () {
    it('should return index.html', function () {
      let event = { path: 'index.html' }
      let h = new StaticFileHandler(path.join(__dirname, '../../data/public/'))
      let response = h.get(event, null)
      expect(response).to.eventually.have.property('statusCode', 200)
      expect(response).to.eventually.have.property('body').to.match(/^<!DOCTYPE html>/)
      return response
    })

    it('should return a mime/type of application/octet-stream for .map files', function () {
      let event = { path: 'vendor/bootstrap.min.css.map' }
      let h = new StaticFileHandler(path.join(__dirname, '../../data/public/'))
      return h.get(event, null)
        .then(response => {
          console.log('response.headers', response.headers)
          expect(response).to.have.property('headers')
          expect(response.headers).to.have.property('Content-Type')
          expect(response.headers['Content-Type']).to.equal('application/octet-stream')
          return response
        })
    })
  })
})
