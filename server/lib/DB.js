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
      REQUIRED_USER_INPUT_PROPS.forEach(attr => assert(attr in user, `user missing required attribute ${attr}`));

      return this.getUser(user.id).then(existingUser => {
        // put will update an existing user. Only set createdAt if he doesn't exist.
        if (!existingUser) {
          user.createdAt = String(Date.now());
        }

        user.updatedAt = String(Date.now());

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
    return this.ddb.query({
      TableName: this.usersTableName,
      KeyConditionExpression: 'id = :id',
      ProjectionExpression: ALL_USER_PROPS.join(', '),
      ExpressionAttributeValues: {
        ':id': id
      }
    }).then(result => {
      if (!result.Items || result.Items.length <= 0)
        return null;
      return result.Items[0];
    });
  }
}

module.exports = DB;