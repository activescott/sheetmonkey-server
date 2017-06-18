'use strict';
const BbPromise = require('bluebird');
const fs = require('fs');
const path = require('path');
const Handler = require('./handler');
const Mustache = require('mustache');
const TokenHandler = require('./tokenHandler');
const Diag = require('../diag');

const D = new Diag('StaticFileHandler');

BbPromise.promisifyAll(fs);

class StaticFileHandler extends Handler {
  /**
   * 
   * @param {*string} clientFilesPath The fully qualified path to the client files that this module should serve.
   */
  constructor(clientFilesPath) {
    super();
    if (clientFilesPath == null || clientFilesPath.length == 0) {
      throw new Error('clientFilesPath must be specified');
    }
    this.clientFilesPath = clientFilesPath;
  }

  get(event, context) {
    return new BbPromise((resolve, reject) => {
      D.log('event:',event);
      if (!event) {
        return reject(new Error('event object not specified.'));
      }
      if (!event.path) {
        return reject(new Error('Empty path.'));
      }
      // NOTE: We're not enforcing/validate a prefix path for content on the public endpoint here. Instead the serverless.yml is entirely responsible for only routing requests here that should be valid content.
      /*
      const prefix = '/client';
      if (! (event.path && event.path.startsWith(prefix))) {
        return reject(new Error('Not a client path.'));
      }
      */
      const prefix = '';
      let postfix = event.path.substring(prefix.length); 
      let basePath = this.clientFilesPath;
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
        D.error('unable to read client file. err:', err);
        throw err;
      });
    });
  }
}

module.exports = StaticFileHandler;
