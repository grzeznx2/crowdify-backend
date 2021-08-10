const errorConditions = require('../constants/errorConditions')
const Comment = require('../models/commentModel')
const Project = require('../models/projectModel')
const catchAsync = require('../utils/catchAsync')
const { mapToObject, throwErrorIf, createFilter } = require('../utils/general')

exports.createCommentOnProject = catchAsync(async (req, res, next) => {
  const uid = req.user.id
  const { pid } = req.params
  const { content } = req.body

  const project = await Project.findById(pid)

  throwErrorIf({
    condition: errorConditions.DOES_NOT_EXIST,
    value: project,
    errorMessage: `There is no project found with provided ID!`,
    errorCode: 404,
  })

  const comment = await Comment.create({ user: uid, project: pid, content })

  // throwErrorIf({
  //   condition: errorConditions.DOES_NOT_EXIST,
  //   value: null,
  //   errorMessage: `There is no project found with provided ID!`,
  //   errorCode: 404,
  // })
  res.status(201).json({
    status: 'success',
    data: {
      comment: mapToObject(comment),
    },
  })
})

exports.createCommentOnComment = catchAsync(async (req, res, next) => {
  const uid = req.user.id
  const { pid, cid } = req.params
  const { content } = req.body

  const comment = await Comment.findById(cid)

  throwErrorIf({
    condition: errorConditions.DOES_NOT_EXIST,
    value: comment,
    errorMessage: `There is no comment found with provided ID!`,
    errorCode: 404,
  })

  const projectId = comment.project
  const project = await Project.findById(projectId)

  throwErrorIf({
    condition: errorConditions.DOES_NOT_EXIST,
    value: project,
    errorMessage: `There is no project found with provided ID!`,
    errorCode: 404,
  })

  // throwErrorIf({
  //   condition: errorConditions.ARE_NOT_EQUAL,
  //   values: [pid, comment.project.toString()],
  //   errorMessage: `The comment does not belong to the project!`,
  //   errorCode: 404,
  // })

  // const newComment = await Comment.create({ user: uid, project: pid, parentComment: cid, content, depth: comment.depth + 1 })
  const newComment = await Comment.createNestedComment({ user: uid, project: projectId, content, depth: comment.depth + 1 }, comment)

  res.status(201).json({
    status: 'success',
    data: {
      comment: mapToObject(newComment),
    },
  })
})

exports.deleteComment = catchAsync(async (req, res, next) => {
  let uid = req.user.id

  const { cid } = req.params

  if (req.user.role !== 'admin') {
    throwErrorIf({
      condition: errorConditions.ARE_NOT_EQUAL,
      values: [`${comment.user}`, uid],
      errorMessage: `You can't delete comments written by someone else!`,
      errorCode: 403,
    })
  }

  const comment = await Comment.findById(cid)

  throwErrorIf({
    condition: errorConditions.DOES_NOT_EXIST,
    value: comment,
    errorMessage: `There is no comment found with provided ID!`,
    errorCode: 404,
  })

  await comment.deleteOne()

  res.status(200).json({
    status: 'success',
    data: null,
  })
})

exports.updateComment = catchAsync(async (req, res, next) => {
  const uid = req.user.id
  const { cid } = req.params

  const allowedFields = {
    content: true,
  }

  const filter = createFilter(allowedFields, req.body)

  let comment = await Comment.findById(cid)
  console.log(comment)

  throwErrorIf({
    condition: errorConditions.DOES_NOT_EXIST,
    value: comment,
    errorMessage: `There is no comment found with provided ID!`,
    errorCode: 404,
  })

  throwErrorIf({
    condition: errorConditions.ARE_NOT_EQUAL,
    values: [comment.user._id.toString(), uid],
    errorMessage: `You can't update comments written by someone else!`,
    errorCode: 403,
  })

  await comment.updateWithFilter(filter)

  res.status(200).json({
    status: 'success',
    data: {
      comment: mapToObject(comment),
    },
  })
})
