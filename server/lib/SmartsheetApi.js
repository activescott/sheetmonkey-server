'use strict';
const Promise = require('bluebird');
const Diag = require('./diag');
const crypto = require('crypto');
const path = require('path');
const assert = require('assert');

//TODO: probably should break out the http lib into it's own class so that it can be mocked:
const request = require('request');
const http_post = (options) => {
  return Promise.fromCallback(cb => request.post(options, cb), { multiArgs:true });
};
//https://www.npmjs.com/package/request#requestoptions-callback
const http_request = (options) => {
  return Promise.fromCallback(cb => request(options, cb), { multiArgs:true });
};

const D = new Diag('SmartsheetApi');

const BASE_URL = 'https://api.smartsheet.com/2.0';

class SmartsheetApi {
  /**
   * Initializes a new SmartsheetApi instance.
   * @param {*object} tokens (optional) An object with `access_token`, `refresh_token`, and `expires_at` values.
   */
  constructor(tokens) {
    // Caller may not provide tokens (as he'll get them via this.refreshTokens later, so we'll start with some expired tokens to keep the rest of the code happy)
    this._tokens = tokens || SmartsheetApi.createExpiredTokens();
  }

  static createExpiredTokens() {
    return {
      access_token: 'xxx',
      refresh_token: 'xxx',
      expires_at: String(Date.now()-10000)
    };
  }

  /**
   * Exchanges the specified code for the access/refresh token and expires values. Returned object looks like:
   *  {
   *   "access_token":"xxxxx",
   *   "token_type":"bearer",
   *   "refresh_token":"xxxx",
   *   "expires_at":"1498549175394"
   *  }
   * Also sets the current object's tokens value with the returned tokens.
   * 
   * Only one of code or refreshToken should be specified!
   * @param {*string} code The authorization code from the OAuth redirect.
   * @param {*string} refreshToken The refreshToken to use to refresh a token.
   */
  refreshToken(code, refreshToken) {
    assert('SS_CLIENT_ID' in process.env, 'missing environment variable: SS_CLIENT_ID');
    assert('SS_CLIENT_SECRET' in process.env, 'missing environment variable: SS_CLIENT_SECRET');
    assert(code || refreshToken, 'Expected code or refresh token');
    const hashInput = `${process.env.SS_CLIENT_SECRET}|${code || refreshToken}`;
    const hasher = crypto.createHash('sha256');
    hasher.update(hashInput);
    const hash = hasher.digest('hex');
    const formData = {
      'client_id': process.env.SS_CLIENT_ID,
      'hash': hash
    };
    if (code) {
      formData.grant_type = 'authorization_code',
      formData.code = code;
    } else {
      formData.grant_type = 'refresh_token',
      formData.refresh_token = refreshToken;
    }
    D.log('refreshToken.formData:', formData);
    const options = {
        url: BASE_URL + '/token',
        form: formData // <- Note that request.post will translate `form` to application/x-www-form-urlencoded data
    };
    return http_post(options)
      .spread((httpResponse, body) => {
        if (httpResponse.statusCode != 200) {
          throw new Error(`Smartsheet returned an error. Status code: ${httpResponse.statusCode}. Status message: ${httpResponse.statusMessage}. Body:${body}`);
        }
        body = JSON.parse(body);
        let response = {};
        ['access_token', 'token_type', 'refresh_token'].forEach(p => response[p] = body[p]);
        // Note Smartsheet's API returns expires_in which is in seconds. We convert to a Date here:
        response.expires_at = String(Date.now() + body.expires_in * 1000);
        D.log('transformed token response:', response);
        this._tokens = response;
        return response;
      });
  }

  httpGet(path) {
    return Promise.try(() => {


      // TODO: check validity of token and refresh if needed. Also need to raise an event so caller can save the new tokens.


      // https://www.npmjs.com/package/request#requestoptions-callback
      const options = {
        url: BASE_URL + path,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this._tokens.access_token}`
        }
      };
      D.log('sending request: ', options);
      return http_request(options).spread((httpResponse, body) => {
        if (httpResponse.statusCode < 200 || httpResponse.statusCode >= 300)
          throw new Error(`Unexpected statusCode from Smartsheet:${httpResponse.statusCode}. Response body:${httpResponse.body}`);
        return httpResponse;
      });
    });
  }

  /**
   * Gets the current User: http://smartsheet-platform.github.io/api-docs/?shell#get-current-user
   */
  me() {
    return this.httpGet('/users/me').then(httpResponse => {
      let meResponse;
      try {
        meResponse = JSON.parse(httpResponse.body);
      } catch (e) {
        D.log('me: Error parsing JSON response:', httpResponse.body);
        throw new Error('me: Error parsing JSON response');
      }
      return meResponse;
    });
  }
}

module.exports = SmartsheetApi;