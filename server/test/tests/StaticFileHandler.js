'use strict';
require('../support/setup.js');
const expect = require("chai").expect;

const path = require('path');

const StaticFileHandler = require('../../lib/handlers/StaticFileHandler.js');

describe('StaticFileHandler', function() {
  describe('constructor', function() {

    it('should not allow empty arg', function() {
      expect(() => new StaticFileHandler()).to.throw(/clientFilesPath must be specified/);
    });

    it('should accept string arg', function() {
      expect(() => new StaticFileHandler('some/path')).to.not.throw(Error);
    });
    
  });

  describe('get', function() {

    it('should return index.html', function() {
        let event = { path: 'index.html' };
        let h = new StaticFileHandler(path.join(__dirname, '../data/public/'));
        let response = h.get(event, null);
        expect(response).to.eventually.have.property('statusCode', 200);
        expect(response).to.eventually.have.property('body').to.match(/^<\!DOCTYPE html>/);
    });

  })
});