'use strict'
const Promise = require('bluebird')
const assert = require('assert')

class DBMock {
  constructor () {
    this._users = []
    this._plugins = []
  }

  get users () { return this._users }
  get plugins () { return this._plugins }

  addUser (user) {
    return Promise.try(() => {
      if (this.users.find(elem => elem.id === user.id)) {
        console.log('\n\nDBMock user exists:', user.id)
        return null // user exists
      }
      this.users.push(user)
      return user
    })
  }

  updateUser (user) {
    return Promise.try(() => {
      let idx = this.users.findIndex(elem => elem.id === user.id)
      this.users[idx] = user
      return user
    })
  }

  getUser (id) {
    return Promise.try(() => {
      let idx = this.users.findIndex(elem => elem.id === id)
      return this.users[idx]
    })
  }

  listUsers () {
    return Promise.try(() => {
      return this.users
    })
  }

  addPlugin (plugin) {
    return Promise.try(() => {
      if (this.plugins.find(elem => elem.manifestUrl === plugin.manifestUrl)) {
        console.log('\n\nDBMock plugin exists:', plugin.manifestUrl)
        return null // plugin exists
      }
      this.plugins.push(plugin)
      return plugin
    })
  }

  updatePlugin (plugin, callerID) {
    return Promise.try(() => {
      let idx = this.plugins.findIndex(elem => elem.manifestUrl === plugin.manifestUrl)
      // console.log('found plugin:', this.plugins[idx])
      assert(callerID === this.plugins[idx].ownerID, 'DBMock: Unauthorized; caller must be owner of plugin!')
      this.plugins[idx] = plugin
      return plugin
    })
  }

  getPlugin (manifestUrl) {
    return Promise.try(() => {
      let idx = this.plugins.findIndex(elem => elem.manifestUrl === manifestUrl)
      return this.plugins[idx]
    })
  }

  listPlugins () {
    return Promise.try(() => {
      return this.plugins
    })
  }

  deletePlugin (manifestUrl) {
    return Promise.try(() => {
      let index = this.plugins.findIndex(elem => elem.manifestUrl === manifestUrl)
      if (index >= 0)
        this.plugins.splice(index, 1)
    })
  }
}

module.exports = DBMock
