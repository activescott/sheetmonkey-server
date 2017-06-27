'use strict';
const path = require('path');
const Handler = require('./Handler');
const Diag = require('../diag');
const JwtHandler = require('./JwtHandler');
const StaticFileHandler = require('./StaticFileHandler');
const crypto = require('crypto');
const request = require('request');
const Promise = require('bluebird');
const assert = require('assert');

const D = new Diag('OAuthClientHandler');

class OAuthClientHandler extends Handler {
  constructor(smartsheetApi, db) {
    super();
    assert(smartsheetApi, 'smartsheetApi required');
    this.smartsheetApi = smartsheetApi;
    assert(db, 'db arg required');
    this.db = db;
  }
  /**
   * Handles the OAuth redirect with the Authorization Code ala http://smartsheet-platform.github.io/api-docs/#obtaining-the-authorization-code
   * @param {*} event 
   * @param {*} context 
   */
  handleOAuthRedirect(event, context) {
    return Promise.try(() => {
      // extract paramters code, expires_in, state, and error:
      let params = event.queryStringParameters || {};

      if (!('state' in params)) {
        return OAuthClientHandler.writeError('Login failed: no state.');
      }
      if (!JwtHandler.isValidJwtSignature(params.state)) {
        return OAuthClientHandler.writeError('Login failed: invalid state.');
      }
      if ('error' in params) {
        return OAuthClientHandler.writeError('Login failed:' + params.error);
      }
      if (!('code' in params)) {
        return OAuthClientHandler.writeError('Login failed: No code provided.');
      }

      // exchange code for token: http://smartsheet-platform.github.io/api-docs/#obtaining-an-access-token
      //TODO: refactor the SS API calls out into their its own API class to support mocking.
      return this.smartsheetApi.refreshToken(params.code, null).then(tokens => {
        D.log('tokens:', tokens);
        return this.smartsheetApi.me().then(ssUser => {
          // save access token, expire time, and refresh token to DB:
          const userObj = {};
          // copy over token and user properties we want:
          const tokenProps = ['access_token', 'refresh_token', 'expires_at'];
          const userProps = ['id', 'email'];         
          tokenProps.forEach(p => {
            userObj[p] = tokens[p];
          });
          userProps.forEach(p => {
            userObj[p] = ssUser[p];
          });

          return this.db.addUser(userObj).then(addedUser => {
            D.log('User saved:', addedUser);
            // write cookie to authenticate user with cookie from here on out.
            const MINUTES = 60;
            const DAYS = MINUTES*60*24;
            const expiresInSeconds = 10*MINUTES;
            const cookieJwt = JwtHandler.newToken(addedUser.id, expiresInSeconds);
            const cookieExpiresStr = new Date(Date.now() + expiresInSeconds*1000).toUTCString();
            // Now redirect to index??
            const response = {
              statusCode: 200,
              headers: {
                'Set-Cookie': `jwt=${cookieJwt}; Path=/; Expires=${cookieExpiresStr}`,
                'Content-Type': 'text/html',
                'Refresh': '3; url=/index.html', // <- https://en.wikipedia.org/wiki/URL_redirection#Refresh_Meta_tag_and_HTTP_refresh_header
              },
              body: `<p>Login succeeded! Redirecting to <a href="index.html">Home</a>...</p>`
            };
            return response;
          });
        });
      }).catch(err => {
        return OAuthClientHandler.writeError(`Login failed: Error getting token: ${err}`);
      });
    });
  }

  /**
   * Returns a Promise with a response that is an HTML page with the specified error text on it.
   * @param {*string} errorText The error to add to the page.
   */
  static writeError(errorText) {
    return Promise.try( () => {
      const clientFilesPath = path.join(__dirname, '../../data/public/');
      let filePath = path.join(clientFilesPath, 'error.html');
      const viewData = {
        errorText: errorText
      };
      return StaticFileHandler.readFileAsResponse(filePath, viewData);
    }).catch(err => {
      throw err;
    });
  }
}

module.exports = OAuthClientHandler;