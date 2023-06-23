const router = require("express").Router()
const {estimate_ctrl} = require("../controller")


router
    .route('/equity/:stock/:type/:value')
    .get(estimate_ctrl.EquitySeries)

router
    .route('/currency/:stock/:type/:value')
    .get(estimate_ctrl.CurrencySeries)

router
    .route('/commodity/:stock/:type/:value')
    .get(estimate_ctrl.CommoditySeries)

router
    .route('/calculatebrokerage')
    .post(estimate_ctrl.CalculateBrokerage)



module.exports = router