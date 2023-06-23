const express = require("express")
const router = express.Router()
const {recentSearchController} = require('../controller')

router
    .route('/:user_id')
    .get(recentSearchController.getrecentsearch)
    .post(recentSearchController.addrecentsearch)
router
    .route('/:user_id/:id')
    .delete(recentSearchController.deleterecentsearch)


module.exports = router