'use strict';
const Promise = require('bluebird');

class DBMock {
  constructor() {
    this._users = [];
  }

  get users() { return this._users; }

  addUser(user) {
    this.users.push(user);
    return Promise.resolve(user);
  }
}

module.exports = DBMock;