'use strict'
const Handler = require('./Handler')
const Diag = require('../diag')
const Promise = require('bluebird')
const assert = require('assert')

const path = require('path')
const D = new Diag(path.parse(__filename).name)

class UsersHandler extends Handler {
  constructor (db) {
    super()
    assert(db, 'db required')
    this.db = db
  }

  get (event, context) {
    return Promise.try(() => {
      if (event.pathParameters && 'id' in event.pathParameters) {
        return this.getUserResponseFromId(event.pathParameters.id)
      } else {
        return this.listUsers(event, context)
      }
    })
  }

  listUsers (event, context) {
    return this.db.listUsers().then(users => {
      let publicUsers = []
      for (let u of users) {
        publicUsers.push(UsersHandler.sanitizeUserProps(u))
      }
      return this.responseAsJson(publicUsers)
    })
  }

  post (event, context) {
    return Promise.try(() => {
      const data = JSON.parse(event.body)
      if (typeof data.id !== 'string' ||
          typeof data.email !== 'string') {
        throw new Error('Missing required fields to create user')
      }

      return this.db.addUser(data).then(user => {
        return this.responseAsJson(user)
      })
    })
  }

  put (event, context) {
    return Promise.try(() => {
    })
  }

  static sanitizeUserProps (user) {
    const ret = Object.assign({}, user)
    const filterProperties = ['refresh_token', 'access_token', 'expires_at']
    for (let p of filterProperties) {
      delete ret[p]
    }
    return ret
  }

  getPublicUserFromID (id) {
    return this.db.getUser(id).then(user => {
      return UsersHandler.sanitizeUserProps(user)
    })
  }

  me (event, context) {
    return this.getRequestPrincipal(event, context).then(principalID => {
      return this.getPublicUserFromID(principalID).then(user => this.responseAsJson(user))
    })
  }
}

module.exports = UsersHandler
