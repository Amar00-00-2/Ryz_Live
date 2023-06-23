const router = require('express').Router()
const {scanner_form_ctrl}= require('../controller')

router
    .route('/add')
    .post(scanner_form_ctrl.ScannerFormAdd)

router
    .route('/editviewScannerform/:scannerform_id')
    .get(scanner_form_ctrl.ScannerFormEditView)

router
    .route('/delete/:scannerid')
    .put(scanner_form_ctrl.ScannerDelete)

router
    .route('/list/:id')
    .get(scanner_form_ctrl.ScannerActiveInactive)

module.exports = router;