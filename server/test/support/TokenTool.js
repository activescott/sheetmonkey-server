'use strict'
const path = require('path')
const fs = require('fs')
const jwt = require('jwt-simple')

class TokenTool {
  static get pem () {
    const pemPath = path.join(__dirname, '../../data/private/test-key-private.pem')
    return fs.readFileSync(pemPath).toString('ascii')
  }
  static get crt () {
    const crtPath = path.join(__dirname, '../../data/private/test-key.crt')
    return fs.readFileSync(crtPath).toString('ascii')
  }
  static get alg () {
    return 'RS256'
  }
  static newToken (payload) {
    return jwt.encode(payload, TokenTool.pem, TokenTool.alg)
  }
}
module.exports = TokenTool
