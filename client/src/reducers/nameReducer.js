'use strict'
// TODO: remove this reducer. This is really just for testing/experimenting with redux+svelte
const nameReducer = (state = 'world', action) => {
  console.log('nameReducer sees action:', action)
  return state
}

export default nameReducer
