'use strict';
const BbPromise = require('bluebird');
const fs = require('fs');
const path = require('path');
const Handler = require('./Handler');
const Mustache = require('mustache');
const JwtHandler = require('./JwtHandler');
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

  static getMimeType(filePath) {
    const typeMap = {
          'html': 'text/html',
          'css': 'text/css',
          'js': 'application/javascript',
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'gif': 'image/gif',
          'json': 'application/json',
          'xml': 'application/xml',
          'zip': 'application/zip',
          'pdf': 'application/pdf',
          'mp4': 'audio/mpeg',
          'm4a': 'audio/mpeg',
          'ico': 'image/x-icon'
        };
    let parts = filePath.split('.');
    var mimeType = '';
    if (parts.length > 0) {
      let extension = parts[parts.length-1];
      if (typeMap.hasOwnProperty(extension))
        mimeType = typeMap[extension];
    }
    return mimeType;
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
      let mimeType = StaticFileHandler.getMimeType(filePath);
      if (!mimeType) {
        let msg = 'Unrecognized MIME type for file ' + filePath;
        D.error(msg);
        reject(new Error(msg));
      }
      return fs.readFileAsync(filePath).then(stream => {
        let file = stream.toString('utf8');
        const viewData = { csrftoken: JwtHandler.newToken() };
        file = Mustache.render(file, viewData);
        
        let response = {
          statusCode: 200,
          headers: {
            "Content-Type": mimeType,
          },
          body: file
        };
        return resolve(response);
      })
      .catch(err => {
        D.error('unable to read client file. err:', err);
        reject(err);
      });
    });
  }
}

module.exports = StaticFileHandler;
