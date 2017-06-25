'use strict';
const Promise = require('bluebird');
const Diag = require('./diag');
const crypto = require('crypto');
const path = require('path');
const assert = require('assert');

const request = require('request');
const post = (options) => {
  return Promise.fromCallback(cb => request.post(options, cb), { multiArgs:true });
};

const D = new Diag('SmartsheetApi');

class SmartsheetApi {
  constructor() {
  }

  /**
   * Exchanges the specified code for the access/refresh token and expires values. Returned object looks like:
   *  {
   *   "access_token":"xxxxx",
   *   "token_type":"bearer",
   *   "refresh_token":"xxxx",
   *   "expires_in":604799
   *  }
   * 
   * Only one of code or refreshToken should be specified!
   * @param {*string} code The authorization code from the OAuth redirect.
   * @param {*string} refreshToken The refreshToken to use to refresh a token.
   */
  getToken(code, refreshToken) {
    assert('SS_CLIENT_ID' in process.env, 'missing environment variable: SS_CLIENT_ID');
    assert('SS_CLIENT_SECRET' in process.env, 'missing environment variable: SS_CLIENT_SECRET');
    const hashInput = `${process.env.SS_CLIENT_SECRET}|${code}`;
    const hasher = crypto.createHash('sha256');
    hasher.update(hashInput);
    const hash = hasher.digest('hex');

    D.log('hashInput:', hashInput);
    const formData = {
      'grant_type': 'authorization_code',
      'client_id': process.env.SS_CLIENT_ID,
      'code': code,
      'hash': hash
    };
    D.log('formData:', formData);
    const options = {
        url:'https://api.smartsheet.com/2.0/token',
        form: formData // <- Note that request will translate `form` to application/x-www-form-urlencoded data
    };
    return post(options)
      .spread((httpResponse, body) => {
        D.log('SS Token response:', httpResponse.statusCode, '; body:', body);
        if (httpResponse.statusCode != 200) {
          throw new Error(`Smartsheet returned an error. Status code: ${httpResponse.statusCode}. Status message: ${httpResponse.statusMessage}. Body:${body}`);
        }
        D.log('token body:', body);
        return body;
      });
  }
}

module.exports = SmartsheetApi;