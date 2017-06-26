'use strict';
const fs = require('fs');
const path = require('path');
const Handler = require('./Handler');
const jwt = require('jwt-simple');
const Diag = require('../diag');
const Promise = require('bluebird');

const D = new Diag('JwtHandler');

class JwtHandler extends Handler {
  static get pem() {
    const pemPath = path.join(__dirname, '../../data/private/test-key-private.pem');
    return fs.readFileSync(pemPath).toString('ascii');
  }
  static get crt() {
    const crtPath = path.join(__dirname, '../../data/private/test-key.crt');
    return fs.readFileSync(crtPath).toString('ascii');
  }
  static get alg() {
    return 'RS256';
  }

  /**
   * Issues a new signed JWT.
   * @param {*Number} userID (optional) The ID of the user/principal to save in the jwt
   * @param {*Number} expiresInSeconds (optional) The number of seconds before the token will expire.
   */
  static newToken(userID, expiresInSeconds) {
    // JWT NumericDate = number of seconds from 1970-01-01T00:00:00Z UTC
    const nowSeconds = Date.now() / 1000;
    const MINUTES = 60;
    const DAYS = MINUTES*60*24;
    if (!expiresInSeconds) {
      expiresInSeconds = nowSeconds + (15*MINUTES);
    }
    const payload = {
      iat: nowSeconds,
      exp: expiresInSeconds
    };
    if (userID) {
      payload.prn = userID;// prn == principal - https://openid.net/specs/draft-jones-json-web-token-07.html#anchor4
    }
    const token = jwt.encode(payload, JwtHandler.pem, JwtHandler.alg);
    return token;
  }

  /**
   * Returns true if the specified jwt is signed with our key. 
   */
  static isValidJwtSignature(token) {
    try {
      let decoded = jwt.decode(token, JwtHandler.crt);
      return true;
    } catch (e) {
      return false;
    }
  }

  get(event, context) {
    return Promise.try(() => {
      const response = {
        statusCode: 200,
        body: JSON.stringify({
          token: JwtHandler.newToken(),
        }),
      };
      return response;
    });
  }
}

module.exports = JwtHandler;
