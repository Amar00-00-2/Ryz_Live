const express = require("express")
const router = express.Router()
const { userController } = require('../controller')
const axios = require('axios')

const { globalexchangesegment } = require('../config')

const moment = require('moment')

router
    .route('/create_order')
    .post(async (req, res) => {
        // res.send()
        console.log(req.headers)
        if (!req.headers.tradingauthorization) {
            res.send({ 'status': 'error', 'msg': 'token not found' })
            return
        }

        let headersList = {
            "Authorization": req.headers.tradingauthorization,
            "Content-Type": "application/json; charset=utf-8"
        }
        console.log(req.body)

        try {
            const getOrders = await axios.post(`${process.env.APIInteractiveURL}/enterprise/orders`, req.body, {
                headers: headersList
            })
            res.send({ 'status': 'success', 'msg': getOrders.data })
        } catch (e) {
            console.log(e.response.data)
            res.send({ 'status': 'error', 'msg': e.response.data.description })

        }
    })

/**
 * API to place the Bracket order
 */
router
    .route('/create_bracket_order')
    .post(async (req, res) => {
        // Validate wheather authorization token is available in header
        // If authorization header not available return error response and exit the function
        if (!req.headers.tradingauthorization) {
            res.send({ 'status': 'error', 'msg': 'token not found' })
            return
        }

        let headersList = {
            "Authorization": req.headers.tradingauthorization,
            "Content-Type": "application/json; charset=utf-8"
        }
        console.log(req.body)
        /**
         * symphony api call to place the bracket order.
         */
        try {
            // Developer API URL :  https://developers.symphonyfintech.in/interactive/enterprise/orders/bracket
            const placeBracketOrder = await axios.post(`${process.env.APIInteractiveURL}/enterprise/orders/bracket`, req.body, {
                headers: headersList
            })
            res.send({ 'status': 'success', 'msg': placeBracketOrder.data })
        } catch (e) {
            console.log('boooorder',e.response.data)
            res.send({ 'status': 'error', 'msg': e.response.data.description })
        }
    });

/**
 * API to place the Cover order
 */
router
    .route('/create_cover_order')
    .post(async (req, res) => {
        // Validate wheather authorization token is available in header
        // If authorization header not available return error response and exit the function
        if (!req.headers.tradingauthorization) {
            res.send({ 'status': 'error', 'msg': 'token not found' })
            return
        }

        let headersList = {
            "Authorization": req.headers.tradingauthorization,
            "Content-Type": "application/json; charset=utf-8"
        }
        console.log(req.body)

        /**
         * symphony api call to place the cover order.
         */
        try {
            // Developer API URL : https://developers.symphonyfintech.in/interactive/enterprise/orders/cover
            const placeCoverOrder = await axios.post(`${process.env.APIInteractiveURL}/enterprise/orders/cover`, JSON.stringify(req.body), {
                headers: headersList
            })
            res.send({ 'status': 'success', 'msg': placeCoverOrder.data })
        } catch (e) {
            console.log(e.response.data)
            res.send({ 'status': 'error', 'msg': e.response.data.description })
        }
    });


router
    .route('/get_open')
    .get(async (req, res) => {
        console.log(req.headers)
        try {
            console.log(`${process.env.APIInteractiveURL}/enterprise/orders?clientID=${req.headers.userid}&userID=${req.headers.userid}`)
            const getAllOrders = await axios.get(`${process.env.APIInteractiveURL}/enterprise/orders?clientID=${req.headers.userid}&userID=${req.headers.userid}`, {
                headers: {
                    Authorization: req.headers.tradingauthorization
                }
            })
            const getOrders = await getAllOrders.data.result.filter(x => (x.OrderStatus != 'PartiallyFilled' && x.OrderStatus != 'Filled'))

            const instruments = await getOrders.map((x) => {
                return {
                    "exchangeSegment": globalexchangesegment[x.ExchangeSegment],
                    "exchangeInstrumentID": x.ExchangeInstrumentID
                }
            })

            const getOrdersall = await axios.post(`${process.env.APIMarketDataURL}/search/instrumentsbyid`, {
                "source": "WebAPI",
                "UserID": "guest",
                "instruments": instruments
            }, {
                headers: {
                    Authorization: req.headers.marketauthorization
                }
            })
            await getOrders.sort((a, b) => parseFloat(a.AppOrderID) - parseFloat(b.AppOrderID));
            // socket.emit('load_orders', {orders: getOrders.data.result, segments: getOrdersall.data.result})
            res.send({ orders: getOrders, segments: getOrdersall.data.result })

        } catch (error) {
            console.log(error.response.data)
            res.send({ "status": "error", orders: [], segments: [] })
        }

    })

