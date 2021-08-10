const Investment = require('../models/investmentModel')
const Project = require('../models/projectModel')
const catchAsync = require('../utils/catchAsync')
const mapToObject = require('../utils/mapToObject')
const { throwErrorIf } = require('../utils/general')
const errorConditions = require('../constants/errorConditions')

exports.investInProject = catchAsync(async (req, res, next) => {
  const { pid } = req.params
  const { user } = req
  const { amount } = req.body

  const project = await Project.findById(pid)

  throwErrorIf({
    condition: errorConditions.DOES_NOT_EXIST,
    value: project,
    errorMessage: `There is no project found with provided ID!`,
    errorCode: 404,
  })

  project.rejectExcessiveInvestmentAmount(amount)

  user.rejectExcessiveTransactionAmount(amount)

  const investment = await Investment.handleInvestment({ amount, project, user })

  res.status(201).json({
    status: 'success',
    data: {
      investment: mapToObject(investment),
    },
  })
})

exports.cancelInvestment = catchAsync(async (req, res, next) => {
  const uid = req.user.id
  const { user } = req
  const { iid } = req.params

  const investment = await Investment.findById(iid)

  throwErrorIf({
    condition: errorConditions.DOES_NOT_EXIST,
    value: investment,
    errorMessage: `There is no investment found with provided ID!`,
    errorCode: 404,
  })

  investment.checkIfMadeByUser(uid).checkIfActive()

  const project = await Project.findById(investment.project)

  await investment.handleCancellation(project, user)

  res.status(204).json({
    status: 'success',
    data: null,
  })
})
