'use strict';
const Promise = require('bluebird');
const assert = require('assert');
const Diag = require('./diag');

const D = new Diag('DB');

const REQUIRED_USER_INPUT_PROPS = ['id', 'email'];
const ALL_USER_PROPS = ['id', 'email', 'createdAt', 'updatedAt', 'access_token', 'expires_at', 'refresh_token'];

class DB {
  constructor(ddb, usersTableName) {
    assert(ddb, 'ddb arg required');
    assert(usersTableName, 'usersTableName arg required');
    this.ddb = ddb;
    this.usersTableName = usersTableName;
  }

  addUser(user) {
    return Promise.try(() => {
      REQUIRED_USER_INPUT_PROPS.forEach(attr => assert(attr in user && user[attr], `user missing required property ${attr}`));

      return this.getUser(user.id).then(existingUser => {
        const now = String(Date.now());
        if (!existingUser) {
          D.log(`adding new user with id "${user.id}"`);
          user.createdAt = now;
        } else {
          D.log(`attempting to add existing user with id ${user.id}. User will be updated.`);
        }

        user.updatedAt = now;

        let putItem = this.ddb.put({
          TableName: this.usersTableName,
          Item: user
        });

        return putItem.then(() => user);
      });
    });
  }

  listUsers() {
    return this.ddb.scan({
      TableName: this.usersTableName,
      ProjectionExpression: ALL_USER_PROPS.join(', ')
    }).then(result => result.Items);
  }

  /**
   * Returns the user or null.
   */
  getUser(id) {
    // our schema requires a number.
    if (!id || typeof id != 'number') {
      D.log('getUser: invalid id, indicating user not found');
      return Promise.resolve(null);
    }
    let params = {
      TableName: this.usersTableName,
      Key: { id: id },
      ProjectionExpression: ALL_USER_PROPS.join(', '),
      ConsistentRead: true
    };
    return this.ddb.get(params).then(result => {
      if (result && result.Item)
        return result.Item;
      else
        D.log(`getUser: user with id ${id} not found. Result:`, result);
      return null;
    }).catch(err => {
      //more detail to the error
      throw new Error(`getUser error: ${err}`);
    });
  }
}

module.exports = DB;