module.exports = doc => {
    if (Array.isArray(doc)) return doc.map(el => el.toObject({ getters: true }))
    return doc.toObject({ getters: true })
}