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
    throw 'todo: why would we ever list all users?'
  }

  post (event, context) {
    throw 'todo: why could a user create another user? this should only be possible via oauth?'
  }

  put (event, context) {
    throw 'todo: no need for this (since the current user cannot update anything about himself, only via oauth'
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
