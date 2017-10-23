'use strict'
const Promise = require('bluebird')
const randomUserID = require('../support/tools').randomUserID

class SmartsheetApiMock {
  constructor () {
    const id = randomUserID()
    this.setMeValue({
      id: id,
      email: `${id}@SmartsheetApiMock.com`
    })
  }

  refreshToken (code, refreshToken) {
    return Promise.resolve({
      access_token: 'aaa',
      token_type: 'bearer',
      refresh_token: 'bbb',
      expires_at: 1498549175
    })
  }

  me () {
    return Promise.resolve(this._me)
  }

  /**
   * Specifies the value for the next time me() is called.
   */
  setMeValue (me) {
    this._me = me
  }
}

module.exports = SmartsheetApiMock
