'use strict'
import Promise from 'bluebird'
import Xhr from './Xhr.js'

class Backend {
  static build (options) {
    const isDevEnvironment = document.location.protocol === 'file:' || document.hostname === 'localhost'
    console.log('isDevEnvironment:', isDevEnvironment)
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
}

class BackendMock {
  constructor (options) {
    this._ping = { message: 'boo' }
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
    return Promise.try(() => this._ping)
  }
}

export default Backend
