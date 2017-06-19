'use strict';
const fs = require('fs');
const path = require('path');
const Handler = require('./Handler');
const jwt = require('jwt-simple');
const Diag = require('../diag');
const BbPromise = require('bluebird');

const D = new Diag('JwtHandler');

class JwtHandler extends Handler {
  static newToken() {
    const pemPath = path.join(__dirname, '../../data/private/test-key-private.pem');
    const crtPath = path.join(__dirname, '../../data/private/test-key.crt');
    const pem = fs.readFileSync(pemPath).toString('ascii');
    const crt = fs.readFileSync(crtPath).toString('ascii');
    const alg = 'RS256';
    
    // JWT NumericDate = number of seconds from 1970-01-01T00:00:00Z UTC
    const nowSeconds = Date.now() / 1000;
    const expireSeconds = nowSeconds + (15*60);

    const payload = {
      foo: 'bar',
      iat: nowSeconds,
      exp: expireSeconds
    };
    D.log('encoding jwt... with key:"', pem, '".');
    const token = jwt.encode(payload, pem, alg);
    D.log('encoding jwt complete.');
    return token;
  }

  get(event, context) {
    return new Promise((resolve, reject) => {
      const response = {
        statusCode: 200,
        body: JSON.stringify({
          token: JwtHandler.newToken(),
        }),
      };
      resolve(response);
    });
  }
}

module.exports = JwtHandler;
