// See http://redux.js.org/docs/recipes/ReducingBoilerplate.html#action-creators
export default class Actions {
  static get setUser () {
    return makeActionCreator('SET_USER', 'user')
  }
  static get setPlugins () {
    return makeActionCreator('SET_PLUGINS', 'plugins')
  }
  static addPlugin (plugin) {
    return makeActionCreator('ADD_PLUGIN', 'plugin')(plugin)
  }
  static editPlugin (plugins, pluginIndex, plugin) {
    return makeActionCreator('EDIT_PLUGIN', 'plugins', 'pluginIndex', 'plugin')(plugins, pluginIndex, plugin)
  }
}

function makeActionCreator (actionType, ...argNames) {
  // see http://redux.js.org/docs/recipes/ReducingBoilerplate.html#generating-action-creators
  return function (...args) {
    let action = { 'type': actionType }
    argNames.forEach((arg, index) => {
      action[argNames[index]] = args[index]
    })
    return action
  }
}
