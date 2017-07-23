/* eslint-env mocha */
/* eslint-disable padded-blocks */
'use strict'
require('./support/setup.js')
const expect = require('chai').expect

const UsersHandler = require('../lib/handlers/UsersHandler.js')
const DBMock = require('./mocks/DBMock')
const TokenTool = require('./support/TokenTool')
const randomUserID = require('./support/tools').randomUserID

describe('UsersHandler', function () {
  var db
  var handler
  var context = null

  beforeEach(function () {
    // runs before each test in this block
    db = new DBMock()
    handler = new UsersHandler(db)
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
})
