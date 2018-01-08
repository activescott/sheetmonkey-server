'use strict'
const jwt = require('jwt-simple')
const Diag = require('../Diag')
const path = require('path')
const D = new Diag(path.parse(__filename).name)
const assert = require('assert')

/**
 * Ensures Serverless AWS Lambda handlers are authenticated with a JWT Bearer token.
 */
class LambdaAuthorizer {
  /**
   * @param {*string} jwtCert The contents of the public certificate that is used to validate the JWT signature.
   */
  constructor (jwtCert) {
    assert(jwtCert, 'jwtCert required')
    this.jwtCert = jwtCert
  }

  /**
   * Returns a function that will validate that an AWS Lambda request is authenticated.
   * Expects an `Authorization` request header with a Bearer token that is a JWT.
   * If the request isn't authorized, an HTTP response with failure information will be written.
   * If auth succeeds, it will add a `protected.claims` value to the context.
   * If postAuthorizationHandler returns a Promise, the promise will be resolved and its response be routed to the normal AWS Lambda handler callback.
   * @param {*function} postAuthorizationHandler A AWS Lambda-style handler that will be called if the request contains valid Authorization details.
   * @example
   * const cert = fs.readFileSync(__dirname + '/data/private/test-key.crt').toString('ascii')
   * const authorizer = new LambdaAuthorizer(cert)
   * module.exports.helloWorld = authorizer.protectHandler( (event, context, cb) => {
   *  const resp = { body: 'You only see this if authorized.' }
   *  return Promise.resolve(resp)
   * })
   */
  protectHandler (postAuthorizationHandler) {
    // return function that accepts event/context/callback, which:
    //   - Validates caller is authenticated
    //   - Then calls the postAuthHandler (user's function after authentication validated)
    return (event, context, callback) => {
      let isAuthenticated
      let authError
      try {
        isAuthenticated = this._ensureAuthentication(event, context, callback)
        authError = null
      } catch (err) {
        authError = err
        isAuthenticated = false
      }

      if (isAuthenticated) {
        return this._invokeHandlerAndMapResponse(postAuthorizationHandler, event, context, callback)
      } else {
        return this._writeError(401, `This resource requires authentication. Additional information: ${authError}`, callback)
      }
    }
  }

  /**
   * Calls the handler directly without requiring authentication.
   * It does allow the handler to returna promise that will be mapped to the appropriate callback.
   * @param {*function} postAuthorizationHandler A AWS Lambda-style handler that will be called.
   */
  publicHandler (postAuthorizationHandler) {
    return (event, context, callback) => {
      return this._invokeHandlerAndMapResponse(postAuthorizationHandler, event, context, callback)
    }
  }

  _invokeHandlerAndMapResponse (postAuthorizationHandler, event, context, callback) {
    let result = postAuthorizationHandler(event, context, callback)
    // D.log('response from postAuthorizationHandler:', result)
    const isPromise = obj => obj && 'then' in obj // <- https://stackoverflow.com/a/27746324/51061
    if (isPromise(result)) {
      return result
        .then(handlerResponse => callback(null, handlerResponse))
        .catch(handlerError => {
          if (!('httpStatusCode' in handlerError)) {
            // let lambda/APIG decide how to handle:
            callback(handlerError, null)
            return
          }
          let errorMessage = ''
          if ('name' in handlerError && handlerError.name) {
            errorMessage = handlerError.name + ': '
          }
          errorMessage += handlerError.message
          this._writeError(handlerError.httpStatusCode, errorMessage, callback)
        })
    } else {
      // not a promise, so handler expected to invoke callback
      return result
    }
  }

  /**
   * Return true if request is authorized.
   */
  _ensureAuthentication (event, context, callback) {
    const getToken = () => {
      if (!event) throw new AuthenticationRequiredError('request must have an event')
      if (!event.headers) throw new AuthenticationRequiredError('request must have headers')
      if (!('Authorization' in event.headers)) {
        throw new AuthenticationRequiredError('Authorization header required')
      }
      if (!context) throw new AuthenticationRequiredError('request must have a context')
      const authValue = event.headers.Authorization.trim()
      if (!authValue.startsWith('Bearer')) {
        throw new AuthenticationRequiredError('expected Bearer auth')
      }
      return authValue.slice('Bearer'.length).trim()
    }

    const decodePrincipal = (tokenVal) => {
      let decoded
      try {
        decoded = jwt.decode(tokenVal, this.jwtCert)
        context.protected = {
          claims: decoded
        }
        return true
      } catch (err) {
        D.log('decoding failed:', err)
        throw new Error(`Decoding cookie failed with error: ${err}`)
      }
    }

    let token = getToken()
    return decodePrincipal(token)
  }

  _writeError (statusCode, errMsg, callback) {
    // TODO: Could read the accept header here and return HTML response as needed. I'm assuming we really only care about the status code when expecting JSON.
    // TODO: Should optionally allow to use a templated "error" html page for response via staticfilehandler too. See OAuthClientHandler
    const response = {
      statusCode: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer'
      },
      body: JSON.stringify({ message: errMsg })
    }
    return callback(null, response)
  }
}

class AuthenticationRequiredError extends Error {
  constructor (message) {
    super(message)
    this.message = message
    this.name = 'AuthenticationRequiredError'
  }
}

module.exports = LambdaAuthorizer
module.exports.AuthenticationRequiredError = AuthenticationRequiredError
