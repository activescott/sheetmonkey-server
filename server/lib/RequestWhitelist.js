'use strict'
const Diag = require('./diag')
const D = new Diag('RequestWhitelist')

/**
 * Used with SmartsheetApiProxyHandler to handle whitelisted requests.
 */
class RequestWhitelist {
  /**
   * Initializes the instance with the specified permitted requests.
   * @param {*array<string>} permittedRequests An array of strings in the format '<method> relative_path' such as 'GET /sheets/{sheetID}'. The placeholders like {sheetID} accept any value in the actual incoming request in isPermitted.
   */
  constructor (permittedRequests) {
    permittedRequests = permittedRequests || []
    this._permittedRequests = permittedRequests.map(req => {
      const arr = req.split(' ', 2)
      return {
        method: arr[0],
        path: arr[1],
        matcher: RequestWhitelist.buildMatcher(arr[1])
      }
    })
  }

  static buildMatcher (path) {
    // path is something like '/sheets/{sheetID}' or '/sheets/{sheetID}/rows/{rowID}
    // add a path parser regex:
    RegExp.escape = function (s) { // https://stackoverflow.com/a/3561711/51061
      return s.replace(/[-/\\^$*+?.()|[\]]/g, '\\$&')
    }
    let pattern = RegExp.escape(path)
    let optionalQueryStringPattern = '(?:\\?.*)?$'
    let matcher = new RegExp('^' + pattern.replace(/\/\{[^}]*\}/gi, '/([^/\\?]+)') + optionalQueryStringPattern, 'i')
    // D.log('path   :', path)
    // D.log('matcher:', matcher.source)
    return matcher
  }

  /**
   * Returns true if the specified method and path is permitted.
   * @param {*string} method The HTTP method such as GET, POST, PUT, DELETE.
   * @param {*string} path The relative path that should match those given in permittedRequests
   */
  isRequestPermitted (method, path) {
    return this._permittedRequests.find(req => {
      // D.log(path, '=>', req.matcher.source, '==', req.matcher.test(path))
      return req.method === method && req.matcher.test(path)
    }) !== undefined
  }
}

module.exports = RequestWhitelist
