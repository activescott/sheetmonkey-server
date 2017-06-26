'use strict';
require('../support/setup.js');
const expect = require("chai").expect;

const DB = require('../../lib/DB');
const DynamoDB = require('../../lib/DynamoDB');
const uuid = require('uuid');

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
          return db.listUsers().then(users => {
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