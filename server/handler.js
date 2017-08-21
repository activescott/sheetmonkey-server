'use strict'
const fs = require('fs')
const path = require('path')
const StaticFileHandler = require('./lib/handlers/StaticFileHandler')
const JwtHandler = require('./lib/handlers/JwtHandler')
const OAuthClientHandler = require('./lib/handlers/OAuthClientHandler')
const SmartsheetApi = require('./lib/SmartsheetApi')
const DB = require('./lib/DB')
const DynamoDB = require('./lib/DynamoDB')

const crt = fs.readFileSync(path.join(__dirname, '/data/private/test-key.crt')).toString('ascii')
const LambdaAuthorizer = require('./lib/auth/LambdaAuthorizer')
const UsersHandler = require('./lib/handlers/UsersHandler')
const PluginsHandler = require('./lib/handlers/PluginsHandler')

const authorizer = new LambdaAuthorizer(crt)
const api = new SmartsheetApi()
const db = new DB(new DynamoDB(), process.env.DDB_USERS_TABLE, process.env.DDB_PLUGINS_TABLE)

module.exports.echo = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Echo function. Event and context follows.',
      event: event,
      context: context
    })
  }

  callback(null, response)
}

module.exports.ping = authorizer.protectHandler((event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Pong. If you see this the JWT is valid and unexpired! WOOHOOO!',
      input: event
    })
  }

  callback(null, response)
})

module.exports.env = (event, context, callback) => {
  let body = {
    env: process.env
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify(body)
  }

  callback(null, response)
}

module.exports.jwt = (event, context, callback) => {
  return new JwtHandler().get(event, context)
    .then(response => callback(null, response))
    .catch(err => callback(err))
}

module.exports.staticfile = (event, context, callback) => {
  const clientFilesPath = path.join(__dirname, './data/public/')
  return new StaticFileHandler(clientFilesPath).get(event, context)
    .then(response => callback(null, response))
    .catch(err => callback(err))
};

module.exports.defaultredirect = (event, context, callback) => {
  event.path = '/index.html'
  return module.exports.staticfile(event, context, callback)
}

module.exports.handleOAuthRedirect = (event, context, callback) => {
  return new OAuthClientHandler(api, db).handleOAuthRedirect(event, context)
    .then(response => callback(null, response))
    .catch(err => callback(err))
}

module.exports.users_me = authorizer.protectHandler((event, context, callback) => {
  const usersHandler = new UsersHandler(db, process.env.DDB_USERS_TABLE)
  return usersHandler.me(event, context)
})

module.exports.plugins_post = authorizer.protectHandler((event, context, callback) => {
  const pluginsHandler = new PluginsHandler(db, process.env.DDB_PLUGINS_TABLE)
  return pluginsHandler.post(event, context)
})

module.exports.plugins_listPublic = authorizer.publicHandler((event, context, callback) => {
  const pluginsHandler = new PluginsHandler(db, process.env.DDB_PLUGINS_TABLE)
  return pluginsHandler.listPublic(event, context)
})

module.exports.plugins_listPrivate = authorizer.protectHandler((event, context, callback) => {
  const pluginsHandler = new PluginsHandler(db, process.env.DDB_PLUGINS_TABLE)
  return pluginsHandler.listPrivate(event, context)
})

module.exports.plugins_getPrivate = authorizer.protectHandler((event, context, callback) => {
  const pluginsHandler = new PluginsHandler(db, process.env.DDB_PLUGINS_TABLE)
  return pluginsHandler.getPrivate(event, context)
})

module.exports.plugins_getPublic = authorizer.publicHandler((event, context, callback) => {
  const pluginsHandler = new PluginsHandler(db, process.env.DDB_PLUGINS_TABLE)
  return pluginsHandler.getPublic(event, context)
})

module.exports.plugins_put = authorizer.protectHandler((event, context, callback) => {
  const pluginsHandler = new PluginsHandler(db, process.env.DDB_PLUGINS_TABLE)
  return pluginsHandler.put(event, context)
})

module.exports.plugins_delete = authorizer.protectHandler((event, context, callback) => {
  const pluginsHandler = new PluginsHandler(db, process.env.DDB_PLUGINS_TABLE)
  return pluginsHandler.delete(event, context)
})
