const { userModel, ClientIdWithMobileNoModel, marketStatusModel, notificationModel } = require('../model')
const watchlistController = require('./watchlist.controller')
const basketController = require('./basket.controller')
const https = require('https');
const axios = require('axios')
const moment =require('moment')
const {redisclient,client,Indexneworexistingcolection,Stockneworexistingcolection,Currenciesfutneworexistingcolection,Currenciesoptneworexistingcolection,Commodityfuteworexistingcolection,Commodityoptneworexistingcolection} = require('../config');
const { resolveSoa } = require('dns');
const {Op, where} = require("sequelize");
const { OptionIndexCollection, OptionStocksCollection,CurrenciesFutureCollection,CurrenciesOptionCollection,CommodityFutureCollection,CommodityOptionCollection } = require('../typesense/scanner');
var XTSInteractiveWS = require('xts-interactive-api').WS
var XtsMarketDataWS = require('xts-marketdata-api').WS;

const agent = new https.Agent({  
    rejectUnauthorized: false
  });

const marketdatakeys = {
    'TABTREE01': {
        "secretKey": "Pgso473@2M",
        "appKey": "9a8f8cc3bdbcc6188b1103",
        "source": "WEBAPI"
    },
    'TABTREE02': {
        "secretKey": "Yjjp526@iJ",
        "appKey": "49fdf750ebb422f8cfe768",
        "source": "WEBAPI"
    },
    'TABTREE03': {
        "secretKey": "Nkky127@18",
        "appKey": "dc8c2d52b8fcde1a11a519",
        "source": "WEBAPI"
    },
}

