
/**
 * Returns the set of cookies as name=value pairs
 * @param {*} cookieHeaderVal The raw value of the cookie request header
 */
function cookieCutter (cookieHeaderVal) {
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

module.exports = cookieCutter
