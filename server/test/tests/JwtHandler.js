'use strict';
require('../support/setup.js');
const expect = require("chai").expect;

const JwtHandler = require('../../lib/handlers/JwtHandler');

describe('JwtHandler', function() {
  describe('isValidJwtSignature', function() {

    it('should succeed on valid token', function() {
      let state = JwtHandler.newToken();
      expect(JwtHandler.isValidJwtSignature(state)).to.be.true;
    });

    it('should fail on bogus token', function() {
      let state = 'dfdjsaklfjd';
      expect(JwtHandler.isValidJwtSignature(state)).to.be.false;
    });
  })
});