router
    .route('/get_executed')
    .get(async (req, res) => {
        try {
            // const getAllOrders = await axios.get(`${process.env.APIInteractiveURL}/enterprise/orders/trades`, {
            //     headers: {
            //         Authorization: req.headers.tradingauthorization
            //     }
            // })
            const getAllOrders = await axios.get(`${process.env.APIInteractiveURL}/enterprise/orders?clientID=${req.headers.userid}&userID=${req.headers.userid}`, {
                headers: {
                    Authorization: req.headers.tradingauthorization
                }
            })
            console.log('getAllOrdersgetAllOrders', getAllOrders)
            const getOrders = getAllOrders.data.result.filter(function (a) {
                if (a.OrderStatus == 'PartiallyFilled' || a.OrderStatus == 'Filled') {
                    var key = a.AppOrderID;
                    if (!this[key]) {
                        this[key] = true;
                        return true;
                    }
                } else {
                    return false
                }

            }, Object.create(null));
            const instruments = await getOrders.map((x) => {
                return {
                    "exchangeSegment": globalexchangesegment[x.ExchangeSegment],
                    "exchangeInstrumentID": x.ExchangeInstrumentID
                }
            })

            const getOrdersall = await axios.post(`${process.env.APIMarketDataURL}/search/instrumentsbyid`, {
                "source": "WebAPI",
                "UserID": "TEST140",
                "instruments": instruments
            }, {
                headers: {
                    Authorization: req.headers.marketauthorization
                }
            })

            await getOrders.sort((a, b) => (parseFloat(a.AppOrderID) - parseFloat(b.AppOrderID)) || (parseFloat(a.CumulativeQuantity) - parseFloat(b.CumulativeQuantity)));

            res.send({ orders: getOrders, segments: getOrdersall.data.result })
        } catch (error) {
//            console.log(error.response.data.result.errors)
	    console.log("error",error)
            res.send({ "status": "error", orders: [], segments: [] })
        }
    })

/**
 * Modify Order Entry
 */
router
    .route('/modify_order')
    .put(async (req, res) => {
        // res.send()
        console.log(req.headers)
        if (!req.headers.tradingauthorization) {
            res.send({ 'status': 'error', 'msg': 'token not found' })
            return
        }

        let headersList = {
            "Authorization": req.headers.tradingauthorization,
            "Content-Type": "application/json; charset=utf-8"
        }
        console.log(req.body)

        try {
            const getOrders = await axios.put(`${process.env.APIInteractiveURL}/enterprise/orders`, req.body, {
                headers: headersList
            })
            res.send({ 'status': 'success', 'msg': getOrders.data })
        } catch (e) {
            console.log(e.response.data)
            if(e.response.data.description == 'Bad Request') {
                let errors = ''
                e.response.data.result.errors.map((x) =>{
                    console.log(x)
                    errors += x.messages[0]
                })
                res.send({ 'status': 'error', 'msg': errors })
            } else {
                res.send({ 'status': 'error', 'msg': e.response.data.description })
            }

        }
    })

/**
 * Delete Order Entry
 */
router
    .route('/delete_order')
    .delete(async (req, res) => {
        // res.send()
        console.log(req.headers)
        if (!req.headers.tradingauthorization) {
            res.send({ 'status': 'error', 'msg': 'token not found' })
            return
        }

        let headersList = {
            "Authorization": req.headers.tradingauthorization,
            "Content-Type": "application/json; charset=utf-8"
        }
        console.log(req.body)

        try {
            console.log(`${process.env.APIInteractiveURL}/enterprise/orders?appOrderID=${req.headers.orderid}&clientID=${req.headers.userid}&userID=${req.headers.userid}`)
            const getOrders = await axios.delete(`${process.env.APIInteractiveURL}/enterprise/orders?appOrderID=${req.headers.orderid}&clientID=${req.headers.userid}&userID=${req.headers.userid}`, {
                headers: headersList
            })
            res.send({ 'status': 'success', 'msg': getOrders.data })
        } catch (e) {
            console.log(e.response.data)
            res.send({ 'status': 'error', 'msg': e.response })

        }
    })


