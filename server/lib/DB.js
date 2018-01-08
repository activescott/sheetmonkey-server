'use strict'
const Promise = require('bluebird')
const assert = require('assert')
const Diag = require('./Diag')
const validateInput = require('./ValidationTools').validateInput

const D = new Diag('DB')

const ALL_USER_PROPS = ['id', 'email', 'createdAt', 'updatedAt', 'access_token', 'expires_at', 'refresh_token']
const REQUIRED_USER_ADD_PROPS = ['id', 'email']
const REQUIRED_USER_UPDATE_PROPS = ['id', 'email', 'access_token', 'expires_at', 'refresh_token']
const ALL_PLUGIN_PROPS = ['manifestUrl', 'ownerID', 'apiClientID', 'apiClientSecret', 'requestWhitelist']
const ALL_PLUGIN_API_AUTH_PROPS = ['manifestUrl', 'userID', 'access_token', 'expires_at', 'refresh_token']

class DB {
  constructor (ddb, usersTableName, pluginsTableName, apiTokensTableName) {
    assert(ddb, 'ddb arg required')
    assert(usersTableName, 'usersTableName arg required')
    assert(pluginsTableName, 'pluginsTableName arg required')
    assert(apiTokensTableName, 'apiTokensTableName arg required')
    this.ddb = ddb
    this.usersTableName = usersTableName
    this.pluginsTableName = pluginsTableName
    this.apiTokensTableName = apiTokensTableName
  }

  addUser (user) {
    user = Object.assign({}, user) // don't modify the input user obj
    return Promise.try(() => {
      REQUIRED_USER_ADD_PROPS.forEach(attr => assert(attr in user && user[attr], `user missing required property ${attr}`))
      if ('access_token' in user) {
        assert('expires_at' in user, 'when providing access_token expires_at must also be provided')
      }

      const now = String(Date.now())
      user.createdAt = now
      user.updatedAt = now

      let putItem = this.ddb.put({
        TableName: this.usersTableName,
        Item: user,
        ConditionExpression: 'attribute_not_exists(id)' // <- ensure user isn't overwritten if exists
      })
      return putItem.then(() => user)
    }).catch(err => {
      // if user exists, just return null; if another error, rethrow
      if (err.name && err.name === 'ConditionalCheckFailedException') {
        return null
      }
      throw err
    })
  }

