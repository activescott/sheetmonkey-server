'use strict'
const Handler = require('./Handler')
const Diag = require('../diag')
const assert = require('assert')
const StaticFileHandler = require('./StaticFileHandler')

const path = require('path')
const D = new Diag(path.parse(__filename).name)

const createPluginArgsSchema = {
  manifestUrl: { type: 'string', required: true },
  // ownerID: { type: 'number', required: true }, // << Note that the ownerID should be retreived from the caller's authenticated principalID
  apiClientID: { type: 'string', required: false, default: null },
  apiClientSecret: { type: 'string', required: false, default: null },
  requestWhitelist: { type: 'object', required: false, default: [] }
}

class PluginsHandler extends Handler {
  constructor (db) {
    super()
    assert(db, 'db required')
    this.db = db
  }

  static ensureDefaults (plugin) {
    if (plugin) {
      for (const key of Object.keys(createPluginArgsSchema)) {
        if ('default' in createPluginArgsSchema[key]) {
          if (!(key in plugin) || plugin[key] === null) {
            plugin[key] = createPluginArgsSchema[key].default
          }
        }
      }
    }
    return plugin
  }

  static addRedirectUrlToPlugin (plugin) {
    if ('apiClientID' in plugin && 'apiClientSecret' in plugin) {
      const pluginID = encodeURIComponent(plugin.manifestUrl)
      plugin.redirectUrl = `/api/pluginauthcallback/${pluginID}`
    }
    return plugin
  }

  post (event, context) {
    return this.getRequestPrincipal(event, context).then(principalID => {
      let args = this.validateInput(createPluginArgsSchema, event)
      // establish the ownerID based on the authenticated caller:
      args = Object.assign(args, { ownerID: principalID })
      return this.db.addPlugin(args).then(plugin => {
        plugin = PluginsHandler.addRedirectUrlToPlugin(plugin)
        plugin = PluginsHandler.ensureDefaults(plugin)
        return this.responseAsJson(plugin)
      })
    })
  }

  getPrivate (event, context) {
    return this.getRequestPrincipal(event, context).then(principalID => {
      const args = event.pathParameters
      args.manifestUrl = decodeURIComponent(args.manifestUrl)
      return this.db.getPlugin(args.manifestUrl).then(p => {
        if (p) {
          p = PluginsHandler.addRedirectUrlToPlugin(p)
          p = PluginsHandler.ensureDefaults(p)
          return this.responseAsJson(p)
        } else {
          return StaticFileHandler.responseAsError(`Plugin ${args.manifestUrl} not found.`, 404)
        }
      })
    })
  }

  getPublic (event, context) {
    const args = event.pathParameters
    args.manifestUrl = decodeURIComponent(args.manifestUrl)
    return this.db.getPlugin(args.manifestUrl).then(p => {
      if (p) return this.responseAsJson(p)
      else return StaticFileHandler.responseAsError(`Plugin ${args.manifestUrl} not found.`, 404)
    })
  }

  listPrivate (event, context) {
    return this.getRequestPrincipal(event, context).then(principalID => {
      // NOTE: Only owner's plugins, but all information
      return this.db.listPlugins().then(plugins => {
        plugins = plugins.filter(p => p.ownerID === principalID)
        plugins = plugins.map(PluginsHandler.addRedirectUrlToPlugin)
        plugins = plugins.map(PluginsHandler.ensureDefaults)
        return this.responseAsJson(plugins)
      })
    })
  }

  listPublic (event, context) {
    // NOTE: ONLY PUBLIC information for a plugin - (no auth details)
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
      let args = this.validateInput(createPluginArgsSchema, event)
      return this.db.updatePlugin(args, principalID).then(plugin => {
        plugin = PluginsHandler.addRedirectUrlToPlugin(plugin)
        plugin = PluginsHandler.ensureDefaults(plugin)
        return this.responseAsJson(plugin)
      }).catch(err => {
        // if user exists, just return null; if another error, rethrow
        if (('name' in err) && err.name === 'ConditionalCheckFailedException') {
          return StaticFileHandler.responseAsError('Forbidden: Only the owner can update their plugin.', 403)
        }
        throw err
      })
    })
  }

  delete (event, context) {
    return this.getRequestPrincipal(event, context).then(principalID => {
      const args = event.pathParameters
      args.manifestUrl = decodeURIComponent(args.manifestUrl)
      return this.db.getPlugin(args.manifestUrl).then(p => {
        if (p.ownerID !== principalID) {
          return StaticFileHandler.responseAsError('Forbidden: Only the owner can delete their plugin.', 403)
        }
        return this.db.deletePlugin(args.manifestUrl, principalID).then(() => {
          return this.responseAsJson()
        })
      })
    })
  }
}

module.exports = PluginsHandler