/**
 * Modify Bracket Order
 */
router
    .route('/modify_bracket_order')
    .put(async (req, res) => {
        // res.send()
        console.log(req.headers)
        if (!req.headers.tradingauthorization) {
            res.send({ 'status': 'error', 'msg': 'token not found' })
            return
        }

        let headersList = {
            "Authorization": req.headers.tradingauthorization,
            "Content-Type": "application/json; charset=utf-8"
        }
        console.log(req.body)

        try {
            const getOrders = await axios.put(`${process.env.APIInteractiveURL}/enterprise/orders/bracket`, req.body, {
                headers: headersList
            })
            res.send({ 'status': 'success', 'msg': getOrders.data })
        } catch (e) {
            console.log(e.response.data)
            res.send({ 'status': 'error', 'msg': e.response })

        }
    })

/**
 * Delete Bracket Order
 */
 router
 .route('/delete_bracket_order')
 .delete(async (req, res) => {
     // res.send()
     console.log(req.headers)
     if (!req.headers.tradingauthorization) {
         res.send({ 'status': 'error', 'msg': 'token not found' })
         return
     }

     let headersList = {
         "Authorization": req.headers.tradingauthorization,
         "Content-Type": "application/json; charset=utf-8"
     }
     console.log(req.body)

     try {
         const getOrders = await axios.delete(`${process.env.APIInteractiveURL}/enterprise/orders/bracket?appOrderID=${req.headers.orderid}&clientID=${req.headers.userid}&userID=${req.headers.userid}`, {
             headers: headersList
         })
         res.send({ 'status': 'success', 'msg': getOrders.data })
     } catch (e) {
         console.log(e.response.data)
         res.send({ 'status': 'error', 'msg': e.response })

     }
 })

/**
 * Delete Cover Order
 */
router
    .route('/delete_cover_order')
    .put(async (req, res) => {
        // res.send()
        console.log(req.headers)
        if (!req.headers.tradingauthorization) {
            res.send({ 'status': 'error', 'msg': 'token not found' })
            return
        }

        let headersList = {
            "Authorization": req.headers.tradingauthorization,
            "Content-Type": "application/json; charset=utf-8"
        }
        console.log(req.body)

        try {
            const deleteCoverOrder = await axios.put(`${process.env.APIInteractiveURL}/enterprise/orders/cover`,req.body, {
                headers: headersList
            })
            res.send({ 'status': 'success', 'msg': deleteCoverOrder.data })
        } catch (e) {
            console.log(e.response.data)
            res.send({ 'status': 'error', 'msg': e.response })

        }
    })


// Get Client or User balance API
router
.route('/get_balance')
.get(async (req, res) => {
//    console.log('get_balance',req.headers)
    if (!req.headers.tradingauthorization) {
        res.send({ 'status': 'error', 'msg': 'token not found' })
        return
    }

    let headersList = {
        "Authorization": req.headers.tradingauthorization,
        "Content-Type": "application/json; charset=utf-8"
    }

    try {
        const getBalance = await axios.get(`${process.env.APIInteractiveURL}/enterprise/user/balance?clientID=${req.headers.userid}&userID=${req.headers.userid}`, {
            headers: headersList
        })
//        console.log('getBalance.data.result.BalanceList', getBalance.data)
        res.send({ 'status': 'success', 'msg': getBalance.data.result.BalanceList })
    } catch (e) {
        console.log(e)
        res.send({ 'status': 'error', 'msg': e.message })
    }
})

// postion conversion api

// URL:http://192.168.52.28:3000/enterprise/portfolio/positions/convert

router
.route('/position_convert')
.post(async (req, res) => {
//    console.log('tradingauthorization',req.headers.tradingauthorization)
    if (!req.headers.tradingauthorization) {
        res.send({ 'status': 'error', 'msg': 'token not found' })
        return
    }

    let headersList = {
        "Authorization": req.headers.tradingauthorization,
        "Content-Type": "application/json; charset=utf-8"
    }

    try {
//        console.log(`${process.env.APIInteractiveURL}/enterprise/portfolio/positions/convert`,req.body, {
//            headers: headersList
//        })
        const getBalance = await axios.put(`${process.env.APIInteractiveURL}/enterprise/portfolio/positions/convert`,req.body, {
            headers: headersList
        })
        res.send({ 'status': 'success', 'msg': getBalance.data.description })
    } catch (e) {
        console.log(e.response.data)
        res.send({ 'status': 'error', 'msg': e.response.data.description })
    }
})

