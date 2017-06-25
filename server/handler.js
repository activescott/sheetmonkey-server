'use strict';
const fs = require('fs');
const path = require('path');
const vandiumInst = require('vandium').createInstance();
const StaticFileHandler = require('./lib/handlers/StaticFileHandler');
const JwtHandler = require('./lib/handlers/JwtHandler');
const OAuthClientHandler = require('./lib/handlers/OAuthClientHandler');
const SmartsheetApi = require('./lib/SmartsheetApi');

const crt = fs.readFileSync(__dirname + '/data/private/test-key.crt').toString('ascii');

vandiumInst.configure({
  jwt: {
    lambdaProxy: true,
    algorithm: 'RS256',
    public_key: crt
  },
  stripErrors: false, //setting this to false just keeps stack trace out of the logs. Doesn't send them back in payload either way.
  lambdaProxy: true
});

const vandium = (userFunc) => {
  let handler = vandiumInst.handler(userFunc);
  return handler;
}

module.exports.echo = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Echo function. Event and context follows.',
      event: event,
      context: context
    }),
  };

  callback(null, response);
};

module.exports.ping = vandium( (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Pong. If you see this the JWT is valid and unexpired! WOOHOOO!',
      input: event,
    }),
  };

  callback(null, response);
});

module.exports.env = (event, context, callback) => {
  let body = {
    env: process.env
  };
  
  const response = {
    statusCode: 200,
    body: JSON.stringify(body),
  };

  callback(null, response);
}

module.exports.jwt = (event, context, callback) => {
  return new JwtHandler().get(event, context)
    .then(response => callback(null, response))
    .catch(err => callback(err));
}

module.exports.staticfile = (event, context, callback) => {
  const clientFilesPath = path.join(__dirname, './data/public/');
  return new StaticFileHandler(clientFilesPath).get(event, context)
    .then(response => callback(null, response))
    .catch(err => callback(err));
};

module.exports.defaultredirect = (event, context, callback) => {
  const redirect = false;
  if (redirect) {
    const response = {
      statusCode: 302,
      headers: {
        "Location": 'index.html',
      },
      body: ''
    };
    callback(null, response);
  } else {
    event.path = '/index.html';
    return module.exports.staticfile(event, context, callback);
  }
};

module.exports.handleOAuthRedirect = (event, context, callback) => {
  return new OAuthClientHandler(new SmartsheetApi()).handleOAuthRedirect(event, context)
    .then(response => callback(null, response))
    .catch(err => callback(err));
};