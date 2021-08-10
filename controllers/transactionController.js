const { Transaction } = require('../models/transactionModel')
const catchAsync = require('../utils/catchAsync')
const mapToObject = require('../utils/mapToObject')

exports.createTransaction = catchAsync(async (req, res, next) => {
  const uid = req.user.id
  const { amount, increaseAccountValue, type } = req.body

  if (!increaseAccountValue) req.user.rejectExcessiveTransactionAmount(amount)

  console.log(amount, increaseAccountValue, type)

  const transaction = await Transaction.createTransactionByUser({ amount, increaseAccountValue, type, user: uid }, req.user)

  res.status(201).json({
    status: 'success',
    data: {
      transaction: mapToObject(transaction),
    },
  })
})

exports.getAllTransactions = catchAsync(async (req, res, next) => {
  const uid = req.user.id

  const transactions = await Transaction.find({ user: uid })

  res.status(200).json({
    status: 'success',
    data: {
      transactions: mapToObject(transactions),
    },
  })
})
