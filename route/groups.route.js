const express = require("express")
const router = express.Router()
const axios = require("axios")

router
    .route('/get-groups')
    .get( async (req, res) => {
        /**
         * In headers need to send @tradingauthorization , @userid
         * @tradingauthorization as the auth token.
         * @userid as the userId. ex: TABTREE03
         */

        if (!req.headers.tradingauthorization) {
            res.send({ 'status': 'error', 'msg': 'token not found' })
            return
        }

        if (!req.headers.userid) {
            res.send({ 'status': 'error', 'msg': 'userid not found' })
            return
        }

        let headersList = {
            "Authorization": req.headers.tradingauthorization,
            "Content-Type": "application/json; charset=utf-8"
        }

        // call get groups
        try {
            const getGroups = await axios.get(`${process.env.APIInteractiveURL}/enterprise/group?userID=${req.headers.userid}`, {
                headers: headersList
            });
            console.log('hii', getGroups.data.result)
            res.send({"status":"success", "msg": getGroups.data.result})

        } catch (error) {
            res.send({"status":"error", "msg": JSON.stringify(error)})
        }
    });

router
    .route('/get-symbol/:groupName')
    .get( async (req, res) => {
        /**
         * @groupName in route param used to get all symbols based on the term passsing through it.
         * In headers need to send @tradingauthorization , @userid
         * @tradingauthorization is has the auth token.
         * @userid is has the userId. ex: TABTREE03
         */

        if (!req.headers.tradingauthorization) {
            res.send({ 'status': 'error', 'msg': 'token not found' })
            return
        }

        if (!req.headers.userid) {
            res.send({ 'status': 'error', 'msg': 'userid not found' })
            return
        }

        let headersList = {
            "Authorization": req.headers.tradingauthorization,
            "Content-Type": "application/json; charset=utf-8"
        }

        // call get symbols using groupname
        try {
            const getGroups = await axios.get(`${process.env.APIInteractiveURL}/enterprise/group/symbols?userID=${req.headers.userid}&groupName=${req.params.groupName}`, {
                headers: headersList
            });

            res.send({"status":"success", "msg": getGroups.data.result})

        } catch (error) {
            res.send({"status":"error", "msg": JSON.stringify(error)})
        }
    });

module.exports = router