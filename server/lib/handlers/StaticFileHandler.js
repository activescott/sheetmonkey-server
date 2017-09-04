'use strict'
const Promise = require('bluebird')
const fs = require('fs')
const path = require('path')
const Handler = require('./Handler')
const Mustache = require('mustache')
const JwtHandler = require('./JwtHandler')
const Diag = require('../diag')
const assert = require('assert')

const D = new Diag('StaticFileHandler')

Promise.promisifyAll(fs)

const typeMap = {
  // see https://www.iana.org/assignments/media-types/media-types.xhtml
  'html': 'text/html',
  'md': 'text/markdown',
  'css': 'text/css',
  'js': 'application/javascript',
  'svg': 'image/svg+xml',
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
  'ico': 'image/x-icon',
  'woff2': 'application/font-woff2; charset=utf-8',
  'woff': 'application/font-woff; charset=utf-8',
  'ttf': 'application/font-sfnt',
  'otf': 'application/font-sfnt'
}
const binaryTypes = [
  typeMap['png'],
  typeMap['jpg'],
  typeMap['jpeg'],
  typeMap['gif'],
  typeMap['zip'],
  typeMap['pdf'],
  typeMap['mp4'],
  typeMap['m4a'],
  typeMap['ico'],
  typeMap['woff2'],
  typeMap['woff'],
  typeMap['ttf'],
  typeMap['otf']
]

class StaticFileHandler extends Handler {
  /**
   *
   * @param {*string} clientFilesPath The fully qualified path to the client files that this module should serve.
   */
  constructor (clientFilesPath) {
    super()
    if (clientFilesPath == null || clientFilesPath.length === 0) {
      throw new Error('clientFilesPath must be specified')
    }
    this.clientFilesPath = clientFilesPath
  }

  static getMimeType (filePath) {
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

  static isBinaryType (mimeType) {
    return binaryTypes.indexOf(mimeType) >= 0
  }

  get (event, context, callback) {
    return Promise.try(() => {
      if (!event) {
        throw new Error('event object not specified.')
      }
      if (!('path' in event)) {
        throw new Error('No path.')
      }
      if (!event.path) {
        throw new Error('Empty path.')
      }

      let requestPath = event.path
      if (typeof requestPath === 'object') {
        /** in this case this path should be mapped like so in serverless.yml:
         * - http:
               path: fonts/{fonts+}
               integration: lambda
               method: get
               contentHandling: CONVERT_TO_BINARY
         * integration: lambda means not proxy.
         * The {fonts+} in the path indicates the base path and tells APIG to pass along the whole path
         */
        // now enumerate the properties of it:
        let propNames = Object.getOwnPropertyNames(requestPath)
        assert(propNames.length === 1, 'expected only a single property name, but found:', propNames)
        for (let p of propNames) {
          requestPath = p + '/' + requestPath[p]
        }
      } else {
        assert(typeof requestPath === 'string', 'expected path to be string')
      }

      // NOTE: We're not enforcing/validate a prefix path for content on the public endpoint here. Instead the serverless.yml is entirely responsible for only routing requests here that should be valid content.
      /*
      const prefix = '/client';
      if (! (event.path && event.path.startsWith(prefix))) {
        return reject(new Error('Not a client path.'));
      }
      */
      const prefix = ''
      let postfix = requestPath.substring(prefix.length)
      let basePath = this.clientFilesPath
      let filePath = path.join(basePath, postfix)
      return StaticFileHandler.readFileAsResponse(filePath, {}).then(response => {
        return response
      }).catch(err => {
        throw new Error(`Unable to read client file '${postfix}'. Error: ${err}`)
      })
    })
  }

  /**
   * Loads the specified file's content and returns a response that can be called back to lambda for sending the file as the http response.
   */
  static readFileAsResponse (filePath, viewData, statusCode = 200) {
    return fs.readFileAsync(filePath).then(stream => {
      let mimeType = StaticFileHandler.getMimeType(filePath)
      if (!mimeType) {
        let msg = 'Unrecognized MIME type for file ' + filePath
        D.error(msg)
        throw new Error(msg)
      }
      if (StaticFileHandler.isBinaryType(mimeType)) {
        // NOTE: BINARY: in this case we rely on this plugin: https://github.com/ryanmurakami/serverless-apigwy-binary and requiret the setup as defined there. See https://github.com/craftship/codebox-npm/blob/master/src/tar/get.js for a similar example
        let file = Buffer.from(stream).toString('base64')
        return file
      } else {
        let body = stream.toString('utf8')
        if (viewData) {
          viewData.csrftoken = JwtHandler.newToken()
          body = Mustache.render(body, viewData)
        }
        let response = {
          statusCode: statusCode,
          headers: {
            'Content-Type': mimeType
          },
          body: body
        }
        return response
      }
    })
  }

  /**
   * Returns a Promise with a response that is an HTML page with the specified error text on it.
   * @param {*string} errorText The error to add to the page.
   */
  static responseAsError (errorText, statusCode = 400) {
    return Promise.try(() => {
      const clientFilesPath = path.join(__dirname, '../../data/public/')
      let filePath = path.join(clientFilesPath, 'error.html')
      const viewData = {
        errorText: errorText
      }
      return StaticFileHandler.readFileAsResponse(filePath, viewData, statusCode)
    }).catch(err => {
      throw err
    })
  }
}

module.exports = StaticFileHandler
