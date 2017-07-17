'use strict'
const Handler = require('./Handler')
const Diag = require('../diag')
const assert = require('assert')

const path = require('path')
const D = new Diag(path.parse(__filename).name)

const pluginArgsSchema = {
  manifestUrl: { type: 'string', required: true },
  // ownerID: { type: 'number', required: true }, // << Note that the ownerID should be retreived from the caller's authenticated principalID
  apiClientID: { type: 'string', required: false },
  apiClientSecret: { type: 'string', required: false }
}

class PluginsHandler extends Handler {
  constructor (db) {
    super()
    assert(db, 'db required')
    this.db = db
  }

  post (event, context) {
    return this.getRequestPrincipal(event, context).then(principalID => {
      let args = this.validateInput(pluginArgsSchema, event)
      // establish the ownerID based on the authenticated caller:
      args = Object.assign(args, { ownerID: principalID })
      return this.db.addPlugin(args).then(plugin => {
        return this.responseAsJson(plugin)
      })
    })
  }

  get (event, context) {
    return this.getRequestPrincipal(event, context).then(principalID => {
      // TODO: list should provide all PUBLIC & private information for a plugin - BUT ONLY for the authenciated caller.
      throw new Error('not yet implemented')
    })
  }

  listPluginsPrivate (event, context) {
    return this.getRequestPrincipal(event, context).then(principalID => {
      // NOTE: Only owner's plugins, but all information
      return this.db.listPlugins().then(plugins => {
        const payload = plugins.filter(p => p.ownerID == principalID)
        return this.responseAsJson(payload)
      })
    })
  }

  listPluginsPublic (event, context) {
    // NOTE: ONLY PUBLIC information for a plugin - (no auth details)
    return this.db.listPlugins().then(plugins => {
      const payload = plugins.map(p => Object.assign({}, { manifestUrl: p.manifestUrl }))
      return this.responseAsJson(payload)
    })
  }

  put (event, context) {
    return this.getRequestPrincipal(event, context).then(principalID => {
      const args = this.validateInput(pluginArgsSchema, event)
      return this.db.updatePlugin(args, principalID).then(plugin => {
        return this.responseAsJson(plugin)
      })
    })
  }

  delete (event, context) {
    return this.getRequestPrincipal(event, context).then(principalID => {
      throw new Error('not yet implemented')
    })
  }
}

module.exports = PluginsHandler
