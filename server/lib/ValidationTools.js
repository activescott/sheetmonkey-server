'use strict'

/**
 * Validates that the specified properties are provided and of the correct type.
 * Returns an object with the properties (and only the specified properties).
 * @param {*Object} expectation An object where keys are name of property, and value is an object with
 * keys `type`, indicating the typeof value for the property, and `required`, indicating whether the
 * property is required.
 * @param {*Object} input The object to validate the properties of
 */
function validateInput (expectation, input) {
  const validatedArgs = {}
  for (const argName in expectation) {
    const required = expectation[argName].required
    if (argName in input) {
      const expectedType = expectation[argName].type
      const actualType = typeof input[argName]
      if (expectedType === actualType) { // eslint-disable-line valid-typeof
        validatedArgs[argName] = input[argName]
      } else {
        throw new InvalidArgumentTypeError(argName, expectedType, actualType)
      }
    } else {
      if (required) throw new MissingRequiredArgumentError(argName)
    }
  }
  return validatedArgs
}

class InvalidArgumentTypeError extends Error {
  constructor (argName, expectedType, actualType) {
    const message = `Argument ${argName} must be of type ${expectedType} but was ${actualType}.`
    super(message)
    this.message = message
    this.name = 'InvalidArgumentTypeError'
  }
}

class MissingRequiredArgumentError extends Error {
  constructor (argName) {
    const message = `Argument ${argName} is required and was not provided.`
    super(message)
    this.message = message
    this.name = 'InvalidArgumentTypeError'
  }
}

module.exports.validateInput = validateInput
