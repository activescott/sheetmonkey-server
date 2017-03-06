'use strict';

// NOTE: the spread arg (...args) causes syntax errors in lambda. They use an old version of node: http://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html & http://node.green/

class Diag {
  constructor(prefix) { this._prefix = prefix; }

  log() { 
    let args = [`${this._prefix}:`].concat(arguments);
    console.log.apply(args);
  }

  warn() {
    let args = [`${this._prefix}:`].concat(arguments);
    console.warn.apply(args);
  }

  error() {
    let args = [`${this._prefix}:`].concat(arguments);
    console.error.apply(args);
  }

  assert() {
    let args = [arguments[0]]; //the "test" argument
    args = args.concat([`${this._prefix}:`]);
    args = args.concat(arguments.slice(1));
    console.assert.apply(args);
  }
}

module.exports = Diag;