// postion square off api

// URL:http://192.168.52.28:3000/enterprise/portfolio/positions/squareoff

router
.route('/position_squareoff')
.post(async (req, res) => {
//    console.log('get_balance',req.headers)
    if (!req.headers.tradingauthorization) {
        res.send({ 'status': 'error', 'msg': 'token not found' })
        return;
    }

    let headersList = {
        "Authorization": req.headers.tradingauthorization,
        "Content-Type": "application/json; charset=utf-8"
    }

    try {
        const getBalance = await axios.put(`${process.env.APIInteractiveURL}/enterprise/portfolio/positions/squareoff`, req.body, {
            headers: headersList
        })
        res.send({ 'status': 'success', 'msg': getBalance.data.description })
    } catch (e) {
        console.log(e.response.data)
        res.send({ 'status': 'error', 'msg': e.response.data.description })
    }
})


// this is api to get the order history for a certain orderid

// doc url : http://103.69.170.23:80/enterprise/orders?appOrderID=1200029345&clientID=ON1037&userID=O
router
    .route('/order_history/')
    .post( async (req, res) =>{
        if (!req.headers.tradingauthorization) {
            res.send({ 'status': 'error', 'msg': 'token not found' })
            return;
        }
        console.log(' req.headers.tradingauthorization',  req.headers.tradingauthorization)
        let headersList = {
            "Authorization": req.headers.tradingauthorization,
            "Content-Type": "application/json; charset=utf-8"
        }

        if (!req.body.AppOrderID) {
            res.send({ 'status': 'error', 'msg': 'AppOrderID is required' })
            return;
        }

        if (!req.body.userId) {
            res.send({ 'status': 'error', 'msg': 'userId is required' })
            return;
        }

        try {
            const getOrderHistory = await axios.get(`${process.env.APIInteractiveURL}/enterprise/orders?appOrderID=${req.body.AppOrderID}&clientID=${req.body.userId}&userID=${req.body.userId}`, {
                headers: headersList
            })
            res.send({ 'status': 'success', 'msg': getOrderHistory.data.result })
        } catch (e) {
            console.log(e.response.data)
            res.send({ 'status': 'error', 'msg': e.response.data.description })
        }

    })

// http://trd.gillbroking.com:3000/enterprise/instruments/cobopercentage?userID=Shashank23&exchangeSegment=NSECM&exchangeInstrumentID=2277

// api used to get co & bo percentage, with co percentage in front need to calculate high and low price band using LTP
router
    .route('/cobopercentage')
    .post( async (req, res) =>{
        if (!req.headers.tradingauthorization) {
            res.send({ 'status': 'error', 'msg': 'token not found' })
            return;
        }
        console.log(' req.headers.tradingauthorization',  req.headers.tradingauthorization)
        let headersList = {
            "Authorization": req.headers.tradingauthorization,
            "Content-Type": "application/json; charset=utf-8"
        }

        if (!req.body.exchangeInstrumentID) {
            res.send({ 'status': 'error', 'msg': 'exchangeInstrumentID is required' })
            return;
        }

        if (!req.body.exchangeSegment) {
            res.send({ 'status': 'error', 'msg': 'exchangeSegment is required' })
            return;
        }

        if (!req.body.userId) {
            res.send({ 'status': 'error', 'msg': 'userId is required' })
            return;
        }

        try {
            const getcoboPercentage = await axios.get(`${process.env.APIInteractiveURL}/enterprise/instruments/cobopercentage?userID=${req.body.userId}&exchangeSegment=${req.body.exchangeSegment}&exchangeInstrumentID=${req.body.exchangeInstrumentID}`, {
                headers: headersList
            })
            res.send({ 'status': 'success', 'msg': getcoboPercentage.data.result })
        } catch (e) {
            console.log(e.response.data)
            res.send({ 'status': 'error', 'msg': e.response.data.description })
        }

    })

module.exports = router
