const router = require("express").Router();
const { instrument_sub_ctrl } = require("../controller");

router.route("/subscription").post(instrument_sub_ctrl.subcribe);

router.route("/ocsubscription").post(instrument_sub_ctrl.ocsubcribe);

router.route("/subscription").put(instrument_sub_ctrl.unsubcribe);

router.route("/bhavcopy").post(instrument_sub_ctrl.bhavecopy);

router.route("/quotes").post(instrument_sub_ctrl.quotes);

router.route("/prevclose").post(instrument_sub_ctrl.prevclose);

router.route("/holdings").get(instrument_sub_ctrl.holdingsdata);

router.route("/positions").get(instrument_sub_ctrl.positiondata);

router.route("/indexlist/:segment").get(instrument_sub_ctrl.indexlistdata);

module.exports = router;
