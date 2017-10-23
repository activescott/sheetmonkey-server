function getRandomInt (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}

module.exports.randomUserID = function () {
  return getRandomInt(1000000, 10000000)
}

/**
 * Returns a milliseconds since epoch for the specified date. Can be read as a JS Date like `Date(expiresAtValue)`.
 * This isn't useful in JWT tokens (which is *seconds* since epoch), but is used with OAuth tokens inside sheetmonkey server.
 */
module.exports.getExpiresAtDateValue = function (secondsFromNow) {
  return Date.now().valueOf() + (secondsFromNow * 1000)
}
