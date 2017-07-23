'use strict';
require('./support/setup.js');
const expect = require("chai").expect;

const JwtHandler = require('../lib/handlers/JwtHandler');

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

  });

  describe('newToken', function() {

    it('should set expiration time when specified', function() {
      const now = Date.now() / 1000;
      const t = JwtHandler.newToken(null, 100);
      const decoded = JwtHandler.decodeToken(t);
      console.log('decoded:', decoded);
      expect(decoded).to.have.property('exp');
      
      console.log('now:', now);
      console.log('exp:', decoded.exp);
      return expect(decoded.exp).to.be.closeTo(now+100, 10);
    });

  });
});
