'use strict';
const Promise = require('bluebird');

class SmartsheetApiMock {
  constructor() {
  }

  getToken(code, refreshToken) {
    return Promise.resolve({
      access_token: "aaa",
      token_type: "bearer",
      refresh_token: "bbb",
      expires_in: 604799
    });
  }
}

module.exports = SmartsheetApiMock;