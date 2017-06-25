'use strict'; // props to @pmuens from https://github.com/JustServerless/discuss/blob/master/backend/lib/dynamodb.js
const Promise = require('bluebird');
const DynamoDB = require('aws-sdk').DynamoDB;

//NOTE: Lambda functions don't need explicit creds: http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-lambda.html
const dynamoConfig = {
  region: process.env.AWS_REGION
};

//http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html
const client = new DynamoDB.DocumentClient(dynamoConfig);

class DDB {
  delete(params) {
    return Promise.fromCallback(cb => client.delete(params, cb));
  }

  get(params) {
    return Promise.fromCallback(cb => client.get(params, cb));
  }

  put(params) {
    return Promise.fromCallback(cb => client.put(params, cb));
  }

  query(params) {
    return Promise.fromCallback(cb => client.put(params, cb));
  }

  scan(params) {
    return Promise.fromCallback(cb => client.put(params, cb));
  }
  
  update(params) {
    return Promise.fromCallback(cb => client.put(params, cb));
  }
}

module.exports = DDB;