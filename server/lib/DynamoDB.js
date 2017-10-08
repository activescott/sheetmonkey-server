'use strict'
const Promise = require('bluebird')
const assert = require('assert')
const DynamoDB = require('aws-sdk').DynamoDB

const Diag = require('./diag')

const D = new Diag('DynamoDB')

class DDB {
  constructor () {
    // NOTE: Lambda functions don't need explicit creds: http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-lambda.html
    let dynamoConfig
    if (process.env.IS_LOCAL === 'true' || process.env.AWS_REGION === 'LOCAL') {
      dynamoConfig = {
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      }
    } else {
      dynamoConfig = {
        region: process.env.AWS_REGION
      }
      D.log('dynamoConfig:', dynamoConfig)
    }
    // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html
    this.client = new DynamoDB.DocumentClient(dynamoConfig)
  }

  delete (params) {
    return Promise.fromCallback(cb => this.client.delete(params, cb))
  }

  get (params) {
    return Promise.fromCallback(cb => this.client.get(params, cb))
  }

  put (params) {
    return Promise.fromCallback(cb => this.client.put(params, cb))
  }

  query (params) {
    return Promise.fromCallback(cb => this.client.query(params, cb))
  }

  scan (params) {
    return Promise.fromCallback(cb => this.client.scan(params, cb))
  }

  update (params) {
    return Promise.fromCallback(cb => this.client.update(params, cb))
  }
}

module.exports = DDB
