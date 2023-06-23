const express = require("express")
const router = express.Router()
const { userController } = require('../controller')
const axios = require('axios')
router
    .route('/')
    .get(userController.users)
    .post(userController.userCreate)

router
    .route('/userauth')
    .post(userController.userAuth)


module.exports = router