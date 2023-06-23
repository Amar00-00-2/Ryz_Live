const express = require('express')
const router = express.Router()
const { notificationController } = require("../controller") 

router
    .route("/getData/:userId")
    .get(notificationController.get_notification_fn)
    
router
    .route("/getCount/:userId")
    .get(notificationController.get_count_fn)

router
    .route("/makeRead/:id")
    .get(notificationController.update_read_fn)

router
    .route("/makeAllRead/:userId")
    .get(notificationController.update_readall_fn)

module.exports = router
