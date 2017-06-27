'use strict';
require('../support/setup.js');
const expect = require("chai").expect;

const JwtHandler = require('../../lib/handlers/JwtHandler');
const OAuthClientHandler = require('../../lib/handlers/OAuthClientHandler.js');
const SmartsheetApiMock = require('../mocks/SmartsheetApiMock');
const DBMock = require('../mocks/DBMock');

describe('OAuthClientHandler', function() {
  let handler;

  before(function() {
    // runs before all tests in this block
    process.env.SS_CLIENT_ID='boo';
    process.env.SS_CLIENT_SECRET='boo';
  });

  beforeEach(function() {
    // runs before each test in this block
    handler = new OAuthClientHandler(new SmartsheetApiMock(), new DBMock());
  });

  describe('handleOAuthRedirect', function() {

    it('should succeed on valid args', function() {
      this.timeout(5000);

      let event = {
        queryStringParameters: {
          code: 'abcdefghijklmnop',
          expires_in: 599781,
          state: JwtHandler.newToken()
        }
      };

      return handler.handleOAuthRedirect(event, null).then(response => {
        expect(response).to.have.property('statusCode', 200);
        expect(response).to.have.property('body');
        expect(response.body).to.match(/Login succeeded/);
        // validate cookie was set:
        expect(response.headers).to.have.property('Set-Cookie');
        let cookie = response.headers['Set-Cookie'];
        let cookieObj = cookieToObj(cookie);
        ['jwt', 'Expires'].forEach(p => expect(cookieObj).to.have.property(p));
        let expireDate = Date.parse(cookieObj.Expires);
        expect(expireDate).to.be.greaterThan(Date.now());
      });
    });

    function cookieToObj(cookie) {
      // cookie has multiple key=value pairs separated by semicolons:
      let obj = {};
      const pairs = cookie.split(';');
      for (let p of pairs) {
        let kv = p.split('=');
        obj[kv[0].trim()] = kv[1].trim();
      }
      return obj;
    }
    
  });
});
