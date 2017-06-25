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
  constructor(smartsheetApi) {
    super();
    assert(smartsheetApi, 'smartsheetApi required');
    this.smartsheetApi = smartsheetApi;
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
      D.log('OAuth redirect params:', params);

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
      return this.smartsheetApi.getToken(params.code, null).then(tokens => {
        // save access token, expire time, and refresh token to DDB (note, we may already have a token for this user)

        // TODO: Get the user_id and put it in a jwt that will go in the cookie

        // TODO: write cookie to authenticate user with cookie from here on out.
        
        // Now redirect to index??
        const response = {
          statusCode: 200,
          headers: {
            Location: 'index.html',
          },
          body: `Success! Tokens: ${JSON.stringify(tokens)}`
        };
        return response;
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