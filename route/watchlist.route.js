const express = require("express")
const router = express.Router()
const {watchlistController} = require('../controller')

router
    .route('/')
    .post(watchlistController.addWatchList)

router
    .route('/instrument-quotes')
    .post(watchlistController.getUserSelectedWatchList)

module.exports = router