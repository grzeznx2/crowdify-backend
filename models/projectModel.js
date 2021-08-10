const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const Comment = require('./commentModel')
const AppError = require('../utils/AppError')
const { throwErrorIf } = require('../utils/general')
const errorConditions = require('../constants/errorConditions')

const projectSchema = new mongoose.Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    duration: {
      type: Number,
      required: [true, 'Duration is mandatory.'],
      min: [0, 'Duration must be higher than 0.'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is mandatory.'],
      validate: [
        {
          validator: function (val) {
            return val.getTime() >= Date.now()
          },
          message: 'The end date ({VALUE}) cannot be in the past.',
        },
        {
          validator: function (val) {
            return val.getTime() > this.startDate.getTime()
          },
          message: 'The end date ({VALUE}) must be after the start date.',
        },
      ],
    },
    imageUrl: {
      type: String,
      trim: true,
      required: [true, 'Image URL is mandatory.'],
    },
    investors: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    interestRate: {
      type: Number,
      min: [1, 'Interest rate must be higher than 0.'],
      max: [100, 'Interest rate cannot be higher than 100.'],
      required: [true, 'Interest rate is mandatory'],
    },
    interestPaymentsRate: {
      type: Number,
      min: [1, 'Interest payments rate must be higher than 0.'],
      validate: [
        {
          validator: function (val) {
            return val < this.duration
          },
          message: 'Interest payments rate must be lower than loan duration.',
        },
        {
          validator: function () {
            return !!this.interestPaymentsStart
          },
          message: `You can't specify interest payments rate without specifying interest payments start.`,
        },
      ],
    },
    interestPaymentsStart: {
      type: Number,
      min: [1, 'Interest payments start must be higher than 0.'],
      validate: [
        {
          validator: function () {
            return !!this.interestPaymentsRate
          },
          message: `You can't specify interest payments start without specifying interest payments rate.`,
        },
        {
          validator: function (val) {
            return val < this.duration
          },
          message: 'Interest payments start must be lower than loan duration.',
        },
      ],
    },
    location: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, 'Location is mandatory.'],
    },
    name: {
      type: String,
      required: [true, 'A project must have a name.'],
      unique: true,
      minlength: [3, 'A project name must be longer than 3 characters.'],
      maxlength: [100, 'A project name must be longer than 100 characters.'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is mandatory.'],
      validate: {
        validator: function (val) {
          return val.getTime() >= Date.now()
        },
        message: 'Start date ({VALUE}) cannot be in the past.',
      },
    },
    status: {
      type: String,
      trim: true,
      enum: {
        values: ['active', 'coming', 'funded', 'repaid'],
        message: 'Choose status from: active / coming / funded / repaid.',
      },
      default: 'coming',
    },
    summary: {
      type: [
        {
          title: String,
          content: [String],
        },
      ],
      validate: {
        validator: function (val) {
          return val.length > 0
        },
        message: 'Summary is mandatory',
      },
    },
    minTarget: {
      type: Number,
      required: [true, 'Min. target is mandatory.'],
      min: [0, 'Min. target must be higher than 0.'],
      validate: {
        validator: function (val) {
          return val <= this.totalTarget
        },
        message: 'Min. target cannot be greater than total target.',
      },
    },
    totalTarget: {
      type: Number,
      required: [true, 'Total target is mandatory.'],
      min: [0, 'Total target must be higher than 0.'],
    },
    paid: {
      type: Number,
      default: 0,
      min: [0, 'The already paid amount must be higher than 0.'],
    },
    type: {
      type: String,
      trim: true,
      enum: {
        values: ['sme', 'business', 'real estate', 'energy', 'entertainment', 'logistics', 'technologies'],
        message: 'Choose type from: sme/ business/ real estate/ energy/ entertainment/ logistics/ technologies',
      },
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

projectSchema.plugin(uniqueValidator, { message: `{PATH} should be unique.` })

projectSchema.pre('deleteOne', { document: true, query: false }, async function () {
  await Comment.deleteMany({ project: this.id })
})

projectSchema.statics.deleteProjectWithComments = async function (pid) {
  const project = await this.findById(pid)

  throwErrorIf({
    condition: errorConditions.DOES_NOT_EXIST,
    value: project,
    errorMessage: `There is no project found with provided ID!`,
    errorCode: 404,
  })

  try {
    const session = await mongoose.startSession()
    session.startTransaction()

    await Comment.deleteMany({ project: pid }, { session })
    await project.deleteOne({ session })

    await session.commitTransaction()
  } catch (error) {
    throw error
  }
}

projectSchema.methods.rejectExcessiveInvestmentAmount = function (amount) {
  const requiredAmount = this.totalTarget - this.paid
  if (requiredAmount < amount)
    throw new AppError(`The amount you would like to invest is higher than amount needed. You can invest at most ${requiredAmount} euro.`, 403)
}

projectSchema.virtual('interestPayments').get(function () {
  if (!this.interestPaymentsStart && !this.interestPaymentsRate) return 'at the end of the loan term.'

  const rateMessage = this.interestPaymentsRate === 1 ? 'monthly' : `every ${this.interestPaymentsRate} months`

  const startMessage = this.interestPaymentsStart === 1 ? 'month' : `${this.interestPaymentsStart} months`

  return `${rateMessage} after first ${startMessage}`
})

projectSchema.virtual('interestsNumber').get(function () {
  const { interestPaymentsStart, interestPaymentsRate, duration } = this
  const interestsNumber = (duration - interestPaymentsStart) / interestPaymentsRate
  return interestsNumber
})

projectSchema.methods.getInterestsNumber = function () {
  const { interestPaymentsStart, interestPaymentsRate, duration } = this
  const interestsNumber = (duration - interestPaymentsStart) / interestPaymentsRate
  return interestsNumber
}

projectSchema.methods.getYearMonthDate = function () {
  const { endDate } = this
  const year = endDate.getFullYear()
  const month = endDate.getMonth()
  const date = endDate.getDate()
  return [year, month, date]
}

projectSchema.virtual('interestsDates').get(function () {
  const { interestPaymentsStart, interestPaymentsRate } = this
  const interestsNumber = this.getInterestsNumber()
  let [year, month, date] = this.getYearMonthDate()

  const interestsDates = [...Array(interestsNumber)].map((_, i) => {
    if ((month + interestPaymentsStart + interestPaymentsRate * i) % 12 === 1 && date > 28) {
      return new Date(year, month + interestPaymentsStart + interestPaymentsRate * i, 28, 17, 0)
    }
    return new Date(year, month + interestPaymentsStart + interestPaymentsRate * i, date, 17, 0)
  })

  return interestsDates
})

projectSchema.methods.calcInterestsDistribution = function () {
  const { interestPaymentsRate, interestPaymentsStart, duration } = this
  const interestsDistribution = {}

  interestsDistribution.first = interestPaymentsStart / duration
  interestsDistribution.remaining = interestPaymentsRate / duration

  return interestsDistribution
}

projectSchema.virtual('comments', {
  ref: 'Comment',
  foreignField: 'project',
  localField: '_id',
  match: { depth: 1 },
})

module.exports = new mongoose.model('Project', projectSchema)
