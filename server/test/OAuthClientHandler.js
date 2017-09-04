'use strict';
require('./support/setup.js');
const expect = require("chai").expect;

const JwtHandler = require('../lib/handlers/JwtHandler');
const OAuthClientHandler = require('../lib/handlers/OAuthClientHandler.js');
const SmartsheetApiMock = require('./mocks/SmartsheetApiMock');
const DBMock = require('./mocks/DBMock');
const randomUserID = require('./support/tools').randomUserID;
const cookieCutter = require('../lib/cookieCutter.js')

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
        let cookieObj = cookieCutter(cookie);
        ['jwt', 'Expires'].forEach(p => expect(cookieObj).to.have.property(p));
        let expireDate = Date.parse(cookieObj.Expires);
        expect(expireDate).to.be.greaterThan(Date.now());
      });
    });

    
    
  })

  describe('handleOAuthRedirect - update (refresh or re-login)', function() {
    
    it('should update users tokens', function() {

      // Config the API to return a an expected user:
      const ssApi = new SmartsheetApiMock();
      let id = randomUserID();
      const testUser = {
        id: id,
        email: `${id}@SmartsheetApiMock.com` 
      };
      ssApi.setMeValue(testUser);
      
      handler = new OAuthClientHandler(ssApi, new DBMock());
      
      // add the user once to get him in the app:
      let event = {
        queryStringParameters: {
          code: 'abcdefghijklmnop',
          expires_in: 599781,
          state: JwtHandler.newToken()
        }
      };

      return handler.handleOAuthRedirect(event, null).then(response => {
        expect(response.body).to.match(/Login succeeded/);
        // now add the same user again (since the mock API will return the same user again):
        return handler.handleOAuthRedirect(event, null).then(response => { 
          expect(response.body).to.match(/Login succeeded/);
        });
      });
     
    });

  })
});
