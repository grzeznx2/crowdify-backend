const express = require('express')

const authController = require('../controllers/authController')
const transactionController = require('../controllers/transactionController')

const router = express.Router()

router
    .route('/')
    .post(authController.protect, transactionController.createTransaction)
    .get(authController.protect, transactionController.getAllTransactions)

module.exports = router