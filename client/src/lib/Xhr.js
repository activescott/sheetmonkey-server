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
    }
    if (!('Authorization' in headers)) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  getJSON (url, headers) {
    headers = Object.assign({}, headers)
    this.addAuthorizationHeader(headers)

    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest()
      xhr.open('GET', url, true)
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
      xhr.send()
    })
  }
}

export default Xhr
