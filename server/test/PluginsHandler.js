/* eslint-env mocha */
/* eslint-disable padded-blocks */
'use strict'
require('./support/setup.js')
const expect = require('chai').expect

const randomUserID = require('./support/tools').randomUserID
const ServerlessInvoker = require('serverless-http-invoker')
const JwtHandler = require('../lib/handlers/JwtHandler')
const DynamoDB = require('../lib/DynamoDB')
const DB = require('../lib/DB')

describe('PluginsHandler', function () {
  var db
  var userID
  var invoker = new ServerlessInvoker()

  before(function () {
    db = new DB(new DynamoDB(), 'sheetmonkey-server-beta-users', 'sheetmonkey-server-beta-plugins', 'sheetmonkey-server-beta-apiTokens')
  })

  beforeEach(function () {
    // runs before each test in this block
    return db.deleteAllPlugins().then(() => {
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

      let response = invoker.invoke(`POST api/users/${userID}/plugins`, event)
      return response.then(r => {
        expect(r).to.have.property('statusCode', 200)
        return expect(r.body).to.have.property('ownerID', userID)
      })
    })

    it('should require auth', function () {
      let event = {
        body: JSON.stringify({id: '123456', email: 'a@b.com'})
      }
      return invoker.invoke(`POST api/users/{userID}/plugins`, event).then(response => {
        return expect(response).to.have.property('statusCode', 401)
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
        let response = invoker.invoke(`POST api/users/${userID}/plugins`, event)
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
        return invoker.invoke(`POST api/users/${userID}/plugins`, event).then(handlerResponse => {
          const responseBody = handlerResponse.body
          expect(responseBody).to.have.property('manifestUrl', testCase.manifestUrl)
          return expect(responseBody).to.have.property('ownerID', testCase.ownerID)
        })
      })
      return Promise.all(results)
    })

    it('should save optional args (clientid, secret)', function () {
      const testCases = [
        {
          body: JSON.stringify({
            manifestUrl: `https://${userID}.com/manifest.json`,
            ownerID: userID,
            apiClientID: `clientid${randomUserID()}`,
            apiClientSecret: `secret${randomUserID()}`
          }),
          headers: buildAuthorizedHeaders(userID)
        }
      ]

      const results = testCases.map(event => {
        const testCase = JSON.parse(event.body)
        return invoker.invoke(`POST api/users/${userID}/plugins`, event).then(handlerResponse => {
          const responseBody = handlerResponse.body
          expect(responseBody).to.have.property('apiClientID', testCase.apiClientID)
          return expect(responseBody).to.have.property('apiClientSecret', testCase.apiClientSecret)
        })
      })
      return Promise.all(results)
    })

    it('should have redirectUrl when apiClient props provided', function () {
      let event = {
        body: JSON.stringify({ manifestUrl: `https://${userID}.com/manifest.json`, ownerID: randomUserID(), apiClientID: 'abc', apiClientSecret: 'xyz' }),
        headers: buildAuthorizedHeaders(userID)
      }

      let response = invoker.invoke(`POST api/users/${userID}/plugins`, event)
      return response.then(r => {
        expect(r).to.have.property('statusCode', 200)
        return expect(r.body).to.have.property('redirectUrl')
      })
    })

    it('should not have redirectUrl when apiClient props not provided', function () {
      let event = {
        body: JSON.stringify({ manifestUrl: `https://${userID}.com/manifest.json`, ownerID: randomUserID() }),
        headers: buildAuthorizedHeaders(userID)
      }

      let response = invoker.invoke(`POST api/users/${userID}/plugins`, event)
      return response.then(r => {
        expect(r).to.have.property('statusCode', 200)
        return expect(r.body).to.not.have.property('redirectUrl')
      })
    })

  })

  describe('list private', function () {
    // GET api/plugins                <-- public
    // GET api/users/{userID}/plugins <-- private
    it('should require auth', function () {
      let event = {
        body: JSON.stringify({})
      }
      return invoker.invoke(`get api/users/${userID}/plugins`, event).then(response => {
        return expect(response).to.have.property('statusCode', 401)
      })
    })

    it('should list plugins with private info', function () {
      const testPlugin = { manifestUrl: `https://blah.com/${userID}.json`, ownerID: userID, apiClientID: 'clid', apiClientSecret: 'secret' }

      return db.addPlugin(testPlugin).then(() => {
        const event = {
          body: {},
          headers: buildAuthorizedHeaders()
        }
        return invoker.invoke(`get api/users/${userID}/plugins`, event).then(response => {
          const plugins = response.body
          expect(plugins).to.have.lengthOf(1)
          const p = plugins[0]
          expect(p).to.have.property('apiClientID')
          expect(p).to.have.property('apiClientSecret')
        })
      })
    })

    it('should include redirectUrl when cliendID and clientSecret present', function () {
      const testPlugin = { manifestUrl: `https://blah.com/${userID}.json`, ownerID: userID, apiClientID: 'clid', apiClientSecret: 'secret' }

      return db.addPlugin(testPlugin).then(() => {
        const event = {
          body: {},
          headers: buildAuthorizedHeaders()
        }
        return invoker.invoke(`get api/users/${userID}/plugins`, event).then(response => {
          const plugins = response.body
          expect(plugins).to.have.lengthOf(1)
          const p = plugins[0]
          expect(p).to.have.property('redirectUrl')
        })
      })
    })

    it('should NOT include redirectUrl when cliendID and clientSecret not present', function () {
      const testPlugin = { manifestUrl: `https://blah.com/${userID}.json`, ownerID: userID }

      return db.addPlugin(testPlugin).then(() => {
        const event = {
          body: {},
          headers: buildAuthorizedHeaders()
        }
        return invoker.invoke(`get api/users/${userID}/plugins`, event).then(response => {
          const plugins = response.body
          expect(plugins).to.have.lengthOf(1)
          const p = plugins[0]
          expect(p).to.not.have.property('redirectUrl')
        })
      })
    })

  })

  describe('list public', function () {
    it('should NOT require auth', function () {
      let event = {
        body: JSON.stringify({})
      }
      return invoker.invoke(`get api/plugins`, event).then(response => {
        return expect(response).to.have.property('statusCode', 200)
      })
    })

    it('should list plugins from all users', function () {
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

    it('should not provide private properties', function () {
      const testPlugin = {
        manifestUrl: `https://blah.com/aaa.json`,
        ownerID: randomUserID(),
        apiClientID: 'fdsjhklfas',
        apiClientSecret: 'fdsjhklfas'
      }
      return db.addPlugin(testPlugin).then(() => {
        const event = {
          body: {},
          headers: buildAuthorizedHeaders()
        }
        return invoker.invoke(`get api/plugins`, event).then(response => {
          let p = response.body[0]
          expect(p).to.not.have.property('apiClientID')
          expect(p).to.not.have.property('apiClientSecret')
        })
      })
    })

  })

  describe('read public', function () {

    it('should return the specified plugin', function () {
      const testUserID = randomUserID()
      const testPlugin = { manifestUrl: `https://blah.com/${testUserID}.json`, ownerID: testUserID }

      return db.addPlugin(testPlugin).then(() => {
        const event = {
        }

        return invoker.invoke(`GET api/plugins/${encodeURIComponent(testPlugin.manifestUrl)}`, event).then(response => {
          return expect(response.body).to.deep.include({manifestUrl: testPlugin.manifestUrl})
        })
      })
    })

    it('should return 404 if not found', function () {
      const event = { }
      return invoker.invoke(`GET api/plugins/http___nonsense`, event).then(response => {
        expect(response).to.have.property('statusCode', 404)
      })
    })

  })

  describe('read private', function () {

    it('should return the specified plugin', function () {
      const testUserID = randomUserID()
      const testPlugin = { manifestUrl: `https://blah.com/${testUserID}.json`, ownerID: testUserID }

      return db.addPlugin(testPlugin).then(() => {
        const event = {
          headers: buildAuthorizedHeaders()
        }

        return invoker.invoke(`GET api/users/${userID}/plugins/${encodeURIComponent(testPlugin.manifestUrl)}`, event).then(response => {
          return expect(response.body).to.deep.include({manifestUrl: testPlugin.manifestUrl})
        })
      })
    })

    it('should return 404 if not found', function () {
      const event = {
        headers: buildAuthorizedHeaders()
      }
      return invoker.invoke(`GET api/users/${userID}/plugins/http___nonsense`, event).then(response => {
        expect(response).to.have.property('statusCode', 404)
      })
    })

    it('should include private properties', function () {
      const testPlugin = { manifestUrl: `https://blah.com/${userID}.json`, ownerID: userID, apiClientID: 'abc', apiClientSecret: 'def' }
      return db.addPlugin(testPlugin).then(() => {
        const event = {
          headers: buildAuthorizedHeaders()
        }
        return invoker.invoke(`GET api/users/${userID}/plugins/${encodeURIComponent(testPlugin.manifestUrl)}`, event).then(response => {
          const p = response.body
          expect(p).to.have.property('apiClientID')
          return expect(p).to.have.property('apiClientSecret')
        })
      })
    })

    it('should include redirectURL if apiClient props provided', function () {
      const testPlugin = { manifestUrl: `https://blah.com/${userID}.json`, ownerID: userID, apiClientID: 'abc', apiClientSecret: 'def' }
      return db.addPlugin(testPlugin).then(() => {
        const event = {
          headers: buildAuthorizedHeaders()
        }
        return invoker.invoke(`GET api/users/${userID}/plugins/${encodeURIComponent(testPlugin.manifestUrl)}`, event).then(response => {
          const p = response.body
          return expect(p).to.have.property('redirectUrl')
        })
      })
    })

    it('should not include redirectURL if apiClient props not provided', function () {
      const testPlugin = { manifestUrl: `https://blah.com/${userID}.json`, ownerID: userID }
      return db.addPlugin(testPlugin).then(() => {
        const event = {
          headers: buildAuthorizedHeaders()
        }
        return invoker.invoke(`GET api/users/${userID}/plugins/${encodeURIComponent(testPlugin.manifestUrl)}`, event).then(response => {
          const p = response.body
          return expect(p).to.not.have.property('redirectUrl')
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
      return invoker.invoke(`PUT api/users/${userID}/plugins/${pluginID}`, event).then(response => {
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
        return invoker.invoke(`PUT api/users/${userID}/plugins/${pluginID}`, event).then(response => {
          expect(response).to.have.property('statusCode', 403)
        })
      })
    })

  })

  describe('delete', function () {

    it('should require auth', function () {
      let event = {
      }
      let manifestUrl = encodeURIComponent('http://blah.co/manifest.json')
      return invoker.invoke(`DELETE api/users/${userID}/plugins/${manifestUrl}`, event).then(response => {
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
        let manifestUrl = encodeURIComponent(testPlugin.manifestUrl)
        return invoker.invoke(`DELETE api/users/${userID}/plugins/${manifestUrl}`, event).then(response => {
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
        let manifestUrl = encodeURIComponent(testPlugin.manifestUrl)
        return invoker.invoke(`DELETE api/users/${userID}/plugins/${manifestUrl}`, event).then(response => {
          return expect(response).to.have.property('statusCode', 200)
        })
      })
    })

  })

})
