  /* eslint-env mocha */
/* eslint-disable padded-blocks */
'use strict'
require('./support/setup.js')
const expect = require('chai').expect

const PluginsHandler = require('../lib/handlers/PluginsHandler.js')
const DBMock = require('./mocks/DBMock')
const TokenTool = require('./support/TokenTool')
const randomUserID = require('./support/tools').randomUserID
const ServerlessInvoker = require('serverless-http-invoker')
const JwtHandler = require('../lib/handlers/JwtHandler')
const DynamoDB = require('../lib/DynamoDB')
const DB = require('../lib/DB')

describe('PluginsHandler', function () {
  var db
  var handler
  var emptyContext = {}
  var userID
  var invoker = new ServerlessInvoker()

  before(function () {
    db = new DB(new DynamoDB(), 'sheetmonkey-server-beta-users', 'sheetmonkey-server-beta-plugins')
  })

  beforeEach(function () {
    // runs before each test in this block
    return db.deleteAllPlugins().then(() => {
      handler = new PluginsHandler(db)
      userID = randomUserID()
    })
  })

  function buildAuthorizedHeaders (userIDOverride) {
    let token = JwtHandler.newToken(userIDOverride || userID)
    return {
      'Authorization': 'Bearer ' + token
    }
  }

  describe('create', function () {
    it('should add new plugin', function () {
      let event = {
        body: JSON.stringify({ manifestUrl: `https://${userID}.com/manifest.json`, ownerID: randomUserID() }),
        headers: buildAuthorizedHeaders(userID)
      }

      let response = invoker.invoke('POST api/plugins', event)
      return response.then(r => {
        expect(r).to.have.property('statusCode', 200)
        return expect(r.body).to.have.property('ownerID', userID)
      })
    })

    it('should fail without required args', function () {
      const testCases = [
        {
          body: JSON.stringify({ not_manifestUrl: 'https://blah.com/blahmanifest.json', ownerID: 12312312313 }),
          headers: buildAuthorizedHeaders(userID)
        }
      ]

      const results = testCases.map(event => {
        let response = invoker.invoke('POST api/plugins', event)
        return expect(response).to.eventually.be.rejectedWith(/Argument \S+ is required and was not provided/)
      })

      return Promise.all(results)
    })

    it('should succeed with optional args unspecified (clientid, secret)', function () {
      const testCases = [
        {
          body: JSON.stringify({ manifestUrl: `https://${userID}.com/manifest.json`, ownerID: userID }),
          headers: buildAuthorizedHeaders(userID)
        }
      ]

      const results = testCases.map(event => {
        const testCase = JSON.parse(event.body)
        return invoker.invoke('POST api/plugins', event).then(handlerResponse => {
          const responseBody = handlerResponse.body
          expect(responseBody).to.have.property('manifestUrl', testCase.manifestUrl)
          return expect(responseBody).to.have.property('ownerID', testCase.ownerID)
        })
      })
      return Promise.all(results)
    })

    it('should require auth', function () {
      let event = {
        body: JSON.stringify({id: '123456', email: 'a@b.com'})
      }
      return invoker.invoke('POST api/plugins', event).then(response => {
        return expect(response).to.have.property('statusCode', 401)
      })
    })
  })

  describe('list', function () {
    // GET /plugins        <-- public
    // GET /plugins/mine ?  <-- private
    it('should require auth', function () {
      let event = {
        body: JSON.stringify({})
      }
      return invoker.invoke('get api/plugins/mine', event).then(response => {
        return expect(response).to.have.property('statusCode', 401)
      })
    })

    it('should list users plugins with private info', function () {
      const testPlugin = { manifestUrl: `https://blah.com/${userID + 1}.json`, ownerID: userID }
      const testPlugin2 = { manifestUrl: `https://blah.com/${userID + 2}.json`, ownerID: userID }

      return db.addPlugin(testPlugin).then(() => {
        return db.addPlugin(testPlugin2)
      }).then(() => {
        const event = {
          body: {},
          headers: buildAuthorizedHeaders()
        }
        return invoker.invoke(`get api/users/${userID}/plugins`, event).then(response => {
          let plugins = response.body
          console.log('plugins:', plugins)
          expect(plugins).to.have.lengthOf(2)
          expect(plugins).to.deep.include(testPlugin)
          expect(plugins).to.deep.include(testPlugin2)
        })
      })
    })

    it('should list ALL plugins with public info', function () {
      const testPlugin = { manifestUrl: `https://blah.com/aaa.json`, ownerID: randomUserID() }
      const testPlugin2 = { manifestUrl: `https://blah.com/bbb.json`, ownerID: randomUserID() }

      return db.addPlugin(testPlugin).then(() => {
        return db.addPlugin(testPlugin2).then(() => {
          const event = {
            body: {},
            headers: buildAuthorizedHeaders()
          }

          return invoker.invoke(`get api/plugins`, event).then(response => {
            let plugins = response.body
            expect(plugins).to.have.lengthOf(2)
            expect(plugins).to.deep.include({manifestUrl: testPlugin.manifestUrl})
            expect(plugins).to.deep.include({manifestUrl: testPlugin2.manifestUrl})
          })
        })
      })
    })

  })

  describe('read', function () {

    it('should require auth', function () {
      let event = {
        body: JSON.stringify({id: '123456', email: 'a@b.com'})
      }
      return invoker.invoke(`get api/plugins`, event).then(response => {
        expect(response).to.have.property('statusCode', 401)
      })
    })

    it('should return the specified plugin', function () {
      const testUserID = randomUserID()
      const testPlugin = { manifestUrl: `https://blah.com/${testUserID}.json`, ownerID: testUserID }

      return db.addPlugin(testPlugin).then(() => {
        const event = {
          body: JSON.stringify(testPlugin),
          headers: buildAuthorizedHeaders()
        }

        return invoker.invoke(`get api/plugins/${testPlugin.manifestUrl}`, event).then(response => {
          return expect(response.body).to.deep.include({manifestUrl: testPlugin.manifestUrl})
        })
      })
    })

  })

  describe('update', function () {

    it('should require auth', function () {
      let event = {
        body: JSON.stringify({ manifestUrl: `https://blah.com/${userID}.json` })
      }
      let pluginID = encodeURIComponent('http://blah.co/manifest.json')
      return invoker.invoke(`put api/plugins/${pluginID}`, event).then(response => {
        expect(response).to.have.property('statusCode', 401)
      })
    })

    it('should not let caller update unless he is the owner', function () {

      const testPlugin = { manifestUrl: `https://blah.com/${randomUserID()}.json`, ownerID: randomUserID() }

      return db.addPlugin(testPlugin).then(() => {
        const event = {
          body: JSON.stringify(testPlugin),
          headers: buildAuthorizedHeaders(randomUserID()) // note deliberately different userID
        }
        let pluginID = encodeURIComponent('http://blah.co/manifest.json')
        return invoker.invoke(`put api/plugins/${pluginID}`, event).then(response => {
          expect(response).to.have.property('statusCode', 403)
        })
      })
    })

  })

  describe('delete', function () {

    it('should require auth', function () {
      let event = {
        body: JSON.stringify({ manifestUrl: `https://blah.com/${userID}.json` })
      }
      return invoker.invoke(`DELETE api/plugins/http://blah.co/manifest.json`, event).then(response => {
        expect(response).to.have.property('statusCode', 401)
      })
    })

    it('should not let non-owner delete plugin', function () {
      const testPlugin = { manifestUrl: `https://blah.com/${randomUserID()}.json`, ownerID: userID }
      return db.addPlugin(testPlugin).then(() => {
        const event = {
          body: JSON.stringify(testPlugin),
          headers: buildAuthorizedHeaders(randomUserID()) // note deliberately different userID
        }
        // const handlerResponse = handler.delete(event, context)
        return invoker.invoke(`DELETE api/plugins/http://blah.co/manifest.json`, event).then(response => {
          expect(response).to.have.property('statusCode', 403)
        })
      })
    })

    it('should delete a plugin', function () {
      const testPlugin = { manifestUrl: `https://blah.com/${userID}.json`, ownerID: userID }
      return db.addPlugin(testPlugin).then(() => {
        const event = {
          body: JSON.stringify(testPlugin),
          headers: buildAuthorizedHeaders()
        }
        return invoker.invoke(`DELETE api/plugins/http://blah.co/manifest.json`, event).then(response => {
          console.log('RRRRR:', response)
          return expect(response).to.have.property('statusCode', 200)
        })
      })
    })

  })

})
