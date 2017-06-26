'use strict';
require('../support/setup.js');
const expect = require("chai").expect;

const DB = require('../../lib/DB');
const DynamoDB = require('../../lib/DynamoDB');
const uuid = require('uuid');

function expectUserProps(user) {
  const expectProps = ['id', 'email', 'updatedAt', 'createdAt'];
  expectProps.forEach(p => expect(user).to.have.property(p));
}

describe('DB', function() {
    let db;

    before(function() {
      // runs before all tests in this block
      db = new DB(new DynamoDB(true), 'sheetmonkey-authserver-beta-users');
    });

    describe('addUser', function() {
      this.timeout(5000);

      it('should add a user', function() {
        
        const testUser = {
          id: uuid.v1(), 
          email: 'addUser@test.com'
        };
        return db.addUser(testUser).then(u => {
          expect(u).to.have.property('id', testUser.id);
          expect(u).to.have.property('email', testUser.email);
          return db.listUsers().then(users => {
            expect(users).to.have.length.greaterThan(0);
            let found = users.find(u => u.id === testUser.id);
            expect(found).to.have.property('id', testUser.id);
            expectUserProps(found);
          });
        })
      });

  });

  describe('getUser', function() {
    
    it('should return null if no user', function() {
      let got = db.getUser(uuid.v1());
      expect(got).to.eventually.be.null;
    });

    it('should return user if valid input', function() {
      const testUser = {
        id: uuid.v1(), 
        email: 'getUser@test.com'
      };
      return db.addUser(testUser).then(u => {
        let got = db.getUser(testUser.id);
        expect(got).to.eventually.have.property('id', testUser.id)
          .notify(gotResolved => {
            expectUserProps(gotResolved);
          });
        
      });
    });

  });
});