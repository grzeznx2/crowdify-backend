const mongoose = require('mongoose')

const { Transaction } = require('./transactionModel')

const AppError = require('../utils/AppError')

const investmentSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: [true, 'Every investment must belong to some project.'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Every investment must belong to some user.'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount of investment is mandatory.'],
    min: [50, `Amount of investment can't be lower than 50.`],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  status: {
    type: String,
    trim: true,
    default: 'active',
    enum: {
      values: ['active', 'cancelled'],
      message: 'Plese choose investment status from: active / cancelled.',
    },
    required: [true, 'Every investment must either be or not be cancellable.'],
  },
})

investmentSchema.methods.checkIfMadeByUser = function (uid) {
  if (`${this.user}` !== uid) throw new AppError(`You cant't cancell investments made by someone else!`, 403)
  return this
}

investmentSchema.methods.checkIfActive = function () {
  if (this.status !== 'active') throw new AppError(`This investment is no longer active!`, 403)
  return this
}

investmentSchema.methods.handleCancellation = async function (project, user) {
  try {
    const session = await mongoose.startSession()
    session.startTransaction()

    project.paid -= this.amount
    await project.save({ session })

    this.status = 'cancelled'
    await this.save({ session })

    await Transaction.createTransactionByUser({ type: 'investment cancellation', amount: this.amount, user, increaseAccountValue: true })

    await session.commitTransaction()

    return this
  } catch (error) {
    throw error
  }
}

investmentSchema.statics.handleInvestment = async function ({ amount, project, user }) {
  try {
    const session = await mongoose.startSession()
    session.startTransaction()

    const investment = (await this.create([{ amount, project: project.id, user: user.id }], { session }))[0]

    project.paid += amount
    await project.save({ session })
    await Transaction.createTransactionByUser({
      amount,
      increaseAccountValue: false,
      project: project.id,
      projectName: project.name,
      type: 'investment in project',
      user,
    })

    await session.commitTransaction()
    return investment
  } catch (error) {
    throw error
  }
}

investmentSchema.statics.reduceUsersInvestments = function (investments) {
  return investments.reduce((acc, curr) => {
    acc[curr.user] = acc[curr.user] ? acc[curr.user] + curr.amount : curr.amount
    return acc
  }, {})
}

module.exports = mongoose.model('Investment', investmentSchema)
