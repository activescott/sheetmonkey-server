import $ from 'jquery'
import App from './Components/App.html'

import { createStore } from 'redux'
import rootReducer from './reducers/index.js'
import appState from './appState'

function initStore () {
  // appStore is the redux store: http://redux.js.org/#the-gist
  // Its API is { subscribe, dispatch, getState }:
  //   subscribe() to update the UI in response to state changes
  //   dispatch() an action to mutate the state of the store
  const store = createStore(rootReducer, appState)
  return store
}

function initComponent (store) {
  if (!store) throw Error('store required')
  let target = $('#main').get(0)
  const app = new App({ // eslint-disable-line no-unused-vars
    target: target,
    data: {
      store: store,
      user: store.getState().user
    }
  })
}

$(() => {
  const store = initStore()
  initComponent(store)
})
