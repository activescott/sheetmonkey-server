'use strict';
require('../support/setup.js');
const expect = require("chai").expect;

const Promise = require('bluebird');
const SmartsheetApi = require('../../lib/SmartsheetApi.js');

describe('SmartsheetApi', function() {
  this.timeout(7000);

  const testTokens = {
    access_token:"aaa",
    token_type:"bearer",
    refresh_token:"rrr",
    expires_at:"1498549175394"
  };

  let API = new SmartsheetApi(testTokens);

  before(function() {
    // runs before all tests in this block
    const secrets = require('../../data/private/ss-oauth.json');
    process.env.SS_CLIENT_ID=secrets.clientID;
    process.env.SS_CLIENT_SECRET=secrets.secret;
  });

  describe('me', function() {

    it('should return an error with invalid token', function() {
      // we want to make sure the request at least goes through and we get an expected invalid token error (or in the future an invalid refresh token): 
      return expect(API.me()).to.eventually.be.rejectedWith(/Your Access Token is invalid/);
    });

  });

  describe('refreshToken', function() {

    it('should return an error with invalid code', function() {
      const result = API.refreshToken('invalid-code', null);
      return expect(result).to.eventually.be.rejectedWith(/Invalid Grant\. The authorization code or refresh token provided was invalid/);
    });

    it('should return an error with invalid refresh_token', function() {
      const result = API.refreshToken(null, 'invalid-refresh-token');
      return expect(result).to.eventually.be.rejectedWith(/Invalid Grant\. The authorization code or refresh token provided was invalid/);
    });

    it.skip('should have a valid response with code', function() {
      let t = API.refreshToken('mpoe02a7tc8qmhq', null);
      t.then(v => console.log('t resp:', v));
      let props = ['access_token', 'token_type', 'refresh_token', 'expires_at'];
      for (let p of props) {
        expect(t).to.eventually.have.property(p);
      }
      return t;
    });

    it.skip('should have a valid response with refresh_token', function() {
      // I haven't seen this work, but I think it's because SS API won't let me use refresh_token values until they're needed because I always get 'Invalid Grant. The authorization code or refresh token provided was invalid.'
      return Promise.try(() => {
        let t = API.refreshToken(null, '2qx07zt7rqq349luj0zl1hqzd7');
        t.then(v => console.log('t resp:', v));
        let props = ['access_token', 'token_type', 'refresh_token', 'expires_at'];
        for (let p of props) {
          expect(t).to.eventually.have.property(p);
        }
        return t;
      });
    });

  });
});
