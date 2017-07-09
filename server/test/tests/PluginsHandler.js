/* eslint-env mocha */
/* eslint-disable padded-blocks */
'use strict'
require('../support/setup.js')
const expect = require('chai').expect

const PluginsHandler = require('../../lib/handlers/PluginsHandler.js')
const DBMock = require('../mocks/DBMock')
const TokenTool = require('../support/TokenTool')
const randomUserID = require('../support/tools').randomUserID

describe('PluginsHandler', function () {
  var db
  var handler
  var emptyContext = {}
  var authorizedContext

  beforeEach(function () {
    // runs before each test in this block
    db = new DBMock()
    authorizedContext = {
      protected: {
        claims: {
          prn: randomUserID()
        }
      }
    }
    handler = new PluginsHandler(db)
  })

  describe('create', function () {

    it('should add new plugin', function () {
      let event = {
        body: JSON.stringify({ manifestUrl: 'https://blah.com/blahmanifest.json', ownerID: randomUserID() })
      }
      return expect(handler.post(event, authorizedContext)).to.eventually.not.be.null.notify(() => {
        // ensure plugin added
        return expect(db.listPlugins()).to.eventually.lengthOf(1)
      })
    })

    it('should fail without required args', function () {
      const testCases = [
        {
          body: JSON.stringify({ not_manifestUrl: 'https://blah.com/blahmanifest.json', ownerID: 12312312313 })
        },
      ]

      const results = testCases.map(event => {
        return expect(handler.post(event, authorizedContext)).to.eventually.be.rejectedWith(/Argument \S+ is required and was not provided/)
      })

      return Promise.all(results)
    })

    it('should succeed with optional args unspecified (clientid, secret)', function () {
      const testCases = [
        {
          body: JSON.stringify({ manifestUrl: 'https://blah.com/blahmanifest.json', ownerID: 12312312313 })
        }
      ]

      const results = testCases.map(event => {
        const testCase = JSON.parse(event.body)
        return handler.post(event, authorizedContext).then(handlerResponse => {
          // console.log('handlerResponse:', handlerResponse)
          const responseBody = JSON.parse(handlerResponse.body)
          return expect(responseBody).to.have.property('manifestUrl', testCase.manifestUrl, 'ownerID', testCase.ownerID)
        })
      })

      return Promise.all(results)
    })

    it('should require auth', function () {
      let event = {
        body: JSON.stringify({id: '123456', email: 'a@b.com'})
      }
      return expect(handler.post(event, emptyContext)).to.eventually.be.rejectedWith(/protected claims required. ensure authorized/)
    })

  })

  describe('read', function () {

    it('should require auth', function () {
      let event = {
        body: JSON.stringify({id: '123456', email: 'a@b.com'})
      }
      return expect(handler.get(event, emptyContext)).to.eventually.rejectedWith(/protected claims required. ensure authorized/)
    })

  })

  describe('update', function () {

    it('should require auth', function () {
      let event = {
        body: JSON.stringify({id: '123456', email: 'a@b.com'})
      }
      return expect(handler.put(event, emptyContext)).to.eventually.rejectedWith(/protected claims required. ensure authorized/)
    })

    it('should not let caller update unless he is the owner', function () {

      const testPlugin = { manifestUrl: `https://blah.com/${randomUserID()}.json`, ownerID: randomUserID() }

      db.addPlugin(testPlugin).then(() => {
        const event = {
          body: JSON.stringify(testPlugin)
        }
        const context = {
          protected: {
            claims: {
              prn: randomUserID() // <- Note different ownerID
            }
          }
        }

        const handlerResponse = handler.put(event, context)

        return expect(handlerResponse).to.eventually.be.rejectedWith(/DBMock: Unauthorized/)

      })
    })

  })

  describe('delete', function () {

    it('should require auth', function () {
      let event = {
        body: JSON.stringify({id: '123456', email: 'a@b.com'})
      }
      return expect(handler.delete(event, emptyContext)).to.eventually.rejectedWith(/protected claims required. ensure authorized/)
    })

  })

})
