const express = require('express')

const rateController = require('../controllers/rateController')
const authController = require('../controllers/authController')

const router = express.Router({ mergeParams: true })

router.use(authController.protect)

router.route('/').post(authController.protect, authController.restrictTo('user', 'admin'), rateController.rateComment)

router
  .route('/:rid')
  .delete(authController.protect, authController.restrictTo('user', 'admin'), rateController.deleteRate)
  .patch(authController.protect, authController.restrictTo('user', 'admin'), rateController.updateRate)

module.exports = router
