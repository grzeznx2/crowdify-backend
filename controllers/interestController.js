const mongoose = require('mongoose')

const Interest = require('../models/interestModel')
const Project = require('../models/projectModel')
const Investment = require('../models/investmentModel')
const User = require('../models/userModel')

const catchAsync = require('../utils/catchAsync')
const { throwErrorIf } = require('../utils/general')
const mapToObject = require('../utils/mapToObject')

exports.createInterests = catchAsync(async (req, res, next) => {
  // URL: POST projects/:pid/interests
  const { pid } = req.params
  let interests

  const project = await Project.findById(pid)

  throwErrorIf({
    condition: 'doesNotExist',
    value: project,
    errorMessage: `There is no project found with provided ID!`,
    errorCode: 404,
  })

  const { interestsDates } = project

  const investments = await Investment.find({ project: pid, status: 'active' })

  const usersInvestments = Investment.reduceUsersInvestments(investments)

  const usersTotalInterests = Interest.calcUsersTotalInterests(usersInvestments, project.interestRate)

  const interestsDistribution = project.calcInterestsDistribution()

  const interestsBodies = Interest.createInterestsBodies(interestsDates, usersTotalInterests, interestsDistribution, pid)

  let session = null

  try {
    session = await mongoose.startSession()
    session.startTransaction()

    interests = await Interest.insertMany(interestsBodies, { session })

    await Investment.updateMany({ project: pid, status: 'active' }, { status: 'executed' }, { session })

    const usersInterestsObj = Interest.createUsersInterestsObj(interests)

    await User.addInterestsToUsers(usersInvestments, usersInterestsObj, session)

    await session.commitTransaction()
  } catch (error) {
    if (session) {
      await session.abortTransaction()
    }
    throw error
  } finally {
    session.endSession()
  }

  res.status(201).json({
    status: 'success',
    data: {
      interests: mapToObject(interests),
    },
  })
})

exports.deleteAllInterestsOnProject = catchAsync(async (req, res, next) => {
  const { pid } = req.params
  await Interest.deleteMany({ project: pid })
  res.status(204).json({
    status: 'success',
    data: null,
  })
})
