const { default: axios } = require('axios');
const express = require('express');
const router = express.Router();

router
    .route('/')
    .get( async (req, res) =>{

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

        try {
        // http://trd.gillbroking.com:3000/enterprise/orders/gttorderbook?clientID=TABTREE03&userID=TABTREE03
            const getGttOrders = await axios.get(`${process.env.APIInteractiveURL}/enterprise/orders/gttorderbook?clientID=${req.headers.userid}&userID=${req.headers.userid}`,{
                headers: headersList
            })
            res.send({"status":"success", 'msg': getGttOrders.data.description, result: getGttOrders.data.result})
        } catch(error) {
            res.send({"status":"error", 'msg': error.response.data.description})
        }

    })
    .post(async (req, res) =>{
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

        try {

            console.log('req.body', req.body)

            const getGttOrders = await axios.post(`${process.env.APIInteractiveURL}/enterprise/orders/gttorder`, req.body,{
                headers: headersList
            })
            res.send({"status":"success", 'msg': getGttOrders.data.description, result: getGttOrders.data.result})
        } catch(error) {
            res.send({"status":"error", 'msg': error.response.data.description})
        }

    })
    .put(async (req, res) =>{
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

        try {
            const getGttOrders = await axios.put(`${process.env.APIInteractiveURL}/enterprise/orders/gttorder`, req.body,{
                headers: headersList
            })
            res.send({"status":"success", 'msg': getGttOrders.data.description, result: getGttOrders.data.result})
        } catch(error) {
            res.send({"status":"error", 'msg': error.response.data.description})
        }
    })

router
    .route('/remove/:appOrderID/:exchangeSegment/:exchangeInstrumentID')    
    .delete(async (req, res) =>{

        // ?appOrderID=1317800042&clientID=SHASHANK&userID=SHASHANK23&exchangeSegment=NSECM&exchangeInstrumentID=11536

        if (!req.headers.tradingauthorization) {
            res.send({ 'status': 'error', 'msg': 'token not found' })
            return
        }

        if (!req.headers.userid) {
            res.send({ 'status': 'error', 'msg': 'userid not found' })
            return
        }

        if (!req.params.appOrderID) {
            res.send({ 'status': 'error', 'msg': 'appOrderID not found' })
            return
        }

        if (!req.params.exchangeSegment) {
            res.send({ 'status': 'error', 'msg': 'exchangeSegment not found' })
            return
        }

        if (!req.params.exchangeInstrumentID) {
            res.send({ 'status': 'error', 'msg': 'exchangeInstrumentID not found' })
            return
        }
    
        let headersList = {
            "Authorization": req.headers.tradingauthorization,
            "Content-Type": "application/json; charset=utf-8"
        }

        try {
            const getGttOrders = await axios.delete(`${process.env.APIInteractiveURL}/enterprise/orders/gttorder?appOrderID=${req.params.appOrderID}&clientID=${req.headers.userid}&userID=${req.headers.userid}&exchangeSegment=${req.params.exchangeSegment}&exchangeInstrumentID=${req.params.exchangeInstrumentID}`,{
                headers: headersList
            })
            res.send({"status":"success", 'msg': getGttOrders.data.description, result: getGttOrders.data.result})
        } catch(error) {
            res.send({"status":"error", 'msg': error.response.data.description})
        }

    })


module.exports = router
    


