/* eslint-env mocha */
/* eslint-disable padded-blocks, no-unused-expressions */
'use strict'
require('./support/setup.js')
const expect = require('chai').expect

const DB = require('../lib/DB')
const DynamoDB = require('../lib/DynamoDB')
const randomUserID = require('./support/tools').randomUserID

function expectUserProps (user) {
  const expectProps = ['id', 'email', 'updatedAt', 'createdAt']
  expectProps.forEach(p => expect(user).to.have.property(p))
}

describe('DB', function () {
  let db

  before(function () {
      // runs before all tests in this block
    db = new DB(new DynamoDB(), 'sheetmonkey-server-beta-users', 'sheetmonkey-server-beta-plugins')
  })

  describe('addUser', function () {
    this.timeout(5000)

    it('should not add a user without an id', function () {
      const testUser = {
        not_id: randomUserID(),
        email: 'addUser@test.com'
      }
      let p = db.addUser(testUser)
      return expect(p).to.eventually.be.rejectedWith(/user missing required property id/)
    })

    it('should not add a user with a null', function () {
      const testUser = {
        id: null,
        email: 'addUser@test.com'
      }
      let p = db.addUser(testUser)
      return expect(p).to.eventually.be.rejectedWith(/user missing required property id/)
    })

    it('should not add a user with a undefined', function () {
      const testUser = {
        id: undefined,
        email: 'addUser@test.com'
      }
      let p = db.addUser(testUser)
      return expect(p).to.eventually.be.rejectedWith(/user missing required property id/)
    })

    it('should add a user', function () {
      const testUser = {
        id: randomUserID(),
        email: 'addUser@test.com'
      }
      return db.addUser(testUser).then(u => {
        expect(u).to.have.property('id', testUser.id)
        expect(u).to.have.property('email', testUser.email)
        return db.listUsers().then(users => {
          expect(users).to.have.length.greaterThan(0)
          let found = users.find(u => u.id === testUser.id)
          expect(found).to.have.property('id', testUser.id)
          expectUserProps(found)
        })
      })
    })

    it('should update an existing user, not overwrite', function () {
        // i.e. ensure createdAt is not overwritten
      const testUser = {
        id: randomUserID(),
        email: 'addUser@test.com',
        access_token: 'CREATED',
        refresh_token: 'xxx',
        expires_at: String(Date.now())
      }
      return db.addUser(testUser).then(newUser => {
        const testUser2 = {
          id: testUser.id,
          email: 'addUser@test.com',
          access_token: 'UPDATED',
          refresh_token: 'xxx',
          expires_at: testUser.expires_at
        }

        return db.addUser(testUser2).then(updatedUser => {
          expect(updatedUser).to.be.null
          return db.updateUser(testUser2).then(updatedUser => {
            expect(updatedUser).to.not.be.null
            // now make sure that the update didn't overwrite /all/ existing attributes:
            return db.getUser(testUser.id).then(found => {
              console.log('found:', found)
              expect(found).to.have.property('createdAt', newUser.createdAt)
              expect(found).to.have.property('expires_at', testUser.expires_at)
            })
          })
        })
      })
    })
  })

  describe('getUser', function () {
    it('should return null if id null', function () {
      let got = db.getUser(null)
      return expect(got).to.eventually.be.null
    })

    it('should return null if id not number', function () {
      let got = db.getUser('999')
      return expect(got).to.eventually.be.null
    })

    it('should return null if no user', function () {
      let got = db.getUser(randomUserID())
      return expect(got).to.eventually.be.null
    })

    it('should return user if valid input', function () {
      const testUser = {
        id: randomUserID(),
        email: 'getUser@test.com'
      }
      return db.addUser(testUser).then(u => {
        return db.getUser(testUser.id).then(u => {
          expect(u).to.have.property('id', testUser.id)
          return expectUserProps(u)
        })
      })
    })
  })

  describe('addPlugin', function () {

    it('should require manifestUrl and ownerID', function () {
      const testCases = [
        {
          manifestUrl: `https://blah.blah/${randomUserID()}.json`,
          not_ownerID: randomUserID()
        },
        {
          not_manifestUrl: `https://blah.blah/${randomUserID()}.json`,
          ownerID: randomUserID()
        },
        {
          not_manifestUrl: `https://blah.blah/${randomUserID()}.json`,
          now_ownerID: randomUserID()
        }
      ]

      const testResults = testCases.map(testCase => {
        let p = db.addPlugin(testCase)
        return expect(p).to.eventually.be.rejectedWith(/Argument \S+ is required and was not provided/)
      })
      return Promise.all(testResults)
    })

    it('should require manifestUrl and ownerID to be correct types', function () {
      const testCases = [
        {
          manifestUrl: 123456,
          ownerID: 'str'
        }
      ]

      const testResults = testCases.map(testCase => {
        let p = db.addPlugin(testCase)
        return expect(p).to.eventually.be.rejectedWith(/Argument \S+ must be of type \S+ but was \S+/)
      })
      return Promise.all(testResults)
    })

    it('should save required args', function () {
      const testCases = [
        {
          manifestUrl: `https://blah.blah/${randomUserID()}.json`,
          ownerID: randomUserID()
        }
      ]

      const testResults = testCases.map(testCase => {
        let p = db.addPlugin(testCase)
        return p.then(resolved => {
          return expect(resolved).to.have.property('manifestUrl', testCase.manifestUrl, 'ownerID', testCase.ownerID)
        })
      })
      return Promise.all(testResults)
    })

    it('should save optional args (apiClientId and apiClientSecret)', function () {
      const testCases = [
        {
          manifestUrl: `https://blah.blah/${randomUserID()}.json`,
          ownerID: randomUserID(),
          apiClientID: 'decafbad',
          apiClientSecret: 'passwordbad'
        }
      ]

      const testResults = testCases.map(testCase => {
        let p = db.addPlugin(testCase)
        return p.then(resolved => {
          return expect(resolved).to.have.property('manifestUrl', testCase.manifestUrl,
                                                   'ownerID', testCase.ownerID,
                                                   'apiClientID', testCase.apiClientID,
                                                   'apiClientSecret', testCase.apiClientSecret)
        })
      })
      return Promise.all(testResults)
    })

    it('should not allow two developers to register the same manifestUrl', function () {
      const testCase = {
        manifestUrl: `https://blah.blah/${randomUserID()}.json`,
        ownerID: randomUserID()
      }

      return db.addPlugin(testCase).then(result1 => {
        return expect(db.addPlugin(testCase)).to.eventually.be.null
      })
    })

  })

  describe('updatePlugin', function () {

    it('should update existing plugin', function () {
      const testCase = {
        manifestUrl: `https://blah.blah/${randomUserID()}.json`,
        ownerID: randomUserID(),
        apiClientID: 'decafbad',
        apiClientSecret: 'passwordbad'
      }

      return db.addPlugin(testCase).then(result1 => {
        const updated = Object.assign({}, testCase, { apiClientID: 'updatedid', apiClientSecret: 'updatedsecret' })
        return db.updatePlugin(updated, testCase.ownerID).then(updated => {
          expect(updated).to.have.property('manifestUrl', testCase.manifestUrl, 'ownerID', testCase.ownerID, 'apiClientID', updated.apiClientID, 'apiClientSecret', updated.apiClientSecret)
          return expect(updated.updatedAt).to.be.greaterThan(updated.createdAt)
        })
      })
    })

    it('should not update non-existing plugin', function () {
      const testCase = {
        manifestUrl: `https://blah.blah/${randomUserID()}.json`,
        ownerID: randomUserID()
      }
      return expect(db.updatePlugin(testCase, testCase.ownerID)).to.eventually.be.rejectedWith(/The conditional request failed/)
    })

    it('should not permit plugin update if caller not owner', function () {
      const testCase = {
        manifestUrl: `https://blah.blah/${randomUserID()}.json`,
        ownerID: randomUserID(),
        apiClientID: 'decafbad',
        apiClientSecret: 'passwordbad'
      }

      return db.addPlugin(testCase).then(result1 => {
        // console.log('db.plugins:', db.plugins)
        const updated = Object.assign({}, testCase, { apiClientID: 'updatedid', apiClientSecret: 'updatedsecret' })
        return expect(db.updatePlugin(updated, randomUserID())).to.eventually.be.rejectedWith(/The conditional request failed/)
      })
    })

  })

  describe('getPlugin', function () {

    it('should return an existing plugin', function () {
      const testCase = {
        manifestUrl: `https://blah.blah/${randomUserID()}.json`,
        ownerID: randomUserID()
      }

      return db.addPlugin(testCase).then(result1 => {
        return db.getPlugin(testCase.manifestUrl).then(got => {
          return expect(got).to.have.property('manifestUrl', testCase.manifestUrl, 'ownerID', testCase.ownerID)
        })
      })
    })

    it('should not return a non-existing plugin', function () {
      return db.getPlugin(`https://blah.blah/${randomUserID()}.json`).then(got => {
        return expect(got).to.be.null
      })
    })

  })
})
