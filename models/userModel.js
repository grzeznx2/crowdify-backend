const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const uniqueValidator = require('mongoose-unique-validator')
const { transactionSchema } = require('./transactionModel')
const AppError = require('../utils/AppError')

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please provide first name.'],
  },
  lastName: {
    type: String,
    required: [true, 'Please provide last name.'],
  },
  email: {
    type: String,
    lowercase: true,
    required: [true, 'Please provide an email.'],
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email.',
    },
  },
  password: {
    type: String,
    required: [true, 'Please provide a password.'],
    minlength: [8, 'Password should be at least 8 characters long.'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password.'],
    validate: {
      validator: function (val) {
        return val === this.password
      },
      message: 'Passwords are different!',
    },
  },
  passwordChangedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  accountValue: {
    type: Number,
    default: 0,
    min: [0, 'Account cannot be lower than 0.'],
  },
  transactions: [transactionSchema],
  interests: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Interest',
    },
  ],

  projects: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Project',
    },
  ],
  phone: Number,
  photo: String,
  country: String,
  city: String,
  address: String,
  verificationStatus: {
    type: Boolean,
    default: false,
  },
  statisticsSubscription: {
    type: Boolean,
    default: true,
  },
  newsSubscription: {
    type: Boolean,
    default: true,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  role: {
    type: 'String',
    enum: {
      values: ['user', 'admin'],
    },
    default: 'user',
  },
})

userSchema.plugin(uniqueValidator, { message: '{PATH} should be unique.' })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  this.password = await bcrypt.hash(this.password, 12)

  this.passwordConfirm = undefined
  next()
})

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next()

  this.passwordChangedAt = Date.now() - 1000

  next()
})

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } })
  next()
})

userSchema.virtual('investments', {
  ref: 'Investment',
  foreignField: 'user',
  localField: '_id',
})

userSchema.methods.updateAccountValue = function (amount, increaseAccountValue) {
  if (increaseAccountValue) {
    this.accountValue += amount
  } else {
    this.accountValue -= amount
  }
  return this
}

userSchema.methods.checkPasswordValidity = async function (candidatePassword, correctPassword) {
  return await bcrypt.compare(candidatePassword, correctPassword)
}

userSchema.methods.changedPasswordAfter = function (date) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
    return changedTimestamp > date
  }
  return false
}

userSchema.methods.rejectExcessiveTransactionAmount = function (amount) {
  if (this.accountValue < amount) throw new AppError(`The amount of transaction is greater than user's account value!`, 403)
}

userSchema.methods.addTransaction = function (transaction) {
  if (this.transactions.length >= 4) {
    this.transactions.pop()
    this.transactions.unshift(transaction)
  }
}

userSchema.statics.addInterestsToUsers = async function (usersInvestments, usersInterestsObj, session) {
  try {
    let users = []
    for (let user in usersInvestments) {
      users.push(this.findById(user).session(session))
    }

    users = await Promise.all(users)

    users = users.map(user => {
      user.interests.push(...usersInterestsObj[`${user._id}`])
      return user.save({ session, validateBeforeSave: false })
    })

    users = await Promise.all(users)
  } catch (error) {
    throw error
  }
}

module.exports = mongoose.model('User', userSchema)