module.exports = {
    profile_pic_fn: async (req, res) => {
        try {
            const updateProfilePic = await userModel.update({
                profile_pic: req.body.imageLink
            }, {
                where: [{name: req.body.userId}]
            })
            return res.json({status: 'success', result: updateProfilePic })
        } catch (error) {
            return res.json({status: 'failed', message: error.message })
        }
    },
    get_user_details_fn: async (req, res) => {
        try {
            const checkUser = await userModel.count({
                where: [{ name: req.params.userId }]
            })
            if(checkUser > 0) {
                const getUserDetails = await userModel.findOne({
                    where: [{name: req.params.userId}]
                })
                res.json({status: 'success', result: getUserDetails })
            } else {
                const insertUserDetails = await userModel.create({
                    name: req.params.userId,
                    fingerprint: 0 
                })
                console.log('insertUserDetails', insertUserDetails)
                res.json({status: 'success', result: insertUserDetails })
            }
        } catch (error) {
            res.json({status: 'failed', message: error.message })
        }
    },
    fingerprint_status_fn: async (req, res) => {
	console.log("sTr",req.headers)
        try {
            const checkUser = await userModel.count({
                where: [{ name: req.body.userId }]
            })
            console.log('checkUser', checkUser)
            if(checkUser > 0) {
                const updateUser = await userModel.update({
                    fingerprint: req.body.fingerprintStatus
                }, {
                    where: [{name: req.body.userId}]
                })
                return res.json({ status: "success", message: "fingerprint status updated", result: updateUser })
            } else {
                const insertUser = await userModel.create({
                    name: req.body.userId,
                    fingerprint: req.body.fingerprintStatus
                })
                return res.json({ status: "success", message: "fingerprint status inserted", result: insertUser })
            }
        } catch (error) {
            return res.json({ status: "failed", message: error.message })
        }
    },
    firebase_user_fn: async (req, res) => {
	var ref = req.header('Referer');
	console.log("Immmm",ref);
        try {
            const checkToken = await userModel.count({
                where: [{ name: req.body.userId }]
                // attributes: ['firebase_token']
            })
            console.log('checkToken', checkToken)
            if(checkToken > 0) {
                const updateUser = await userModel.update({
                    firebase_token: req.body.firebaseToken
                }, {
                    where: [{name: req.body.userId}]
                })
                return res.json({ status: "success", message: "token updated", result: updateUser })
            } else {
                const insertUser = await userModel.create({
                    name: req.body.userId,
                    firebase_token: req.body.firebaseToken
                })
                return res.json({ status: "success", message: "token inserted", result: insertUser })
            }
        } catch (error) {
            return res.json({ status: "failed", message: error.message })
        }
    },
    getUserId: async (userId) => {
        const getUserId = userId.toUpperCase()

        // check the userId is in the table
        const CheckUserId = await ClientIdWithMobileNoModel.findOne({where: {
            [Op.or]: [
                {MobileNumber: getUserId},
                {ClientId: getUserId}
            ]
        }})
        let UserID = getUserId.toUpperCase()
       
        if(CheckUserId) {
            console.log("user is login with clientid or mobile number", CheckUserId)
            UserID = CheckUserId.ClientId.toUpperCase()
        } else {
            // return res.json({ status: false, 'msg': 'user doesn\'t exist '})
        }
        return UserID
    },
    users: async (req, res) => {
        const getUsers = await userModel.findAll()
        res.send(getUsers)
    },
    userCreate: async (req, res) => {
        const createuser = await userModel.create(req.body)
        if (createuser) {
            res.json({ status: true, 'msg': 'created successfully' })
        } else {
            res.json({ status: false, 'msg': 'something went wrong' })
        }
    },
    userAuth: async (req, res) => {
        let headersList = {
            "Content-Type": "application/json"
        }
	var ref = req.header('Referer');
        console.log("Meeee",ref)
        try {
	    console.log("Inn")
            const UserID = await module.exports.getUserId(req.body.userID)
            req.body.userID = UserID

            const response = await axios.post(`${process.env.APIInteractiveURL}/enterprise/auth/validateuser`, req.body, {
                headers: headersList
            })
		console.log('response_user',response.data)
    
            const checkHasKey = await redisclient.exists(UserID)
            if(checkHasKey) {
		const getresponse = await redisclient.get(UserID)
                const jsondata = JSON.parse(getresponse)
		console.log("Inn",jsondata)
                if(jsondata.resetpass) {
                    return res.json({ status: true, 'msg': 'successfully logged in', resetpass:true })
                } else {
                    return res.json({ status: true, 'msg': 'successfully logged in', resetpass:false })
                }
            } else {
                return res.json({ status: true, 'msg': 'successfully logged in', resetpass:false })
            }

        }catch (error) {
            console.log('error.response.data', error.response.data.description)
            if(error?.response?.data?.code) {
                let message = 'invalid pin'
                if(error.response.data.code == 'e-login-0006') {
                    message = 'Access Denied. User is Blocked.'
                } else {
		
                    message = error.response.data.description
                }
                return res.json({'status':false, msg: message})
            } else {
                return res.json({'status':false, msg: 'invalid username or password'})
            }
        }
    },

    userForgotPassword: async (req, res) => {
        let headersList = {
            "Content-Type": "application/json"
        }
        try {
            const response = await axios.post(`${process.env.APIInteractiveURL}/enterprise/auth/forgotpassword`, req.body, {
                headers: headersList
            })

            await redisclient.set(req.body.userID.toUpperCase(), JSON.stringify({'resetpass': true}))

            return res.json({ status: true, 'msg': response.data.description })
        }catch (error) {
            console.log(error)
            return res.json({ status: false, 'msg': 'invalid credentials' })
        }
    },

    userUnblock: async (req, res) => {
        let headersList = {
            "Content-Type": "application/json"
        }
        try {
            const response = await axios.post(`${process.env.APIInteractiveURL}/enterprise/auth/unblockuser`, req.body, {
                headers: headersList
            })

            await redisclient.set(req.body.userID.toUpperCase(), JSON.stringify({'resetpass': true}))

            return res.json({ status: true, 'msg': response.data.description })
        }catch (error) {
            console.log(error)
            return res.json({ status: false, 'msg': 'invalid credentials' })
        }
    },

    userForgotPin: async (req, res) => {
        let headersList = {
            "Content-Type": "application/json"
        }
        try {
            const response = await axios.post(`${process.env.APIInteractiveURL}/enterprise/auth/forgotpin`, req.body, {
                headers: headersList
            })

            await redisclient.set(req.body.userID.toUpperCase(), JSON.stringify({'resetpin': true}))

            return res.json({ status: true, 'msg': response.data.description })
        }catch (error) {
            console.log(error)
            return res.json({ status: false, 'msg': 'invalid credentials' })
        }
    },

    userSetPin: async (req, res) => {
        let headersList = {
            "Content-Type": "application/json"
        }
        try {
            const response = await axios.post(`${process.env.APIInteractiveURL}/enterprise/auth/setpin`, req.body, {
                headers: headersList
            })

            const userID = req.body.userID.toUpperCase()

            await redisclient.del(userID)

            // const marketdatasession = await module.exports.getMarketDataSession(userID)

            const getClientData = await module.exports.getClientData(response.data.result.token, userID)

            const watchlistdata = await watchlistController.getWatchList(userID)

            const basketdata = await basketController.getBasket(userID)

            res.json({ status: true, 'msg': 'pin set successfully', data: { tradingclientsession: response.data.result.token, marketdataclientsession: response.data.result.token, clientdata: getClientData, watchlistdata, basketdata } })
        }catch (error) {
            console.log(error)
            return res.json({ status: false, 'msg': 'something went wrong' })
        }
    },

    getPinCheck: async (checkdata) => {
        let headersList = {
            "Content-Type": "application/json"
        }
        try {
            const response = await axios.post(`${process.env.APIInteractiveURL}/enterprise/auth/validatepin`, checkdata, {
                headers: headersList
            })
            return {'status':true, token: response.data.result.token, result: response.data.result}
        }catch (error) {
            console.log(error.response)
            if(error.response.data.code) {
                let message = 'invalid pin'
                if(error.response.data.code == 'e-login-0006') {
                    message = 'Access Denied. User is Blocked.'
                } else {
                    message = error.response.data.description
                }
                return {'status':false, msg: message}
            } else {
                return {'status':false, msg: 'invalid pin'}
            }
        }
       
    },
    getMarketDataSession: async (userid) => {
        const userID = userid.toUpperCase()
        let headersList = {
            "Content-Type": "application/json"
        }

        try {
            const response = await axios.post(`${process.env.APIMarketDataURL}/auth/login`, marketdatakeys[userID], {
                headers: headersList
            })
            return response.data.result.token
        } catch (error) {
            console.log(error)
        }
    },
    userProfileData: async (req, res) => {
        let headersList = {
            "Content-Type": "application/json",
            "Authorization": req.headers.authorization
        }
        try {
            const response = await axios.get(`${process.env.APIInteractiveURL}/enterprise/user/profile?clientID=${req.headers.userID}&userID=${req.headers.userID}`, {
                headers: headersList
            })
            return response.data.result
        } catch (e) {
            console.log('getClientData ',e.response.data)
        }
    },
    getClientData: async (token, userID) => {
        let headersList = {
            "Content-Type": "application/json",
            "Authorization": token
        }
        try {
            const response = await axios.get(`${process.env.APIInteractiveURL}/enterprise/user/profile?clientID=${userID}&userID=${userID}`, {
                headers: headersList
            })
            return response.data.result
        } catch (e) {
            console.log('getClientData ',e.response.data)
        }
    },
    userPinAuth: async function (req, res) {
        console.log('sarologinreq', req.body)
        const userId = await module.exports.getUserId(req.body.userID)
        req.body.userID = userId
        const tradingsession = await module.exports.getPinCheck(req.body)
        console.log('sssssssssss', tradingsession)
        if (tradingsession.status) {

            // const marketdatasession = await module.exports.getMarketDataSession(userId)

            const getClientData = await module.exports.getClientData(tradingsession.token, userId)

            const watchlistdata = await watchlistController.getWatchList(userId)

            const basketdata = await basketController.getBasket(userId)

            const checkHasKey = await redisclient.exists(userId)

            // Market Status Event  - START//
            xtsMarketDataWS = new XtsMarketDataWS(process.env.APIMarketDataURL);
            var socketInitRequest = {
            userID: tradingsession.result.userID,
            publishFormat: 'JSON',
            broadcastMode: 'Full',
            token: tradingsession.result.token, // Token Generated after successful LogIn
            };
            xtsMarketDataWS.init(socketInitRequest);

            xtsMarketDataWS.onExchangeTradingStatus(async (tradingStatus) => {
                console.log('marketStatus', tradingStatus);
                const tradingJson = JSON.stringify(tradingStatus)

                const insertMarketStatus = await marketStatusModel.create({
                    exchange_segment: tradingStatus.ExchangeSegment,
                    exchange_instrument_id: tradingStatus.ExchangeInstrumentID,
                    market_type: tradingStatus.maketType,
                    message: tradingStatus.message,
                    trading_session: tradingStatus.tradingSession,
                    status_json: tradingJson
                })
            });
            // Market Status Event  - END//

            // Trade Interactive Socket -START //
            xtsInteractiveWS = new XTSInteractiveWS(process.env.APIInteractiveURL);
            var socketInitRequest = {
            userID: tradingsession.result.userID,
            token: tradingsession.result.token, // Token Generated after successful LogIn
            };
            xtsInteractiveWS.init(socketInitRequest);

            // xtsInteractiveWS.onOrder(async (orderData) => {
            //     console.log('saroorder', orderData);
            //     const firebase = require('../config/firebase_config')
            //     const LoginID = orderData.LoginID
            //     const AppOrderID = orderData.AppOrderID
            //     const OrderStatus = orderData.OrderStatus
            //     const getUserFirebaseToken = await userModel.findOne({
            //     where: [{name: LoginID}],
            //     attributes: ['firebase_token']
            //     })
            //     var fbToken = getUserFirebaseToken.dataValues.firebase_token
            //     // var fbToken = "cPRCYYi3SF6uIgsDaaXpwR:APA91bGa2o_LcfKtPG-u1CNAW2jJAxJu8y_PewqN0DZEU5XH2vK9qyOfIw1qOwsAibIe-nExJ8PvOFIXILZuFMA_ziw4d9ZvbuHPSEyatUUEu5c_YxrbJ18O5pzc-NErwlSbHfCUCcBM"
            //     const fbData = {
            //         notification_to_fbid: `${fbToken}`, 
            //         notification_subject: 'Order Event', 
            //         notification_message: `Hi ${LoginID}, Your order staus changed - OrderId: ${AppOrderID}, Status:  ${OrderStatus}`
            //     }
            //     await firebase.sendFirebaseNotifcation(fbData)
            // });
            xtsInteractiveWS.onTrade(async (TradeData) => {
                console.log('saroTrade', TradeData);
                const firebase = require('../config/firebase_config')
                const LoginID = TradeData.LoginID
                const AppOrderID = TradeData.AppOrderID
                const OrderStatus = TradeData.OrderStatus

                const getUserFirebaseToken = await userModel.findOne({
                    where: [{name: LoginID}],
                    attributes: ['firebase_token']
                })
                var fbToken = getUserFirebaseToken.dataValues.firebase_token
                const fbData = {
                    notification_to_fbid: `${fbToken}`, 
                    notification_subject: 'Trade Event', 
                    notification_message: `Hi ${LoginID}, Your order has been executed - OrderId: ${AppOrderID}, Status:  ${OrderStatus}`
                }
                await firebase.sendFirebaseNotifcation(fbData)

                // insert notification into the notification Table//

                const insertNotification = await notificationModel.create({
                    user_id: LoginID,
                    subject: fbData.notification_subject,
                    content: fbData.notification_message
                })
            });
            // Trade Interactive Socket -END //

            res.json({ status: true, 'msg': 'loggedin successfully', data: { tradingclientsession: tradingsession.token, marketdataclientsession: tradingsession.token, clientdata: getClientData, watchlistdata, basketdata, result:tradingsession.result } })
	    try{
                const RedisStoredDate=await redisclient.get("Scanner")
                //Add Five minutes to the Previous Redis Time
                finaldate = moment(RedisStoredDate ,'DD-MM-YYYY HH:mm').add(5,'minutes').format("DD-MM-YYYY HH:mm");
                console.log("\n");
                console.log(`*** Five Minutes Added Date ${finaldate} ***`)
                console.log("\n");
                if(moment().format("DD-MM-YYYY HH:mm")>=finaldate){
                    console.log("*** Redis If Inn ***");
                    console.log("\n");
                    console.log("***Scanner Gainers Inn***");
                    console.log("\n");
                    await redisclient.set("Scanner", moment().format("DD-MM-YYYY HH:mm"))
                    await OptionIndexCollection(tradingsession.token)
                    await OptionStocksCollection(tradingsession.token)
                    await CurrenciesFutureCollection(tradingsession.token)
                    await CurrenciesOptionCollection(tradingsession.token)
                    await CommodityFutureCollection(tradingsession.token)
                    await CommodityOptionCollection(tradingsession.token)
                }
                if(RedisStoredDate==null){
                    console.log("*** Redis Else Inn ***");
                    console.log("\n");
                    await redisclient.set("Scanner", moment().format("DD-MM-YYYY HH:mm"))
                    await OptionIndexCollection(tradingsession.token)
                    await OptionStocksCollection(tradingsession.token)
                    await CurrenciesFutureCollection(tradingsession.token)
                    await CurrenciesOptionCollection(tradingsession.token)
                    await CommodityFutureCollection(tradingsession.token)
                    await CommodityOptionCollection(tradingsession.token)
                }
            }catch(err){
                console.log("***Scanner Collection Error***");
                console.log("\n");
                console.log(err);
            }
        } else {
            res.json(tradingsession)
        }
    },
    changepassword: async (req, res) => {
        if(!req.headers.authorization) {
            return res.send({ status: false, 'msg': 'token not found' })
        }
        let headersList = {
            "Content-Type": "application/json",
            "Authorization": req.headers.authorization
        }
        console.log('saroHeader', req.headers)
        try {
            const response = await axios.post(`${process.env.APIInteractiveURL}/enterprise/auth/changepassword`, req.body, {
                headers: headersList
            })
            console.log('responseSaro', req.body)
            const userID = req.body.userID.toUpperCase()

            await redisclient.del(userID)

            return res.json({ status: true, 'msg': response.data.description })

        }catch (error) {
            console.log('errorsaro', error)
            return res.json({ status: false, 'msg': error.response.data.description })
        }
    },
    changepin: async (req, res) => {
        if(!req.headers.authorization) {
            return res.send({ status: false, 'msg': 'token not found' })
        }
        let headersList = {
            "Content-Type": "application/json",
            "Authorization": req.headers.authorization
        }
        try {
            const response = await axios.post(`${process.env.APIInteractiveURL}/enterprise/auth/changepin`, req.body, {
                headers: headersList
            })

            return res.json({ status: true, 'msg': response.data.description })
        }catch (error) {
            console.log(error)
            return res.json({ status: false, 'msg': error.response.data.description })
        }
    },
    fingerprint: async (req, res) => {
        console.log("fingerprint api has been called")
        // enterprise/auth/fingerprint
	try {
	    console.log("Try Inn");
	    const userId = await module.exports.getUserId(req.body.userID)
            req.body.userID = userId
            const response = await axios.post(`${process.env.APIInteractiveURL}/enterprise/auth/fingerprint`, req.body)

            const tradingsession = response.data.result
	    console.log("Try Inn",response.data.result);


            // const marketdatasession = await module.exports.getMarketDataSession(userId)

            const getClientData = await module.exports.getClientData(tradingsession.token, userId)

            const watchlistdata = await watchlistController.getWatchList(userId)

            const basketdata = await basketController.getBasket(userId)

            const checkHasKey = await redisclient.exists(userId)

            // Market Status Event  - START//
            xtsMarketDataWS = new XtsMarketDataWS(process.env.APIMarketDataURL);
            var socketInitRequest = {
            userID: tradingsession.userID,
            publishFormat: 'JSON',
            broadcastMode: 'Full',
            token: tradingsession.token, // Token Generated after successful LogIn
            };
            xtsMarketDataWS.init(socketInitRequest);

            xtsMarketDataWS.onExchangeTradingStatus(async (tradingStatus) => {
                console.log('marketStatus', tradingStatus);
                const tradingJson = JSON.stringify(tradingStatus)

                const insertMarketStatus = await marketStatusModel.create({
                    exchange_segment: tradingStatus.ExchangeSegment,
                    exchange_instrument_id: tradingStatus.ExchangeInstrumentID,
                    market_type: tradingStatus.maketType,
                    message: tradingStatus.message,
                    trading_session: tradingStatus.tradingSession,
                    status_json: tradingJson
                })
            });
            // Market Status Event  - END//

            // Trade Interactive Socket -START //
            xtsInteractiveWS = new XTSInteractiveWS(process.env.APIInteractiveURL);
            var socketInitRequest = {
            userID: tradingsession.userID,
            token: tradingsession.token, // Token Generated after successful LogIn
            };
            xtsInteractiveWS.init(socketInitRequest);

        //Trade Socket
            xtsInteractiveWS.onTrade(async (TradeData) => {
                console.log('saroTrade', TradeData);
                const firebase = require('../config/firebase_config')
                const LoginID = TradeData.LoginID
                const AppOrderID = TradeData.AppOrderID
                const OrderStatus = TradeData.OrderStatus

                const getUserFirebaseToken = await userModel.findOne({
                    where: [{name: LoginID}],
                    attributes: ['firebase_token']
                })
                var fbToken = getUserFirebaseToken.dataValues.firebase_token
                const fbData = {
                    notification_to_fbid: `${fbToken}`, 
                    notification_subject: 'Trade Event', 
                    notification_message: `Hi ${LoginID}, Your order has been executed - OrderId: ${AppOrderID}, Status:  ${OrderStatus}`
                }
                await firebase.sendFirebaseNotifcation(fbData)

                // insert notification into the notification Table//

                const insertNotification = await notificationModel.create({
                    user_id: LoginID,
                    subject: fbData.notification_subject,
                    content: fbData.notification_message
                })
            });
            // Trade Interactive Socket -END //

            res.json({ status: true, 'msg': 'loggedin successfully', data: { tradingclientsession: tradingsession.token, marketdataclientsession: tradingsession.token, clientdata: getClientData, watchlistdata, basketdata, result: tradingsession} })
            try{
                const RedisStoredDate=await redisclient.get("Scanner")
                //Add Five minutes to the Previous Redis Time
                finaldate = moment(RedisStoredDate ,'DD-MM-YYYY HH:mm').add(5,'minutes').format("DD-MM-YYYY HH:mm");
                console.log("\n");
                console.log(`*** Five Minutes Added Date ${finaldate} ***`)
                console.log("\n");
                if(moment().format("DD-MM-YYYY HH:mm")>=finaldate){
                    console.log("*** Redis If Inn ***");
                    console.log("\n");
                    console.log("***Scanner Gainers Inn***");
                    console.log("\n");
                    await redisclient.set("Scanner", moment().format("DD-MM-YYYY HH:mm"))
                    await OptionIndexCollection(tradingsession.token)
                    await OptionStocksCollection(tradingsession.token)
                    await CurrenciesFutureCollection(tradingsession.token)
                    await CurrenciesOptionCollection(tradingsession.token)
                    await CommodityFutureCollection(tradingsession.token)
                    await CommodityOptionCollection(tradingsession.token)
                }
                if(RedisStoredDate==null){
                    console.log("*** Redis Else Inn ***");
                    console.log("\n");
                    await redisclient.set("Scanner", moment().format("DD-MM-YYYY HH:mm"))
                    await OptionIndexCollection(tradingsession.token)
                    await OptionStocksCollection(tradingsession.token)
                    await CurrenciesFutureCollection(tradingsession.token)
                    await CurrenciesOptionCollection(tradingsession.token)
                    await CommodityFutureCollection(tradingsession.token)
                    await CommodityOptionCollection(tradingsession.token)
                }
            }catch(err){
                console.log("***Scanner Collection Error***");
                console.log("\n");
                console.log(err);
        }
        }catch (error) {
            console.log(error.message)
            return res.json({ status: false, 'msg': error.message })
        }
    },
    CreateClientIdForMobileNumber: async (req, res) => {

        // need to check the payload has the mobilenumber and clientid
        if(!req.body.MobileNumber) {
            return res.send({ status: false, 'msg': 'MobileNumber is required' })
        }

        if(!req.body.ClientId) {
            return res.send({ status: false, 'msg': 'ClientId is required' })
        }

        req.body.ClientId = req.body.ClientId.toUpperCase()

        // Need to check mobilenumber already in the database.
        try {

            const checkMobileNumber = await ClientIdWithMobileNoModel.findOne({where: {MobileNumber: req.body.MobileNumber}})

            // if user not exists on the table, then we have to create a user with client in the database.
            if(!checkMobileNumber) {
                try {
                    const createUser = await ClientIdWithMobileNoModel.create(req.body)
                    if(createUser) {
                        res.send({"status":"success", "msg": "User created successfully"})
                    } else {
                        res.send({"status":"error", "msg": "Something went wrong. ask your developer"})
                    }
                } catch (error) {
                    console.log(error)
                    res.send({"status":"error", "msg": "Something went wrong. ask your developer"})
                }
            }
            res.send({"status":"error", "msg": "User with the ClientId already in"})
        } catch (error) {
            console.log(error)
            res.send({"status":"error", "msg": "Something went wrong. ask your developer"})

        }
    },
    UserLogout: async (req,res) => {
        
        try {
            let headersList = {
                "Content-Type": "application/json",
                "Authorization": req.headers.authorization
            }
            const response = await axios.delete(`${process.env.APIInteractiveURL}/enterprise/auth/logout?userID=${req.params.userId}`, {
                headers: headersList
            })
            if(response.data.type=='success'){
                console.log('response.data',response.data)
                return res.json({ status: true, 'msg': response.data.description })
            }
        } catch (error) {
            console.log(error)
            return res.json({ status: false, 'msg': 'Something went wrong' })
        }
    }
}
