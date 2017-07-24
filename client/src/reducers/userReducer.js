const reducerMap = {}

reducerMap['SET_USER'] = action => {
  return action.user
}

const userReducer = (state = { loggedIn: false }, action) => {
  console.assert(action.type, 'action.type')
  if (action.type in reducerMap) {
    // console.log('found user reducer for action:', action, ' old state:', state)
    state = reducerMap[action.type](action)
    // console.log('new state:', state)
  } else {
    // console.log('NO user reducer for action:', action)
  }
  return state
}

export default userReducer
