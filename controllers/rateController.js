const Rate = require('../models/rateModel')
const Comment = require('../models/commentModel')
const errorConditions = require('../constants/errorConditions')
const { mapToObject, throwErrorIf } = require('../utils/general')

const catchAsync = require('../utils/catchAsync')

exports.rateComment = catchAsync(async (req, res, next) => {
  const uid = req.user.id
  const cid = req.params.cid
  const { isPositive } = req.body

  const comment = await Comment.findById(cid).populate('rates').select('user')

  throwErrorIf({
    condition: errorConditions.DOES_NOT_EXIST,
    value: comment,
    errorMessage: `There is no comment found with provided ID!`,
    errorCode: 404,
  })

  throwErrorIf({
    condition: errorConditions.ARE_EQUAL,
    values: [`${comment.user}`, uid],
    errorMessage: `You can't rate comments written by you!`,
    errorCode: 403,
  })

  const rateCreatedByUser = comment.findRateByUser(uid)

  throwErrorIf({
    condition: errorConditions.DOES_EXIST,
    value: rateCreatedByUser,
    errorMessage: `You have already rated this comment as ${isPositive ? 'positive' : 'negative'}!`,
    errorCode: 403,
  })

  const rate = await Rate.create({ comment: cid, user: uid, isPositive })

  res.status(201).json({
    status: 'success',
    data: {
      rate: mapToObject(rate),
    },
  })
})

exports.updateRate = catchAsync(async (req, res, next) => {
  const { isPositive } = req.body
  const { rid } = req.params
  const uid = req.user.id

  const rate = await Rate.findOneAndUpdate({ _id: rid, user: uid }, { isPositive }, { new: true })

  throwErrorIf({
    condition: errorConditions.DOES_NOT_EXIST,
    value: rate,
    errorMessage: `There is no rate found with provided ID or this rate belongs to another user!`,
    errorCode: 404,
  })

  res.status(200).json({
    status: 'success',
    data: {
      rate: mapToObject(rate),
    },
  })
})

exports.deleteRate = catchAsync(async (req, res, next) => {
  const uid = req.user.id
  const { rid } = req.params

  const rate = await Rate.findById(rid)

  throwErrorIf({
    condition: errorConditions.DOES_NOT_EXIST,
    value: rate,
    errorMessage: `There is no rate found with provided ID!`,
    errorCode: 404,
  })

  throwErrorIf({
    condition: errorConditions.ARE_NOT_EQUAL,
    values: [`${rate.user}`, uid],
    errorMessage: `You can't delete rates made by someone else!`,
    errorCode: 403,
  })

  await rate.deleteOne()

  res.status(204).json({
    status: 'success',
    data: null,
  })
})
