'use strict'
import Promise from 'bluebird'
/* global XMLHttpRequest */

class Xhr {
  constructor () {
    console.assert(document, 'expected document to be available')
  }

  cookieCutter (cookieHeaderVal) {
    // a cookie has multiple key=value pairs separated by semicolons:
    let obj = {}
    if (cookieHeaderVal) {
      const pairs = cookieHeaderVal.split(';')
      for (let p of pairs) {
        let kv = p.split('=')
        obj[kv[0].trim()] = kv[1].trim()
      }
    }
    return obj
  }

  addAuthorizationHeader (headers) {
    let cookies = this.cookieCutter(document.cookie)
    let token = ('jwt' in cookies) ? cookies.jwt : ''
    if (!token) {
      console.log('token not found. not authorizing xhr')
      return
    }
    if (!('Authorization' in headers)) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  getJSON (url, headers) {
    headers = Object.assign({}, headers)
    this.addAuthorizationHeader(headers)

    return Xhr.xhrPromise('GET', url, headers)
  }

  deleteJSON (url, headers) {
    headers = Object.assign({}, headers)
    this.addAuthorizationHeader(headers)
    headers['Content-Type'] = 'application/json'

    return Xhr.xhrPromise('DELETE', url, headers)
  }

  putJSON (url, headers, data) {
    headers = Object.assign({}, headers)
    this.addAuthorizationHeader(headers)
    headers['Content-Type'] = 'application/json'

    return Xhr.xhrPromise('PUT', url, headers, data)
  }

  postJSON (url, headers, data) {
    headers = Object.assign({}, headers)
    this.addAuthorizationHeader(headers)
    headers['Content-Type'] = 'application/json'

    return Xhr.xhrPromise('POST', url, headers, data)
  }

  static xhrPromise (method, url, headers, data) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest()
      xhr.open(method, url, true)
      if (headers) {
        for (var header in headers) {
          console.log('found header:', header, '=', headers[header])
          xhr.setRequestHeader(header, headers[header])
        }
      }
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status < 200 || xhr.status >= 300) {
            return reject(new Error(`Server at url '${url}' returned error status '${xhr.status}'. StatusText: '${xhr.statusText}'. ResponseText: ${xhr.responseText}`))
          }
          try {
            return resolve(JSON.parse(xhr.responseText))
          } catch (e) {
            return reject(new Error(`Failed to parse JSON from url '${url}'. Error: ${e}\n Response was: '${xhr.responseText}'`))
          }
        }
      }
      if (data) {
        if (typeof data !== 'string') {
          // if already string we assume it's already json, otherwise we stringify it to json
          data = JSON.stringify(data)
        }
        xhr.send(data)
      } else {
        xhr.send()
      }
    })
  }
}

export default Xhr