  updateUser (user) {
    return Promise.try(() => {
      REQUIRED_USER_UPDATE_PROPS.forEach(attr => assert(attr in user && user[attr], `user missing required property ${attr}`))
      const now = String(Date.now())

      return this.ddb.update({
        TableName: this.usersTableName,
        Key: { id: user.id },
        UpdateExpression: 'SET email = :email, access_token = :access_token, expires_at = :expires_at, refresh_token = :refresh_token, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':email': user.email,
          ':access_token': user.access_token,
          ':expires_at': user.expires_at,
          ':refresh_token': user.refresh_token,
          ':updatedAt': now
        },
        ReturnValues: 'ALL_NEW'
      }).then(result => {
        return result.Attributes
      })
    })
  }

  listUsers () {
    return this.ddb.scan({
      TableName: this.usersTableName,
      ProjectionExpression: ALL_USER_PROPS.join(', ')
    }).then(result => result.Items)
  }

  /**
   * Returns the user or null.
   */
  getUser (id) {
    // our schema requires a number.
    if (!id || typeof id !== 'number') {
      D.log('getUser: invalid id, indicating user not found')
      return Promise.resolve(null)
    }
    let params = {
      TableName: this.usersTableName,
      Key: { id: id },
      ProjectionExpression: ALL_USER_PROPS.join(', ')
    }
    return this.ddb.get(params).then(result => {
      if (result && result.Item) {
        return result.Item
      } else {
        D.log(`getUser: user with id ${id} not found. Result:`, result)
      }
      return null
    }).catch(err => {
      // more detail to the error
      throw new Error(`getUser error: ${err}`)
    })
  }

  listPlugins () {
    return this.ddb.scan({
      TableName: this.pluginsTableName,
      ProjectionExpression: ALL_PLUGIN_PROPS.join(', ')
    }).then(result => result.Items)
  }

  addPlugin (plugin) {
    return Promise.try(() => {
      const addPluginSpec = {
        manifestUrl: { type: 'string', required: true },
        ownerID: { type: 'number', required: true },
        apiClientID: { type: 'string', required: false },
        apiClientSecret: { type: 'string', required: false },
        requestWhitelist: { type: 'object', required: false }
      }
      plugin = validateInput(addPluginSpec, plugin)
      const now = String(Date.now())
      plugin.createdAt = now
      plugin.updatedAt = now

      return this.ddb.put({
        TableName: this.pluginsTableName,
        Item: plugin,
        ConditionExpression: 'attribute_not_exists(ownerID)' // <- ensure isn't overwritten if exists
      })
      .then(() => {
        return plugin
      })
      .catch(err => {
        // if already exists, just return null; if another error, rethrow
        if (err.name && err.name === 'ConditionalCheckFailedException') {
          console.log('plugin exists!')
          return null
        }
        throw err
      })
    })
  }

  /**
   * Updates the specified plugin for the specified caller/owner.
   * @param {*Object} plugin The attributes for the plugin
   * @param {*Number} callerPrincipalID The authenticated userID for the current caller - must be the owner of the specified plugin!
   */
  updatePlugin (plugin, callerPrincipalID) {
    return Promise.try(() => {
      const updatePluginSpec = {
        manifestUrl: { type: 'string', required: true },
        apiClientID: { type: 'string', required: false },
        apiClientSecret: { type: 'string', required: false },
        requestWhitelist: { type: 'object', required: false }
      }
      plugin = validateInput(updatePluginSpec, plugin)
      const now = String(Date.now())

      return this.ddb.update({
        TableName: this.pluginsTableName,
        Key: { manifestUrl: plugin.manifestUrl },
        UpdateExpression: 'SET apiClientID = :apiClientID, apiClientSecret = :apiClientSecret, requestWhitelist = :requestWhitelist, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':callerPrincipalID': callerPrincipalID,
          ':apiClientID': plugin.apiClientID ? plugin.apiClientID : null,
          ':apiClientSecret': plugin.apiClientSecret ? plugin.apiClientSecret : null,
          ':requestWhitelist': plugin.requestWhitelist ? plugin.requestWhitelist : [],
          ':updatedAt': now
        },
        ConditionExpression: 'attribute_exists(manifestUrl) AND ownerID = :callerPrincipalID',
        ReturnValues: 'ALL_NEW'
      }).then(result => result.Attributes)
    })
  }

  getPlugin (manifestUrl) {
    if (!manifestUrl || typeof manifestUrl !== 'string') {
      D.log('getPlugin: invalid manifestUrl')
      return Promise.resolve(null)
    }
    let params = {
      TableName: this.pluginsTableName,
      Key: { manifestUrl: manifestUrl },
      ProjectionExpression: ALL_PLUGIN_PROPS.join(', ')
    }
    return this.ddb.get(params).then(result => {
      if (result && result.Item) {
        return result.Item
      } else {
        D.log(`getPlugin: plugin with manifestUrl ${manifestUrl} not found. Result:`, result)
      }
      return null
    }).catch(err => {
      // more detail to the error
      throw new Error(`getPlugin error: ${err}`)
    })
  }

  deletePlugin (manifestUrl, callerPrincipalID) {
    if (!manifestUrl || typeof manifestUrl !== 'string') {
      D.log('getPlugin: invalid manifestUrl')
      return Promise.resolve(null)
    }
    let params = {
      TableName: this.pluginsTableName,
      Key: { manifestUrl: manifestUrl },
      ConditionExpression: 'attribute_exists(manifestUrl) AND ownerID = :callerPrincipalID',
      ExpressionAttributeValues: {
        ':callerPrincipalID': callerPrincipalID
      }
    }
    return this.ddb.delete(params).catch(err => {
      // more detail to the error
      throw new Error(`getPlugin error: ${err}`)
    })
  }

  deleteAllPlugins () {
    return this.listPlugins().then(plugins => {
      let promises = plugins.map(p => this.deletePlugin(p.manifestUrl, p.ownerID))
      return Promise.all(promises)
    })
  }

  deleteAllUsers () {
    return this.listUsers().then(users => {
      let promises = users.map(u => this.deleteUser(u.id))
      return Promise.all(promises)
    })
  }

  /**
   * Adds or updates the token for the specified plugin and user.
   */
  addApiTokenForPluginUser (pluginManifestUrl, userID, access_token, refresh_token, expires_at) { // eslint-disable-line camelcase
    return Promise.try(() => {
      const item = {
        'manifestUrl': pluginManifestUrl,
        'userID': userID,
        'access_token': access_token,
        'refresh_token': refresh_token,
        'expires_at': expires_at
      }
      for (const argName of Object.keys(item)) {
        if (!item[argName]) throw new Error(`${argName} must be provided`)
      }

      let putItem = this.ddb.put({
        TableName: this.apiTokensTableName,
        Item: item
      })
      return putItem.then(() => item)
    }).catch(err => {
      throw new Error('addApiTokenForPluginUser error: ' + err)
    })
  }

  getApiTokenForPluginUser (pluginManifestUrl, userID) {
    if (!pluginManifestUrl || typeof pluginManifestUrl !== 'string') {
      D.log('getApiTokenForPluginUser: invalid pluginManifestUrl')
      return Promise.resolve(null)
    }
    let params = {
      TableName: this.apiTokensTableName,
      Key: { manifestUrl: pluginManifestUrl, userID: userID },
      ProjectionExpression: ALL_PLUGIN_API_AUTH_PROPS.join(', ')
    }
    return this.ddb.get(params).then(result => {
      if (result && result.Item) {
        return result.Item
      } else {
        D.log(`getApiTokenForPluginUser: access token for plugin '${pluginManifestUrl}' and user '${userID}' not found. Result:`, result)
      }
      return null
    }).catch(err => {
      // more detail to the error
      throw new Error(`getApiTokenForPluginUser error: ${err}`)
    })
  }

  deleteApiToken (pluginManifestUrl, userID) {
    if (!pluginManifestUrl || typeof pluginManifestUrl !== 'string') {
      D.log('deleteApiToken: invalid pluginManifestUrl')
      return Promise.resolve(null)
    }
    let params = {
      TableName: this.apiTokensTableName,
      Key: { manifestUrl: pluginManifestUrl, userID: userID }
    }
    return this.ddb.delete(params).catch(err => {
      // more detail to the error
      throw new Error(`deleteApiToken error: ${err}`)
    })
  }

  deleteAllApiTokens () {
    return this.ddb.scan({
      TableName: this.apiTokensTableName,
      ProjectionExpression: ALL_PLUGIN_API_AUTH_PROPS.join(', ')
    }).then(result => {
      const tokenRecords = result.Items
      let promises = tokenRecords.map(t => this.deleteApiToken(t.manifestUrl, t.userID))
      return Promise.all(promises)
    })
  }
}

module.exports = DB
