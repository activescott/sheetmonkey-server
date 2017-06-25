'use strict';
const StaticFileHandler = require('../lib/handlers/StaticFileHandler.js');
const JwtHandler = require('../lib/handlers/JwtHandler.js');
const OAuthClientHandler = require('../lib/handlers/OAuthClientHandler.js');
const SmartsheetApi = require('../lib/SmartsheetApi.js');
const path = require('path');

const chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const SmartsheetApiMock = require('./SmartsheetApiMock');

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

      return new OAuthClientHandler(new SmartsheetApiMock()).handleOAuthRedirect(event, null).then(response => {
        console.log('response:', response);
        console.log('callback');
        expect(response).to.have.property('statusCode', 200);
        expect(response).to.have.property('body');
        expect(response.body).to.match(/Success!/);
      });
    });
  });
});

describe('SmartsheetApi', function() {
  this.timeout(5000);
  before(function() {
    // runs before all tests in this block
    const secrets = require('../data/private/ss-oauth.json');
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