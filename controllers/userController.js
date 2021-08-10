const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const { createFilter, mapToObject, breakIfNotFound } = require('../utils/general')
const AppError = require('../utils/AppError')

exports.deleteUser = catchAsync(async (req, res, next) => {
  const { uid } = req.params
  const response = await User.deleteOne({ _id: uid })

  breakIfNotFound(!!response.deletedCount, 'user')

  res.status(204).json({
    status: 'success',
    data: null,
  })
})

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfrim)
    return next(new AppError('This route is not for password updating. Please use /updateMyPassword instead.', 400))

  const allowedFields = {
    // accountValue: true,
    // role: true,
    photo: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    country: true,
    city: true,
    address: true,
    statisticsSubscription: true,
    newsSubscription: true,
  }

  const filterObj = createFilter(allowedFields, req.body)

  const user = await User.findByIdAndUpdate(req.user.id, filterObj, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    status: 'success',
    data: {
      user: mapToObject(user),
    },
  })
})
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find()

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users: mapToObject(users),
    },
  })
})

exports.getUser = catchAsync(async (req, res, next) => {
  const { uid } = req.params
  const user = await User.findById(uid).populate({ path: 'investments transactions interests' })
  breakIfNotFound(user, 'user')
  res.status(200).json({
    status: 'success',
    data: {
      user: mapToObject(user),
    },
  })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
  const { id } = req.user
  await User.findByIdAndUpdate(id, { active: false })

  res.status(204).json({
    status: 'success',
    data: null,
  })
})
