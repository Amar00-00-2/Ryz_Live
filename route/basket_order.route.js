const express = require("express")
const router = express.Router()
const {basketOrderController} = require('../controller')

router
    .route('/')
    .post(basketOrderController.BasketOrderPlace)

module.exports = router