'use strict';
const Promise = require('bluebird');
const uuid = require('uuid');

class SmartsheetApiMock {
  constructor() {
  }

  refreshToken(code, refreshToken) {
    return Promise.resolve({
      access_token: "aaa",
      token_type: "bearer",
      refresh_token: "bbb",
      expires_in: 604799
    });
  }
  me() {
    const id = uuid.v1();
    return Promise.resolve({
      id: id,
      email: `${id}@SmartsheetApiMock.com` 
    });
  }
}

module.exports = SmartsheetApiMock;