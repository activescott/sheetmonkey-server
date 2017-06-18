// NOTE: rollup technically isn't needed here as node supports almost all of ES6 except the module import syntax (https://medium.com/the-node-js-collection/an-update-on-es6-modules-in-node-js-42c958b890c) but it is useful for running the ES6 code via mocha. See https://github.com/rollup/rollup/issues/873#issuecomment-243595904
export default {
  entry: 'handler.js',
  format: 'cjs',
  dest: 'bundle.js' // equivalent to --output
};