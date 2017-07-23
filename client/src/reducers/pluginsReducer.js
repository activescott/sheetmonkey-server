const reducerMap = {}

reducerMap['SET_PLUGINS'] = action => {
  return action.plugins
}

const pluginsReducer = (state = [], action) => {
  console.assert(action.type, 'action.type')
  if (action.type in reducerMap) {
    console.log('found plugins reducer for action:', action, ' old state:', state)
    state = reducerMap[action.type](action)
    console.log('new state:', state)
  } else {
    console.log('NO plugins reducer for action:', action)
  }
  return state
}

export default pluginsReducer
