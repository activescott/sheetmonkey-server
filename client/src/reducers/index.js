'use strict'
import { combineReducers } from 'redux'

// Remember: Reducers are pure functions that take the previous state and an action, and return
// the next state.
// The best explanation of reducers in: http://redux.js.org/docs/introduction/CoreConcepts.html#core-concepts

import userReducer from './userReducer'
import pluginsReducer from './pluginsReducer'

// combineReducers: http://redux.js.org/docs/api/combineReducers.html#combinereducersreducers
const rootReducer = combineReducers({
  user: userReducer,
  plugins: pluginsReducer
})

export default rootReducer
