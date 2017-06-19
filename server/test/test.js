'use strict';
const expect = require('chai').expect;
const StaticFileHandler = require('../lib/handlers/StaticFileHandler.js');

describe('StaticFileHandler', function() {
  describe('constructor', function() {

    it('should not allow empty arg', function() {
      expect(() => new StaticFileHandler()).to.throw(/clientFilesPath must be specified/);
    });

    it('should accept string arg', function() {
      expect(() => new StaticFileHandler('some/path')).to.not.throw(Error);
    });

  })
});
