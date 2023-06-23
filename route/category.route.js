const router = require('express').Router()
const {category_ctrl}= require('../controller')

router
    .route('/add')
    .post(category_ctrl.CategoryAdd)

router
    .route('/edit/:category_id')
    .put(category_ctrl.CategoryEditUpdate)
//get active and inactive
router
    .route('/list/:id')
    .get(category_ctrl.CategoryList)
//update delete and restore
router
    .route('/delete/:id')
    .put(category_ctrl.CategoryDelete)
module.exports = router;