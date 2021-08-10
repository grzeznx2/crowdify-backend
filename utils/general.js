const AppError = require('./AppError')
const errorConditions = require('../constants/errorConditions')

exports.createFilter = (allowedFields, filteredObject) =>
  Object.keys(filteredObject).reduce((acc, cur) => {
    if (allowedFields[cur]) acc[cur] = filteredObject[cur]
    return acc
  }, {})

exports.mapToObject = doc => {
  if (Array.isArray(doc)) return doc.map(el => el.toObject({ getters: true }))
  return doc.toObject({ getters: true })
}

exports.breakIfNotFound = (doc, docName) => {
  if (!doc) throw new AppError(`There is no ${docName} with provided ID.`, 404)
}

exports.throwErrorIf = settings => {
  let shouldThrowError = false
  let { condition, values, value, errorMessage, errorCode } = settings

  switch (condition) {
    case errorConditions.ARE_EQUAL:
      shouldThrowError = [...new Set(values)].length !== values.length
      break
    case errorConditions.ARE_NOT_EQUAL:
      shouldThrowError = [...new Set(values)].length === values.length
      break
    case errorConditions.DOES_NOT_EXIST:
      shouldThrowError = value === null || value === undefined
      break
    case errorConditions.DOES_EXIST:
      shouldThrowError = value !== null && value !== undefined
      break
    case errorConditions.IS_ZERO:
      shouldThrowError = value === 0
      break
  }
  console.log(value)
  console.log(shouldThrowError)

  if (shouldThrowError) throw new AppError(errorMessage, errorCode)
}
