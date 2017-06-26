'use strict';
const Promise = require('bluebird');
const assert = require('assert');

const REQUIRED_USER_INPUT_PROPS = ['id', 'email'];
const ALL_USER_PROPS = ['id', 'email', 'createdAt', 'updatedAt', 'access_token', 'expires_at', 'refresh_token'];

class DB {
  constructor(ddb, usersTableName) {
    assert(ddb, 'ddb arg required');
    this.ddb = ddb;
    this.usersTableName = usersTableName;
  }

  addUser(user) {
    return Promise.try(() => {
      console.log('saving user: ', user);
      REQUIRED_USER_INPUT_PROPS.forEach(attr => assert(attr in user, `user missing required attribute ${attr}`));

      user.createdAt = String(Date.now());
      user.updatedAt = String(Date.now());

      let putItem = this.ddb.put({
        TableName: this.usersTableName,
        Item: user
      });

      return putItem.then(() => user);
    });
  }

  listUsers() {
    return this.ddb.scan({
      TableName: this.usersTableName,
      ProjectionExpression: ALL_USER_PROPS.join(', ')
    }).then(result => result.Items);
  }
}

module.exports = DB;