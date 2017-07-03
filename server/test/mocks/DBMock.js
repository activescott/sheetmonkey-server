'use strict'
const Promise = require('bluebird')

class DBMock {
  constructor () {
    this._users = []
  }

  get users () { return this._users }

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

  listUsers (id) {
    return Promise.try(() => {
      return this.users
    })
  }
}

module.exports = DBMock
