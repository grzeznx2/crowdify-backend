const express = require('express')
const authController = require('../controllers/authController')
const commentController = require('../controllers/commentController')

const rateRouter = require('./rateRoutes')

const router = express.Router({ mergeParams: true })

router.route('/').post(authController.protect, authController.restrictTo('admin', 'user'), commentController.createCommentOnProject)

router
  .route('/:cid')
  .delete(authController.protect, authController.restrictTo('user', 'admin'), commentController.deleteComment)
  .patch(authController.protect, authController.restrictTo('user', 'admin'), commentController.updateComment)
  .post(authController.protect, authController.restrictTo('user', 'admin'), commentController.createCommentOnComment)

router.use('/:cid/rates', rateRouter)

module.exports = router
