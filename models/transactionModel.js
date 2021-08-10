const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Every transaction must be of a certain type!'],
    trim: true,
    enum: {
      values: [
        'account deposit',
        'investment in project',
        'investment cancellation',
        'interest payment for project',
        'funds withdrawal',
        'full repayment for project',
      ],
      message: `Choose transaction type from: deposit/ investment/ investment cancellation/ interest payment for project/ withdrawal/ full repayment for project`,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  amount: {
    type: Number,
    min: [0.01, 'Transaction amount cannot be lower than 0.01'],
    required: [true, 'Every transaction must have some amount.'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Every transaction must belong to some user.'],
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
  },
  projectName: String,

  increaseAccountValue: {
    type: Boolean,
    required: [true, 'Every transaction must either increase or not increase (===decrease) account value.'],
    validate: {
      validator: function (val) {
        const type = this.type
        if (type === 'deposit') {
          return val === true
        }
        if (type === 'withdrawal' || type === 'investment') {
          return val === false
        }
        return true
      },
      message: function (props) {
        return `This type of transaction can't ${props.value ? 'increase' : 'decrease'} account value.`
      },
    },
  },
})

transactionSchema.statics.createTransactionByUser = async function (transaction) {
  const { user } = transaction
  try {
    const session = await mongoose.startSession()
    session.startTransaction()

    const newTransaction = (await this.create([{ ...transaction, user: user.id }], { session }))[0]
    user.updateAccountValue(transaction.amount, transaction.increaseAccountValue)
    user.addTransaction(newTransaction)
    await user.save({ session, validateBeforeSave: false })

    await session.commitTransaction()
    return newTransaction
  } catch (error) {
    throw error
  }
}

const Transaction = mongoose.model('Transaction', transactionSchema)
module.exports = { transactionSchema, Transaction }
