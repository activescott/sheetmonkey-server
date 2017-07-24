const reducerMap = {}

reducerMap['SET_PLUGINS'] = action => {
  return action.plugins
}
reducerMap['EDIT_PLUGIN'] = action => {
  let plugins = deepClone(action.plugins)
  let pluginIndexToEdit = action.pluginIndex
  let newPluginValue = action.plugin
  plugins[pluginIndexToEdit] = newPluginValue
  return plugins
}

const pluginsReducer = (state = [], action) => {
  console.assert(action.type, 'action.type')
  if (action.type in reducerMap) {
    // console.log('found plugins reducer for action:', action, ' old state:', state)
    state = reducerMap[action.type](action)
    // console.log('new state:', state)
  } else {
    console.log('NO plugins reducer for action:', action)
  }
  return state
}

function deepClone (arr) {
  if (!arr) return arr
  let s = JSON.stringify(arr)
  return JSON.parse(s)
}

export default pluginsReducer
