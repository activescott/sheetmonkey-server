'use strict'
const chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
if (!process.env.AWS_REGION) {
  process.env.AWS_REGION = 'LOCAL'
}
