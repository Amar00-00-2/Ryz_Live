const axios = require('axios');
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay')
const crypto = require("crypto");

// importing payin model to track the amount paid by the userId

// importing payout model to do same like above, but the differnce is instead of payin , we could get payout

const {PayinModel, PayoutModel} = require('../model')
  
verifyPayment = async (success) => {
    const hmac = crypto.createHmac('sha256', process.env.RZPSECRETKEY);
    hmac.update(success.razorpay_order_id + "|" + success.razorpay_payment_id);
    let generated_signature = hmac.digest('hex');
    if (generated_signature == success.razorpay_signature) {
      return true
    } else {
      return false
    }
  }

// this API is for, to get the payin which done by user using the USERID

router
    .route('/payin_list/:userId')
    .get( async (req, res) =>{
        // get all payin using the userId in the params
        const getPayin = await PayinModel.findAll({
            where:{
                userId: req.params.userId
            }
        })
        res.send(getPayin)
    })

// this is for to get PAYOUT list using userid
router
.route('/payout_list/:userId')
.get( async (req, res) =>{
    // get all payin using the userId in the params
    const getPayout = await PayoutModel.findAll({
        where:{
            userId: req.params.userId
        }
    })
    res.send(getPayout)
})


router
    .route('/createorder')
    .post( async (req, res) =>{
	const {amount,accountNumber,accountName,accountIfsc,clientCode}=req.body
        if (!amount) {
            res.send({ 'status': 'error', 'msg': 'enter amount' })
            return
        }
	try{
        var instance = new Razorpay({ key_id: process.env.RZPKEY, key_secret: process.env.RZPSECRETKEY })

        const getResponse = await instance.orders.create({
        amount: amount + "00",
        currency: "INR",
	bank_account:{
	  "account_number":accountNumber,
	  "name":accountName,
	  "ifsc":accountIfsc,
	  //"clientCode":clientCode
	}
        })
	getResponse.clientCode = clientCode
	console.log(getResponse)
	res.send(getResponse)
	}catch(error){
	console.log("Error....",error)
	//res.send(error)
	}
        //console.log(getResponse)

        //res.send(getResponse)
    })

router
    .route('/key')
    .get( async (req, res) =>{
        res.send(process.env.RZPKEY)
    })

router
    .route('/payin')
    .post( async (req, res) =>{

        if (!req.headers.userid) {
            res.send({ 'status': 'error', 'msg': 'userid not found' })
            return
        }
        if (!req.body.amount) {
            res.send({ 'status': 'error', 'msg': 'enter amount' })
            return
        }
        console.log(req.body)
        const success = req.body
        const hmac = crypto.createHmac('sha256', process.env.RZPSECRETKEY);
        hmac.update(success.razorpay_order_id + "|" + success.razorpay_payment_id);
        let generated_signature = hmac.digest('hex');
        if (!(generated_signature == success.razorpay_signature)) {
            res.send({ 'status': 'error', 'msg': 'payment verification failed' })
            return
        } else {

            // get admin token to do payin api
            const getAdmin = await axios.post(`${process.env.MainUrl}/backofficeapi/login`, {
                "userID": process.env.BOUSERID,
                "password": process.env.BOPASSWORD
            })

            const adminToken =  getAdmin.data.result.Token

            // call payin api using admin token 
            try {
            const payin = await axios.post(`${process.env.MainUrl}/backofficeapi/updatermslimit/rmsfields`, {
                "LoginId":"ADMIN",
                "ClientId":req.headers.userid,
                "NotionalCash":0,
//                "PayInAmout": Number(req.body.amount),
		 "PayInAmout":0,
                "PayOutAmout":0,
                "DirectCollatral":0,
                "AdhocAll":0,
                "AdhocCashNRML":0,
                "AdhocCashMIS":0,
                "AdhocFONRML":0,
                "AdhocFOMIS":0,
                "AdhocCURNRML":0,
                "AdhocCURMIS":0,
                "AdhocCOMNRML":0,
                "AdhocCOMMIS":0,
                "AdhocCashCNC":0,
                "IsIncrementValue":true,
                "RMSSegment":31,
                "RMSExchange":31,
                "RMSProduct":63
            }, {
                headers: {
                    Authorization: adminToken
                }
            })
            res.send({ 'status': 'success', 'msg': 'payin successs' })

            // after api made a success response then run this script to track payment with userid
            PayinModel.create({userId: req.headers.userid, amount: req.body.amount, paymentId: success.razorpay_payment_id,apiResponse: JSON.stringify(payin.data) })

            } catch(error) {
                console.log(error)
                res.send({ 'status': 'error', 'msg': error.response.data.description })
            } 
        }
    })

