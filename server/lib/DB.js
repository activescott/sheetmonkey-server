'use strict';
const uuid = require('uuid');


class DB {
  constructor(ddb) {
    this.ddb = ddb;
  }

  addUser(userObj) {
    userObj.id = uuid.v1();

    user.createdAt = String(Date.now());
    user.updatedAt = String(Date.now());

    let putItem = ddb.put({
      TableName: usersTable,
      Item: userObj
    });

    return putItem.then(() => userObj);
  }
}

module.exports = DB;