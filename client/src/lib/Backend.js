'use strict'
import Promise from 'bluebird'
import Xhr from './Xhr.js'

class Backend {
  static build (options) {
    const isDevEnvironment = document.location.protocol === 'file:' || document.location.hostname === 'localhost'
    if (isDevEnvironment) {
      return new BackendMock(options)
    } else {
      return new BackendImpl(options)
    }
  }
}

class BackendImpl {
  constructor () {
    this.xhr = new Xhr()
  }
  me () {
    return this.xhr.getJSON('api/users/me').then(response => {
      console.log('api/users/me response:', response)
      return response
    })
  }

  ping () {
    return this.xhr.getJSON('api/ping').then(response => {
      console.log('api/ping response:', response)
      return response
    })
  }

  getUserPlugins (userID) {
    let url = `api/users/${userID}/plugins`
    return this.xhr.getJSON(url).then(response => {
      console.log(`${url} response:`, response)
      return response
    })
  }

  deleteUserPlugin (manifestUrl, userID) {
    let url = `api/users/${userID}/plugins/${encodeURIComponent(manifestUrl)}`
    return this.xhr.deleteJSON(url, {}).then(response => {
      console.log(`${url} response:`, response)
      return response
    })
  }

  addUserPlugin (plugin, userID) {
    let url = `api/users/${userID}/plugins`
    plugin = Object.assign({}, plugin, {ownerID: userID})
    return this.xhr.postJSON(url, {}, plugin).then(response => {
      console.log(`${url} response:`, response)
      return response
    })
  }
}

class BackendMock {
  constructor (options) {
    this._me = {
      id: 123456,
      email: 'john@doe.com'
    }

    if (options && options.me) {
      this._me = options.me
    }
    if (options && options.ping) {
      this._ping = options.ping
    }
  }

  me () {
    return Promise.try(() => this._me)
  }

  ping () {
    return Promise.try(() => {
      if (this._ping) return this._ping
      return { message: 'boo ' + new Date() }
    })
  }

  getUserPlugins (userID) {
    return Promise.try(() => [
      { manifestUrl: `https://m${userID}.com/manifest1.json` },
      { manifestUrl: `https://m${userID}.com/manifest2.json` }
    ])
  }

  updateUserPlugin (plugin, userID) {
    return Promise.try(() => {
    })
  }

  addUserPlugin (plugin) {
    return Promise.try(() => plugin)
  }

  deleteUserPlugin (manifestUrl, userID) {
    return Promise.try(() => {})
  }
}

export default Backend
