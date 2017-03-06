'use strict';
const BbPromise = require('bluebird');
const fs = require('fs');
const path = require('path');
const Handler = require('./handler');
const Mustache = require('mustache');
const TokenHandler = require('./tokenHandler');
const Diag = require('../diag');

const D = new Diag('ClientHandler');

BbPromise.promisifyAll(fs);

class ClientHandler extends Handler {
  get(event, context) {
    return new BbPromise((resolve, reject) => {
      D.log('event:',event);
      if (!event) {
        return reject(new Error('event object not specified.'));
      }
      const prefix = '/client';
      if (!event.path) {
        return reject(new Error('Empty path.'));
      }
      if (! (event.path && event.path.startsWith(prefix))) {
        return reject(new Error('Not a client path.'));
      }
      let postfix = event.path.substring(prefix.length); 
      let basePath = path.join(__dirname, '../../data/public/'); 
      let filePath = path.join(basePath, postfix);

      return fs.readFileAsync(filePath).then(stream => {
        let file = stream.toString('utf8');
        const viewData = { jwt: TokenHandler.newToken() };
        file = Mustache.render(file, viewData);

        let response = {
          statusCode: 200,
          headers: {
            "Content-Type": "text/html"
          },
          body: file
        };
        return resolve(response);
      })
      .catch(err => {
        console.error('unable to read client file. err:', err);
        throw err;
      });
    });
  }
}

module.exports = ClientHandler;
