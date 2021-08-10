const AppError = require('./AppError')

module.exports = (doc, docName) => {
    if (!doc) throw new AppError(`There is no ${docName} with provided ID.`, 404)
}