'use strict';
const jwt = require('jwt-simple');
const fs = require('fs');
const vandiumInst = require('vandium').createInstance();
const crt = fs.readFileSync(__dirname + '/test-key.crt').toString('ascii');

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
  let handler = vandiumInst.handler( userFunc );
  return handler;
}

module.exports.hello = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};

function log() {
  //console.log(...args); //the spread arg seems to cause syntax errors in lambda. They use an old version of node: http://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html & http://node.green/
  //console.log.apply(null, arguments);
}

module.exports.echo = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: {
      message: 'Echo function. Event and context below',
      event: event,
      context: context
    },
  };

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};

module.exports.boo = vandium( (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  callback(null, response);
});

module.exports.getjwt = (event, context, callback) => {
  
  const pem = fs.readFileSync(__dirname + '/test-key-private.pem').toString('ascii');
  const crt = fs.readFileSync(__dirname + '/test-key.crt').toString('ascii');
  const alg = 'RS256';
  
  // JWT NumericDate = number of seconds from 1970-01-01T00:00:00Z UTC
  const nowSeconds = Date.now() / 1000;
  const expireSeconds = nowSeconds + (15*60);

  const payload = {
    foo: 'bar',
    iat: nowSeconds,
    exp: expireSeconds
  };
  log('encoding token... with key:"', pem, '".');
  const token = jwt.encode(payload, pem, alg);
  log('encoding token complete.');
  
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      jwt_token: token,
    }),
  };

  callback(null, response);
};