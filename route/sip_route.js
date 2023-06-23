const router = require("express").Router();
const { sipController } = require("../controller");


router
    .route('/order')
    .post(sipController.SipPlaceOrder)

router
    .route('/modify_order')
    .post(sipController.SipModifyOrder)

router
    .route('/order_book')
    .post(sipController.SipOrderBook)

router
    .route('/order_cancel')
    .post(sipController.SipOrderCancel)

module.exports = router