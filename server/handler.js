'use strict';
const fs = require('fs');
const vandiumInst = require('vandium').createInstance();
const StaticFileHandler = require('./lib/handlers/staticFileHandler');
const TokenHandler = require('./lib/handlers/tokenHandler');

const crt = fs.readFileSync(__dirname + '/data/private/test-key.crt').toString('ascii');

vandiumInst.configure({
  jwt: {
    lambdaProxy: true,
    algorithm: 'RS256',
    public_key: crt
  },
  stripErrors: true, //setting this to false just keeps stack trace out of the logs. Doesn't send them back in payload either way.
  lambdaProxy: true
});

const vandium = (userFunc) => {
  let handler = vandiumInst.handler(userFunc);
  return handler;
}

module.exports.echo = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: {
      message: 'Echo function. Event and context follows.',
      event: event,
      context: context
    },
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

module.exports.jwt = (event, context, callback) => {
  return new TokenHandler().get(event, context)
    .then(result => callback(null, result))
    .catch(err => callback(err));
}

module.exports.staticfile = (event, context, callback) => {
  return new StaticFileHandler().get(event, context)
    .then(result => callback(null, result))
    .catch(err => callback(err));
};

