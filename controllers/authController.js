const jwt = require('jsonwebtoken')
const { promisify } = require('util')

const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const { mapToObject } = require('../utils/general')
const AppError = require('../utils/AppError')

const signToken = id =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })

const createAndSendJWT = (user, statusCode, res) => {
  const token = signToken(user.id)

  user.password = undefined

  res.cookie('jwt', token, {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: false,
    sameSite: false,
  })

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: mapToObject(user),
    },
  })
}

exports.signup = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, password, passwordConfirm } = req.body

  const user = await User.create({ firstName, lastName, email, password, passwordConfirm })

  createAndSendJWT(user, 200, res)
})

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body
  let isPasswordCorrect

  if (!email || !password) return next(new AppError('Please provide email and password', 400))

  const user = await User.findOne({ email }).populate({ path: 'investments' }).select('+password')

  if (user) isPasswordCorrect = await user.checkPasswordValidity(password, user.password)

  if (!user || !isPasswordCorrect) return next(new AppError('Invalid password or email', 401))

  createAndSendJWT(user, 200, res)
})

exports.protect = catchAsync(async (req, res, next) => {
  let token = req.cookies.jwt

  if (!token) return next(new AppError('Please log in to access this page!'))

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

  const currentUser = await User.findById(decoded.id)

  if (!currentUser) return next(new AppError('The user belonging to this token does not longer exist!', 401))

  if (currentUser.changedPasswordAfter(decoded.iat)) return next(new AppError('User has recently changed password. Please log in again!', 401))

  req.user = currentUser

  next()
})

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return next(new AppError(`Sorry, you don't have permission to perform this action`, 403))
    next()
  }
}
