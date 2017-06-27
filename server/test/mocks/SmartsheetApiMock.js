'use strict';
const Promise = require('bluebird');
const randomUserID = require('../support/tools').randomUserID;

class SmartsheetApiMock {
  constructor() {
  }

  refreshToken(code, refreshToken) {
    return Promise.resolve({
      access_token: "aaa",
      token_type: "bearer",
      refresh_token: "bbb",
      expires_at: "2019-06-26T04:14:57.567Z"
    });
  }
  me() {
    const id = randomUserID();
    return Promise.resolve({
      id: id,
      email: `${id}@SmartsheetApiMock.com` 
    });
  }
}

module.exports = SmartsheetApiMock;