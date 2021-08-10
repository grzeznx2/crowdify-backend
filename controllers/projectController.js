const mongoose = require('mongoose')
const errorConditions = require('../constants/errorConditions')
const Project = require('../models/projectModel')
const ApiFeatures = require('../utils/ApiFeatures')
const catchAsync = require('../utils/catchAsync')
const { mapToObject, throwErrorIf } = require('../utils/general')

exports.getAllProjects = catchAsync(async (req, res, next) => {
  const { query, resultsCountQuery } = new ApiFeatures(req.query, Project).filter().sort().limit().paginate()

  // ask DB for total count of projects only if client asked for it (there is no way to do this with a single query in Mongo)
  const totalResultsCount = resultsCountQuery ? await resultsCountQuery : 0

  const projects = await query

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: resultsCountQuery
      ? {
          projects: mapToObject(projects),
          totalResultsCount,
        }
      : {
          projects: mapToObject(projects),
        },
  })
})

exports.createProject = catchAsync(async (req, res, next) => {
  const project = await Project.create(req.body)

  res.status(201).json({
    status: 'success',
    data: {
      project: mapToObject(project),
    },
  })
})

exports.getProject = catchAsync(async (req, res, next) => {
  const { pid } = req.params

  const project = await Project.findById(pid).populate({ path: 'comments' })

  throwErrorIf({
    condition: errorConditions.DOES_NOT_EXIST,
    value: project,
    errorMessage: `There is no project found with provided ID!`,
    errorCode: 404,
  })

  const flattenTree = tree => {
    const flattenedTree = []
    const flattenedObject = {
      byId: {},
      allIds: [],
    }
    const commentsRates = {}

    const iterate = node => {
      for (let i = 0; i < node.length; i++) {
        const nodeCopy = Object.assign({}, node[i])
        commentsRates[nodeCopy._id] = [...nodeCopy.rates]
        delete nodeCopy['comments']
        delete nodeCopy['rates']
        flattenedObject.byId[nodeCopy._id] = nodeCopy
        flattenedObject.allIds.push(nodeCopy._id)
        flattenedTree.push(nodeCopy)
        if (node[i].comments.length !== 0) iterate(node[i].comments)
      }
    }

    iterate(tree)
    return { flattenedTree, flattenedObject, commentsRates }
  }

  const { comments } = mapToObject(project)

  const { flattenedTree, flattenedObject, commentsRates } = flattenTree(comments)

  const data = { ...mapToObject(project), commentsRates, comments: flattenedObject }

  res.status(200).json({
    status: 'success',
    data: {
      project: data,
    },
  })
})

exports.deleteProject = catchAsync(async (req, res, next) => {
  const { pid } = req.params

  const project = await Project.findById(pid)

  throwErrorIf({
    condition: errorConditions.DOES_NOT_EXIST,
    value: project,
    errorMessage: `There is no project found with provided ID!`,
    errorCode: 404,
  })

  await project.deleteOne()

  res.status(204).json({
    status: 'success',
    data: null,
  })
})
