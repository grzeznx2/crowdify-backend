const express = require('express')

const authController = require(`../controllers/authController`)
const userController = require(`../controllers/userController`)

const router = express.Router()

router
    .route('/')
    .get(userController.getAllUsers)

router
    .post('/signup', authController.signup)

router
    .post('/login', authController.login)

router
    .delete('/deleteMe', authController.protect, userController.deleteMe)

router
    .patch('/updateMe', authController.protect, userController.updateMe)

router
    .route('/:uid')
    .get(
        authController.protect,
        // authController.restrictTo('admin'),
        userController.getUser
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin'),
        userController.deleteUser)

module.exports = router