const express = require("express")
const router = express.Router()

router.use('/user', require('./user.route'))

router.use('/order', require('./interactive.route'))

router.use('/alert',require('./alert.route'))

router.use('/watchlist', require('./watchlist.route'))

router.use('/basket', require('./basket.route'))

router.use('/basket_order', require('./basket_order.route'))

router.use('/search', require('./search.route.building'))

router.use('/marketdataapi', require('./marketdata.route'))

router.use('/recentsearch', require('./recent_search.route'))

router.use('/payment', require('./payment.route'))

router.use('/gttorder', require('./gttorder.route'))

router.use('/referandearn', require('./referandearn.route'))

router.use('/financial', require('./financial.route'))

router.use('/freshdesk', require('./freshdesk.route'))

router.use('/groups', require('./groups.route'))

router.use('/upi', require('./hdfc.upi.route'))

router.use('/kycflow', require('./kycflow.route'))

router.use('/sip', require('./sip_route'))

router.use('/upload', require('./file_upload_route'))

router.use('/estimator', require('./estimate.route'))

router.use('/category',require('./category.route'))

router.use('/categorytype',require('./category_type.route'))

router.use('/scannerform',require('./scannerform.route'))

router.use('/notification', require('./notification_route'))

router.use('/testapi', require('./payment.route'))

router.use("/instruments", require("./instrumnets_sub_route.js"));

router.post('/', (req, res) =>{
    res.send('v1 control')
})

module.exports = router
