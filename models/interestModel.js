const mongoose = require('mongoose')


const interestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Interest must belong to some user.']
    },
    project: {
        type: mongoose.Schema.ObjectId,
        ref: 'Project',
        required: [true, 'Interest must belong to some project.']
    },
    amount: {
        type: Number,
        min: [0, `Interest can't be lower than 0`],
        required: [true, 'Every interest must have amount.']
    },
    paymentDate: {
        type: Date,
        required: [true, 'Every interest must have payment date.']
    }
})

interestSchema.statics.calcUsersTotalInterests = function (investments, interestRate) {

    const usersTotalInterests = {}
    for (let user in investments) {
        usersTotalInterests[user] = (investments[user] * (interestRate / 100))
    }
    return usersTotalInterests

}

interestSchema.statics.createInterestsBodies = function (dates, usersTotalInterests, interestsDistribution, projectId) {
    let interestsBodies = []
    dates.forEach((date, i) => {
        for (let user in usersTotalInterests) {
            interestsBodies.push({
                user,
                amount: i === 0 ? Number((usersTotalInterests[user] * interestsDistribution.first).toFixed(2)) : Number((usersTotalInterests[user] * interestsDistribution.remaining).toFixed(2)),
                paymentDate: date,
                project: projectId
            })
        }
    })

    return interestsBodies
}

interestSchema.statics.createUsersInterestsObj = function (interests) {
    return interests.reduce((acc, cur) => {
        if (acc[cur.user]) {
            acc[cur.user].push(cur._id)
        } else acc[cur.user] = [cur._id]
        return acc
    }, {})
}

module.exports = mongoose.model('Interest', interestSchema)