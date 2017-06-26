'use strict';
require('../support/setup.js');
const expect = require("chai").expect;

const JwtHandler = require('../../lib/handlers/JwtHandler');
const OAuthClientHandler = require('../../lib/handlers/OAuthClientHandler.js');
const SmartsheetApiMock = require('../mocks/SmartsheetApiMock');
const DBMock = require('../mocks/DBMock');

describe('OAuthClientHandler', function() {
  before(function() {
    // runs before all tests in this block
    process.env.SS_CLIENT_ID='boo';
    process.env.SS_CLIENT_SECRET='boo';
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

      return new OAuthClientHandler(new SmartsheetApiMock(), new DBMock()).handleOAuthRedirect(event, null).then(response => {
        expect(response).to.have.property('statusCode', 200);
        expect(response).to.have.property('body');
        expect(response.body).to.match(/Login succeeded/);
      });
    });
    
  });
});
