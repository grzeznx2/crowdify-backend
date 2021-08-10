const express = require('express')
const authController = require('../controllers/authController')
const interestController = require('../controllers/interestController')

const router = express.Router({ mergeParams: true })

router
  .route('/')
  .post(authController.protect, authController.restrictTo('admin'), interestController.createInterests)
  .delete(interestController.deleteAllInterestsOnProject)

module.exports = router
