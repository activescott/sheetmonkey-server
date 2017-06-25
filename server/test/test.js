'use strict';
const StaticFileHandler = require('../lib/handlers/StaticFileHandler.js');
const JwtHandler = require('../lib/handlers/JwtHandler.js');
const OAuthClientHandler = require('../lib/handlers/OAuthClientHandler.js');
const SmartsheetApi = require('../lib/SmartsheetApi.js');
const UsersHandler = require('../lib/handlers/UsersHandler.js');
const path = require('path');
const uuid = require('uuid');

const DB = require('../lib/DB');
const DynamoDB = require('../lib/DynamoDB');

const chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const SmartsheetApiMock = require('./SmartsheetApiMock');
const DBMock = require('./DBMock');

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

describe('UsersHandler', function() {
  describe('addUser', function() {
    var db;
    var handler;
    var context = null;

    beforeEach(function() {
      // runs before each test in this block
      db = new DBMock();
      handler = new UsersHandler(db);
    });

    it('should succeed with valid data', function() {
      let event = {
        body: JSON.stringify({id: '123456', email: 'a@b.com'})
      }
      return expect(handler.post(event, context)).to.eventually.not.be.null.notify(() => {
        expect(db.users).to.have.lengthOf(1);
      })
    });

    it('should fail with empty data', function() {
      let event = {
        body: ''
      }
      return expect(handler.post(event, context)).to.eventually.be.rejected.notify(() => {
        expect(db.users).to.have.lengthOf(0);
      });
    });

    it('should fail with invalid user', function() {
      
      let event = {
        body: JSON.stringify({x_id: '123456', x_email: 'a@b.com'})
      }
      return expect(handler.post(event, context)).to.eventually.be.rejected.notify(() => {
        expect(db.users).to.have.lengthOf(0);
      });
    });

  });
});

describe('DB', function() {
    describe('addUser', function() {
      this.timeout(5000);


      it('should add a user', function() {
        let db = new DB(new DynamoDB(true), 'sheetmonkey-authserver-beta-users');
        const testUser = {
          id: uuid.v1(), 
          email: 'addUser@test.com'
        };
        return db.addUser(testUser).then(u => {
          console.log('u:', u);
          expect(u).to.have.property('id', testUser.id);
          expect(u).to.have.property('email', testUser.email);
          return db.list().then(users => {
            console.log('list users: ', users);
            expect(users).to.have.length.greaterThan(0);
            let found = users.find(u => u.id === testUser.id);
            expect(found).to.not.be.undefined;
            const expectProps = ['id', 'email', 'updatedAt', 'createdAt'];
            expectProps.forEach(p => expect(found).to.have.property(p));

          });

        })
      });

  });
});