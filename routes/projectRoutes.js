const express = require('express')

const projectController = require('../controllers/projectController')
const authController = require('../controllers/authController')

const commentRouter = require('../routes/commentRoutes')
const investmentRouter = require('../routes/investmentRoutes')
const interestRouter = require('../routes/interestRoutes')

const router = express.Router()

router
    .route('/')
    .get(projectController.getAllProjects)
    .post
    (authController.protect,
        authController.restrictTo('admin'),
        projectController.createProject)

router
    .route('/:pid')
    .get(projectController.getProject)
    .delete(
        authController.protect,
        authController.restrictTo('admin'),
        projectController.deleteProject)

router
    .use('/:pid/comments', commentRouter)

router
    .use('/:pid/investments', investmentRouter)

router
    .use('/:pid/interests', interestRouter)


module.exports = router