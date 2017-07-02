'use strict';
require('../support/setup.js');
const expect = require("chai").expect;

const DB = require('../../lib/DB');
const DynamoDB = require('../../lib/DynamoDB');
const randomUserID = require('../support/tools').randomUserID;

function expectUserProps(user) {
  const expectProps = ['id', 'email', 'updatedAt', 'createdAt'];
  expectProps.forEach(p => expect(user).to.have.property(p));
}

describe('DB', function() {
    let db;

    before(function() {
      // runs before all tests in this block
      db = new DB(new DynamoDB(true), 'sheetmonkey-server-beta-users');
    });

    describe('addUser', function() {
      this.timeout(5000);

      it('should not add a user without an id', function() {
        const testUser = {
          not_id: randomUserID(), 
          email: 'addUser@test.com'
        };
        let p = db.addUser(testUser);
        return expect(p).to.eventually.be.rejectedWith(/user missing required property id/);
      });

      it('should not add a user with a null', function() {
        const testUser = {
          id: null, 
          email: 'addUser@test.com'
        };
        let p = db.addUser(testUser);
        return expect(p).to.eventually.be.rejectedWith(/user missing required property id/);
      });

      it('should not add a user with a undefined', function() {
        const testUser = {
          id: undefined, 
          email: 'addUser@test.com'
        };
        let p = db.addUser(testUser);
        return expect(p).to.eventually.be.rejectedWith(/user missing required property id/);
      });

      it('should add a user', function() {
        const testUser = {
          id: randomUserID(), 
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

      it('should update an existing user, not overwrite', function() {
        //i.e. ensure createdAt is not overwritten
        const testUser = {
          id: randomUserID(), 
          email: 'addUser@test.com',
          access_token: 'CREATED',
          refresh_token: 'xxx',
          expires_at: String(Date.now())
        };
        return db.addUser(testUser).then(newUser => {
          const testUser2 = {
            id: testUser.id, 
            email: 'addUser@test.com',
            access_token: 'UPDATED',
            refresh_token: 'xxx',
            expires_at: testUser.expires_at
          };
          
          return db.addUser(testUser2).then(updatedUser => {
            expect(updatedUser).to.be.null;
            return db.updateUser(testUser2).then(updatedUser => {
              expect(updatedUser).to.not.be.null;
              // now make sure that the update didn't overwrite /all/ existing attributes:
              return db.getUser(testUser.id).then(found => {
                console.log('found:', found);
                expect(found).to.have.property('createdAt', newUser.createdAt);
                expect(found).to.have.property('expires_at', testUser.expires_at);
              })
            });
          });
        });
      });
  });

  describe('getUser', function() {
    
    it('should return null if id null', function() {
      let got = db.getUser(null);
      return expect(got).to.eventually.be.null;
    });

    it('should return null if id not number', function() {
      let got = db.getUser('999');
      return expect(got).to.eventually.be.null;
    });

    it('should return null if no user', function() {
      let got = db.getUser(randomUserID());
      return expect(got).to.eventually.be.null;
    });

    it('should return user if valid input', function() {
      const testUser = {
        id: randomUserID(), 
        email: 'getUser@test.com'
      };
      return db.addUser(testUser).then(u => {
        return db.getUser(testUser.id).then(u => {
          expect(u).to.have.property('id', testUser.id);
          return expectUserProps(u);
        });
      });
    });
  });
});