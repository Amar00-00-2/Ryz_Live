const express = require("express")
const router = express.Router()
const { hdfcBankController } = require("../controller")

router
    .route("/verifyUPI")
    .post(hdfcBankController.verify_UPI_fn)

router
    .route("/transactionRequest")
    .post(hdfcBankController.transaction_request_fn)

router
    .route("/")
    .post(hdfcBankController.fetchBankResponse)

router
    .route("/testCallBack")
    .post(hdfcBankController.testCallBack_fn)

module.exports = router