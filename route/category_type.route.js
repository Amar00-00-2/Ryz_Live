const router = require('express').Router()
const {category_type_ctrl}= require('../controller')

router
    .route('/list')
    .get(category_type_ctrl.CategoryTypeList)

router
    .route('/add')
    .post(category_type_ctrl.CategoryTypeAdd)

module.exports = router;
