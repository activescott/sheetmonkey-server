'use strict'
const Promise = require('bluebird')
const fs = require('fs')
const path = require('path')
const Handler = require('./Handler')
const Mustache = require('mustache')
const JwtHandler = require('./JwtHandler')
const Diag = require('../diag')

const D = new Diag('StaticFileHandler')

Promise.promisifyAll(fs)

class StaticFileHandler extends Handler {
  /**
   *
   * @param {*string} clientFilesPath The fully qualified path to the client files that this module should serve.
   */
  constructor (clientFilesPath) {
    super()
    if (clientFilesPath == null || clientFilesPath.length == 0) {
      throw new Error('clientFilesPath must be specified')
    }
    this.clientFilesPath = clientFilesPath
  }

  static getMimeType (filePath) {
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
    }
    let parts = filePath.split('.')
    var mimeType = ''
    if (parts.length > 0) {
      let extension = parts[parts.length - 1]
      if (typeMap.hasOwnProperty(extension)) {
        mimeType = typeMap[extension]
      } else {
        mimeType = 'application/octet-stream' // https://stackoverflow.com/questions/20508788/do-i-need-content-type-application-octet-stream-for-file-download#20509354
      }
    }
    return mimeType
  }
  get (event, context, callback) {
    return Promise.try(() => {
      if (!event) {
        throw new Error('event object not specified.')
      }
      if (!event.path) {
        throw new Error('Empty path.')
      }
      // NOTE: We're not enforcing/validate a prefix path for content on the public endpoint here. Instead the serverless.yml is entirely responsible for only routing requests here that should be valid content.
      /*
      const prefix = '/client';
      if (! (event.path && event.path.startsWith(prefix))) {
        return reject(new Error('Not a client path.'));
      }
      */
      const prefix = ''
      let postfix = event.path.substring(prefix.length)
      let basePath = this.clientFilesPath
      let filePath = path.join(basePath, postfix)
      return StaticFileHandler.readFileAsResponse(filePath, {}, event, context).then(response => {
        return response
      }).catch(err => {
        throw new Error(`Unable to read client file '${postfix}'. Error: ${err}`)
      })
    })
  }

  /**
   * Loads the specified file's content and returns a response that can be called back to lambda for sending the file as the http response.
   */
  static readFileAsResponse (filePath, viewData) {
    return fs.readFileAsync(filePath).then(stream => {
      let mimeType = StaticFileHandler.getMimeType(filePath)
      if (!mimeType) {
        let msg = 'Unrecognized MIME type for file ' + filePath
        D.error(msg)
        throw new Error(msg)
      }
      let file = stream.toString('utf8')
      if (!viewData) {
        viewData = {}
      }
      viewData.csrftoken = JwtHandler.newToken()
      file = Mustache.render(file, viewData)

      let response = {
        statusCode: 200,
        headers: {
          'Content-Type': mimeType
        },
        body: file
      }
      return response
    })
  }
}

module.exports = StaticFileHandler