router
    .route('/payout')
    .post( async (req, res) =>{
        console.log("Payout Innnnnn");
        if (!req.headers.userid) {
            res.send({ 'status': 'error', 'msg': 'userid not found' })
            return
        }
        if (!req.body.amount) {
            res.send({ 'status': 'error', 'msg': 'enter amount' })
            return
        }
        // get admin token to do payin api
        // console.log(process.env.MainUrl);
        const getAdmin = await axios.post(`${process.env.MainUrl}/backofficeapi/login`, {
            "userID":process.env.BOUSERID,
            "password":process.env.BOPASSWORD
            })

        const adminToken =  getAdmin.data.result.Token
        try{
        // call payout api using admin token 
        const payout = await axios.post(`${process.env.MainUrl}/backofficeapi/updatermslimit/rmsfields`, {
            "LoginId":"ADMIN",
            "ClientId":req.headers.userid,
            "NotionalCash":0,
            "PayInAmout":0,
            "PayOutAmout": Number(req.body.amount),
            "DirectCollatral":0,
            "AdhocAll":0,
            "AdhocCashNRML":0,
            "AdhocCashMIS":0,
            "AdhocFONRML":0,
            "AdhocFOMIS":0,
            "AdhocCURNRML":0,
            "AdhocCURMIS":0,
            "AdhocCOMNRML":0,
            "AdhocCOMMIS":0,
            "AdhocCashCNC":0,
            "IsIncrementValue":true,
            "RMSSegment":31,
            "RMSExchange":31,
            "RMSProduct":63
        }, {
            headers: {
                Authorization: adminToken
            }
        })
	//const BackofzApi = await axios.get(`https://backoffice.gillbroking.com:8085/capexweb/capexweb/cap_getnscript?Requesttype=GetPaymentRequest&userid=${req.headers.userid}&reqamt=${Number(req.body.amount)}`)
        res.send({ 'status': 'success', 'msg': payout.data })
        PayoutModel.create({userId: req.headers.userid, amount: req.body.amount, paymentId: ('PO'+Date.now()),apiResponse: JSON.stringify(payout.data) })

        } catch(error) {
            console.log(error.message)
            res.send({ 'status': 'error', 'msg': error.message})
        }
    })

router
    .route('/payout_status')
    .post( async (req, res) =>{

        if (!req.headers.userid) {
            res.send({ 'status': 'error', 'msg': 'userid not found' })
            return
        }
        const getAdmin = await axios.post(`${process.env.MainUrl}/backofficeapi/login`, {
            "userID": process.env.BOUSERID,
            "password": process.env.BOPASSWORD
        })

        const adminToken =  getAdmin.data.result.Token
        console.log('adminToken', adminToken)
        // get the payout transaction list from the backoffice
        try {
            const payin = await axios.get(`${process.env.MainUrl}/backofficeapi/updatermslimit/updatepayoutstatus?source=WEB&userID
            =${req.headers.userid}&accountID=${req.headers.userid}`,{
                headers: {
                    Authorization: adminToken
                }
            })
            console.log('payin', payin.data)
            res.send({ 'status': 'success', 'msg': payin.data })
        } catch (error) {
            console.log('payin', error.response.data)
            res.send({ 'status': 'error', 'msg': error.response.data.description })
        }

    })

 

module.exports = router

    


