'use strict';
const Promise = require('bluebird');

class DBMock {
  constructor() {
    this._users = [];
  }

  get users() { return this._users; }

  addUser(user) {
    return Promise.try(() => {
      if (this.users.find(elem => elem.id === user.id )) {
        console.log('\n\nuser exists:', user.id);
        return null; // user exists
       }
      
      this.users.push(user);
      return user;
    });
  }

  updateUser(user) {
    return Promise.try(() => {
      let idx = this.users.findIndex(elem => elem.id === user.id);
      this.users[idx] = user;
      return user;
    });
  }
}

module.exports = DBMock;