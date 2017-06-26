'use strict';
const Handler = require('./Handler');
const Diag = require('../diag');
const Promise = require('bluebird');
const assert = require('assert');

const D = new Diag('UsersHandler');

class UsersHandler extends Handler {
  constructor(db) {
    super();
    assert(db, 'db required');
    this.db = db;
  }

  get(event, context) {
    return Promise.try(() => {
      if (event.pathParameters && 'id' in event.pathParameters) {
        // get an individual user
        throw 'TODO';
      } else {
        // list users
      }
    });
  }

  post(event, context) {
    return Promise.try(() => {
      const timestamp = new Date().getTime();
      
      const data = JSON.parse(event.body);
      if (typeof data.id !== 'string' 
          || typeof data.email !== 'string') {
        throw new Error('Missing required fields to create user');
      }

      return this.db.addUser(data).then(user => {
        return this.responseAsJson(user);
      });
    });
  }

  put(event, context) {
    return Promise.try(() => {
    });
  }
}

module.exports = UsersHandler;
