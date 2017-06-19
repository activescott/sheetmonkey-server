'use strict';
const BbPromise = require('bluebird');
const Handler = require('./Handler');
const Diag = require('../diag');

const D = new Diag('OAuthClientHandler');

class OAuthClientHandler extends Handler {
  //TODO: catch the OAuth Token and store it to DDB
}