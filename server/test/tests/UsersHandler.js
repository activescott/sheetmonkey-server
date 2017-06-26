'use strict';
require('../support/setup.js');
const expect = require("chai").expect;

const UsersHandler = require('../../lib/handlers/UsersHandler.js');
const DBMock = require('../mocks/DBMock');

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