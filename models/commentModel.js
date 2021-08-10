const mongoose = require('mongoose')

const rateSchema = new mongoose.Schema({
  isPositive: {
    type: Boolean,
    required: [true, `The 'isPositive' field is mandatory!`],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'A rate must belong to some user!'],
  },
})

const commentSchema = new mongoose.Schema(
  {
    contentModifiedAt: Date,
    depth: {
      type: Number,
      default: 1,
    },
    project: {
      type: mongoose.Schema.ObjectId,
      ref: 'Project',
      required: [true, 'A comment must belong to the project.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A comment must belong to the user.'],
    },
    content: {
      type: String,
      required: [true, 'Every comment must have a content!'],
      trim: true,
    },
    comments: [{ type: mongoose.Schema.ObjectId, ref: 'Comment' }],
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  }
)

commentSchema.pre('save', function (next) {
  if (this.isModified('content')) {
    this.contentModifiedAt = Date.now()
  }

  next()
})

commentSchema.methods.updateWithFilter = async function (filter) {
  for (let key in filter) {
    this[key] = filter[key]
  }
  await this.save()
  return this
}

commentSchema.methods.findRateByUser = function (uid) {
  return this.rates.find(rate => `${rate.user}` === uid)
}

commentSchema.methods.addRate = function (rate) {
  this.rates.push(rate)
  return this
}

commentSchema.statics.createNestedComment = async function (nestedCommentBody, parentComment) {
  try {
    let newComment
    const session = await mongoose.startSession()
    session.startTransaction()

    newComment = (await this.create([nestedCommentBody], { session }))[0]

    parentComment.comments.push(newComment._id)
    await parentComment.save({ session })
    await session.commitTransaction()

    return newComment
  } catch (error) {
    throw error
  }
}

commentSchema.pre('deleteOne', { document: true, query: false }, async function () {
  const idArray = []

  const getNestedCommentsId = comment => {
    if (comment.comments.length > 0) {
      for (let i = 0; i < comment.comments.length; i++) {
        getNestedCommentsId(comment.comments[i])
      }
    }
    idArray.push(comment._id)
    return idArray
  }

  await this.constructor.deleteMany({ _id: { $in: getNestedCommentsId(this) } })
})

commentSchema.pre(/^find/, function (next) {
  if ('populate' in this._mongooseOptions) next()
  else {
    this.populate({ path: 'rates' })
    this.populate({ path: 'user', select: 'firstName lastName photo' })
    this.populate({ path: 'comments' })
    next()
  }
})

commentSchema.post('save', async function (doc, next) {
  await doc.populate({ path: 'user', select: 'firstName lastName photo' }).execPopulate()

  next()
})

commentSchema.virtual('rates', {
  ref: 'Rate',
  foreignField: 'comment',
  localField: '_id',
})

module.exports = mongoose.model('Comment', commentSchema)
