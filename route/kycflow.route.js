const router = require("express").Router();
const {KycFlowController} = require("../controller");

router
    .route('/:mobile_number')
    .get(KycFlowController.getKycStage)

router
    .route('/')
    .post(KycFlowController.createKycStage)

router
    .route('/firebasetoken_update')
    .put(KycFlowController.updateFireBaseToken)

router
    .route('/notification')
    .post(KycFlowController.notificationMessage)

router
    .route('/reKYC')
    .post(KycFlowController.notificationREKYC)

module.exports = router