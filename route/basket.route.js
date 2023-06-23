const express = require("express")
const router = express.Router()
const {basketController} = require('../controller')

router
    .route('/')
    .post(basketController.addBasket)

module.exports = router