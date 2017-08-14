'use strict'
const Handler = require('./Handler')
const Diag = require('../diag')
const assert = require('assert')

const path = require('path')
const D = new Diag(path.parse(__filename).name)

const createPluginArgsSchema = {
  manifestUrl: { type: 'string', required: true },
  // ownerID: { type: 'number', required: true }, // << Note that the ownerID should be retreived from the caller's authenticated principalID
  apiClientID: { type: 'string', required: false },
  apiClientSecret: { type: 'string', required: false }
}
const getPluginArgsSchema = {
  manifestUrl: { type: 'string', required: true }
}

class PluginsHandler extends Handler {
  constructor (db) {
    super()
    assert(db, 'db required')
    this.db = db
  }

  post (event, context) {
    return this.getRequestPrincipal(event, context).then(principalID => {
      let args = this.validateInput(createPluginArgsSchema, event)
      // establish the ownerID based on the authenticated caller:
      args = Object.assign(args, { ownerID: principalID })
      return this.db.addPlugin(args).then(plugin => {
        return this.responseAsJson(plugin)
      })
    })
  }

  get (event, context) {
    return this.getRequestPrincipal(event, context).then(principalID => {
      let args = this.validateInput(getPluginArgsSchema, event)
      return this.db.getPlugin(args.manifestUrl).then(p => {
        if (p.ownerID !== principalID) {
          throw new Error('Delete failed. caller does not own the plugin')
        }
        return this.db.getPlugin(args.manifestUrl).then(p => {
          return this.responseAsJson(p)
        })
      })
    })
  }

  listPrivate (event, context) {
    return this.getRequestPrincipal(event, context).then(principalID => {
      // NOTE: Only owner's plugins, but all information
      return this.db.listPlugins().then(plugins => {
        const payload = plugins.filter(p => p.ownerID === principalID)
        return this.responseAsJson(payload)
      })
    })
  }

  listPublic (event, context) {
    // NOTE: ONLY PUBLIC information for a plugin - (no auth details)
    console.log('plugins.listPublic')
    return this.db.listPlugins().then(plugins => {
      const payload = plugins.map(p => Object.assign({}, { manifestUrl: p.manifestUrl }))
      return this.responseAsJson(payload)
    })
  }

  put (event, context) {
    /** NOTE: Now that a plugin is whittled down to nothing more than a single editable property 
      (manifestURL) and the only property is also the key, edit/update/put isn't necessary but 
      I'll leave this hear as a reference in case we add more properties to plugin later.
    */
    return this.getRequestPrincipal(event, context).then(principalID => {
      const args = this.validateInput(createPluginArgsSchema, event)
      return this.db.updatePlugin(args, principalID).then(plugin => {
        return this.responseAsJson(plugin)
      }).catch(err => {
        // if user exists, just return null; if another error, rethrow
        if (('name' in err) && err.name === 'ConditionalCheckFailedException') {
          return this.responseAsError(403, 'Forbidden: Only the owner can update their plugin.')
        }
        throw err
      })
    })
  }

  delete (event, context) {
    return this.getRequestPrincipal(event, context).then(principalID => {
      let args = this.validateInput(getPluginArgsSchema, event)
      return this.db.getPlugin(args.manifestUrl).then(p => {
        if (p.ownerID !== principalID) {
          return this.responseAsError(403, 'Forbidden: Only the owner can delete their plugin.')
        }
        return this.db.deletePlugin(args.manifestUrl, principalID).then(() => {
          return this.responseAsJson()
        })
      })
    })
  }
}

module.exports = PluginsHandler
