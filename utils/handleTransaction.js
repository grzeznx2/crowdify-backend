const mongoose = require('mongoose')

const handleInSession = async fn => {
    try {
        const sess = await mongoose.startSession()
        sess.startTransaction()
        const result = fn(sess)
        await sess.commitTransaction()
        return result
    } catch (error) {
        throw error
    }
}

const provideSession = (fn, ...args) => {
    return session => fn(session, ...args)
}

const handleTransaction = async (fn, ...args) => {
    return await handleInSession(provideSession(fn, ...args))
}

module.exports = handleTransaction

