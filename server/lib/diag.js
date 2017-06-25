'use strict';

// NOTE: the spread arg (...args) causes syntax errors in lambda. They use an old version of node: http://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html & http://node.green/

class Diag {
  constructor(prefix) { this._prefix = prefix; }

  log() {
    //convert arguments to array
    var args = Array.prototype.slice.call(arguments); 
    args = [`${this._prefix}:`].concat(args);
    console.log.apply(null, args);
  }

  warn() {
    var args = Array.prototype.slice.call(arguments); 
    args = [`${this._prefix}:`].concat(args);
    console.warn.apply(null, args);
  }

  error() {
    var args = Array.prototype.slice.call(arguments); 
    args = [`${this._prefix}:`].concat(args);
    console.error.apply(null, args);
  }

  assert() {
    var args = Array.prototype.slice.call(arguments);
    args = [args[0]]; //the "test" argument
    args = args.concat([`${this._prefix}:`]);
    args = args.concat(args.slice(1));
    console.assert.apply(null, args);
  }
}

module.exports = Diag;
