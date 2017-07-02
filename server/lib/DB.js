'use strict';
const Promise = require('bluebird');
const assert = require('assert');
const Diag = require('./diag');

const D = new Diag('DB');

const ALL_USER_PROPS = ['id', 'email', 'createdAt', 'updatedAt', 'access_token', 'expires_at', 'refresh_token'];
const REQUIRED_USER_ADD_PROPS = ['id', 'email'];
const REQUIRED_USER_UPDATE_PROPS = ['id', 'email', 'access_token', 'expires_at', 'refresh_token'];


class DB {
  constructor(ddb, usersTableName) {
    assert(ddb, 'ddb arg required');
    assert(usersTableName, 'usersTableName arg required');
    this.ddb = ddb;
    this.usersTableName = usersTableName;
  }

  addUser(user) {
    user = Object.assign({}, user); //don't modify the input user obj
    return Promise.try(() => {
      REQUIRED_USER_ADD_PROPS.forEach(attr => assert(attr in user && user[attr], `user missing required property ${attr}`));
      const now = String(Date.now())

      if ('access_token' in user) {
        assert('expires_at' in user, 'when providing access_token expires_at must also be provided');
      }
      
      user.createdAt = now;
      user.updatedAt = now;
      
      let putItem = this.ddb.put({
        TableName: this.usersTableName,
        Item: user,
        ConditionExpression: 'attribute_not_exists(id)' // <- ensure user isn't overwritten if exists
      })
      return putItem.then(() => user);
    }).catch(err => {
      //if user exists, just return null; if another error, rethrow
      if (err.name && err.name === 'ConditionalCheckFailedException') {
        return null;
      }
      throw err;
    })

  }

  updateUser(user) {
    return Promise.try(() => {
      REQUIRED_USER_UPDATE_PROPS.forEach(attr => assert(attr in user && user[attr], `user missing required property ${attr}`));
      const now = String(Date.now())

      return this.ddb.update({
        TableName: this.usersTableName,
        Key: { id: user.id },
        UpdateExpression: 'SET email = :email, access_token = :access_token, expires_at = :expires_at, refresh_token = :refresh_token, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':email': user.email,
          ':access_token': user.access_token,
          ':expires_at': user.expires_at,
          ':refresh_token': user.refresh_token,
          ':updatedAt': now
        },
        ReturnValues: 'ALL_NEW'
      }).then(result => {
        return result.Attributes;
      })
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
