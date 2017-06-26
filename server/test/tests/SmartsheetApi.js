'use strict';
require('../support/setup.js');
const expect = require("chai").expect;

const Promise = require('bluebird');
const SmartsheetApi = require('../../lib/SmartsheetApi.js');

describe('SmartsheetApi', function() {
  this.timeout(5000);

  before(function() {
    // runs before all tests in this block
    const secrets = require('../../data/private/ss-oauth.json');
    process.env.SS_CLIENT_ID=secrets.clientID;
    process.env.SS_CLIENT_SECRET=secrets.secret;
  });

  describe('refreshToken', function() {
    const testTokens = {
      access_token:"aaa",
      token_type:"bearer",
      refresh_token:"rrr",
      expires_at:"2019-06-26T04:14:57.567Z"
    };

    let API = new SmartsheetApi(testTokens);
    
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
