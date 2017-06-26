'use strict';
require('../support/setup.js');
const expect = require("chai").expect;

const SmartsheetApi = require('../../lib/SmartsheetApi.js');

describe('SmartsheetApi', function() {
  this.timeout(5000);

  before(function() {
    // runs before all tests in this block
    const secrets = require('../../data/private/ss-oauth.json');
    process.env.SS_CLIENT_ID=secrets.clientID;
    process.env.SS_CLIENT_SECRET=secrets.secret;
  });

  describe('getToken', function() {
    
    it.skip('should have a valid response', function() {
      let t = new SmartsheetApi().getToken('mpoe02a7tc8qmhq');
      t.then(v => console.log('t resp:', v));
      let props = ['access_token', 'token_type', 'refresh_token', 'expires_in'];
      for (let p of props) {
        expect(t).to.eventually.have.property(p);
      }
      return t;
    });

  });
});
