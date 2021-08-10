const mongoose = require('mongoose')

const rateSchema = new mongoose.Schema({
  isPositive: {
    type: Boolean,
    required: [true, `The 'isPositive' field is mandatory!`],
  },
  comment: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'A rate must belong to some comment!'],
    ref: 'Comment',
  },
  user: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'A rate must belong to some user!'],
    ref: 'User',
  },
})

module.exports = mongoose.model('Rate', rateSchema)
