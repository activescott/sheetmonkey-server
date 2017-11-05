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

  updateUserPlugin (plugin, userID) {
    let url = `api/users/${userID}/plugins/${encodeURIComponent(plugin.manifestUrl)}`
    plugin = Object.assign({}, plugin, {ownerID: userID})
    return this.xhr.putJSON(url, {}, plugin).then(response => {
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

  getPublicPlugins () {
    let url = `https://beta.sheetmonkey.com/api/plugins`
    return this.xhr.getJSON(url).then(response => {
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
    return Promise.delay(75).then(() => [
      { manifestUrl: `https://m${userID}.com/manifest1.json`, apiClientID: 'abcdefg', apiClientSecret: 'supersecretive', redirectUrl: '/fakeredir/manifest1', requestWhitelist: ['GET /sheets/{sheetID}/rows/{rowid}', 'PUT /sheets/{sheetID}/rows/{rowid}'] },
      { manifestUrl: `https://m${userID}.com/manifest2.json`, apiClientID: 'hijklmnop', apiClientSecret: 'alsosupersecretive', redirectUrl: '/fakeredir/manifest2' }
    ])
  }

  updateUserPlugin (plugin, userID) {
    return Promise.delay(75).then(() => plugin)
  }

  addUserPlugin (plugin) {
    console.log('addUserPlugin (', plugin, ')')
    return Promise.delay(75).then(() => plugin)
  }

  deleteUserPlugin (manifestUrl, userID) {
    return Promise.delay(75).then(() => {})
  }

  getPublicPlugins () {
    return Promise.delay(75).then(() => [
      { manifestUrl: `http://localhost:8100/smartsheetforjira/ssfjmanifest.json` },
      { manifestUrl: `http://localhost:8100/smartsheetforsalesforce/ssfsfmanifest.json` }
    ])
  }
}

export default Backend
