const router = require('express').Router()
const { fileUploadController } = require('../controller')

router
    .route('/file_upload')
    .post(fileUploadController.file_upload_fn)

module.exports = router