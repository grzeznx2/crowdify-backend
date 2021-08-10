const express = require('express')

const authController = require('../controllers/authController')
const investmentController = require('../controllers/investmentController')

const router = express.Router({ mergeParams: true })

router.route('/').post(
  authController.protect,
  // authController.restrictTo('user'),
  investmentController.investInProject
)

router.route('/:iid').delete(authController.protect, investmentController.cancelInvestment)

module.exports = router
