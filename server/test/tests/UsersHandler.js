/* eslint-env mocha */
/* eslint-disable padded-blocks */
'use strict'
require('../support/setup.js')
const expect = require('chai').expect

const UsersHandler = require('../../lib/handlers/UsersHandler.js')
const DBMock = require('../mocks/DBMock')
const TokenTool = require('../support/TokenTool')
const randomUserID = require('../support/tools').randomUserID

describe('UsersHandler', function () {
  var db
  var handler
  var context = null

  beforeEach(function () {
    // runs before each test in this block
    db = new DBMock()
    handler = new UsersHandler(db)
  })

  describe('addUser', function () {

    it('should succeed with valid data', function () {
      let event = {
        body: JSON.stringify({id: '123456', email: 'a@b.com'})
      }
      return expect(handler.post(event, context)).to.eventually.not.be.null.notify(() => {
        expect(db.users).to.have.lengthOf(1)
      })
    })

    it('should fail with empty data', function () {
      let event = {
        body: ''
      }
      return expect(handler.post(event, context)).to.eventually.be.rejected.notify(() => {
        expect(db.users).to.have.lengthOf(0)
      })
    })

    it('should fail with invalid user', function () {
      let event = {
        body: JSON.stringify({x_id: '123456', x_email: 'a@b.com'})
      }
      return expect(handler.post(event, context)).to.eventually.be.rejected.notify(() => {
        expect(db.users).to.have.lengthOf(0)
      })
    })
  })

  describe('me', function () {
    
    it('should not return secrets', function () {
      const payload = {
        prn: 123
      }
      const testUser = {
        id: payload.prn,
        refresh_token: 'boo',
        access_token: 'boo2',
        expires_at: 123456456
      }
      return db.addUser(testUser).then(() => {
        const tok = TokenTool.newToken(payload)
        const event = { headers: { 'Authorization': `Bearer ${tok}` } }
        const context = {
          protected: {
            claims: {
              prn: payload.prn
            }
          }
        }

        return handler.me(event, context).then(response => {
          expect(response.body).to.be.a('string')
          let user = JSON.parse(response.body)
          expectNoSecretProps(user)
        })
      })
    })

    it('should return body as stringify json', function () {
      const payload = {
        prn: 123
      }
      const testUser = {
        id: payload.prn,
        refresh_token: 'boo',
        access_token: 'boo2',
        expires_at: 123456456
      }
      return db.addUser(testUser).then(() => {
        const tok = TokenTool.newToken(payload)
        const event = { headers: { 'Authorization': `Bearer ${tok}` } }
        const context = {
          protected: {
            claims: {
              prn: payload.prn
            }
          }
        }

        return handler.me(event, context).then(response => {
          expect(response.body).to.be.a('string')
          let user = JSON.parse(response.body)
          expectNoSecretProps(user)
        })
      })
    })

  })

  function expectNoSecretProps (user) {
    const secretProps = ['refresh_token', 'access_token', 'expires_at']
    for (let p of secretProps) {
      expect(user).to.not.have.property(p)
    }
  }

  describe('listUsers', function () {
    it('should list users', function () {
      const testUser = {
        id: 100123456,
        refresh_token: 'boo',
        access_token: 'boo2',
        expires_at: 123456456
      }
      const testUsers = []
      for (let i of [0, 1, 2]) {
        let newUser = Object.assign({}, testUser, { id: randomUserID() })
        testUsers.push(newUser)
      }

      const addOperations = []
      testUsers.forEach(u => addOperations.push(db.addUser(u)))

      return Promise.all(addOperations).then(() => {
        const tok = TokenTool.newToken({ prn: randomUserID() })
        const event = { headers: { 'Authorization': `Bearer ${tok}` } }
        const context = {}
        handler.get(event, context).then(usersResponse => {
          let users = JSON.parse(usersResponse.body)
          expect(users).to.have.lengthOf(3)
          for (let u of users) {
            expectNoSecretProps(u)
          }
        })
      })
    })
  })
})
