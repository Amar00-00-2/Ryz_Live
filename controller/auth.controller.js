const { userModel } = require('../model')
const watchlistController = require('./watchlist.controller')
const https = require('https');
const axios = require('axios')

module.exports = {
    login: async (req, res) => {
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
    getTradingSession: async () => {
        let headersList = {
            "Accept": "*/*",
            "Content-Type": "application/json"
        }
        const response = await axios.post(`${process.env.APIInteractiveURL}/user/session`, {
            "secretKey": "Rpqt871@HL",
            "appKey": "f80d52b3172e99a0044326",
            "source": "WebAPI"
        }, {
            headers: headersList
        })
        return response.data.result.token
    },
    getMarketDataSession: async () => {
        let headersList = {
            "Accept": "*/*",
            "Content-Type": "application/json"
        }

        const agent = new https.Agent({  
            rejectUnauthorized: false
          });

        try {
            const response = await axios.post(`${process.env.APIMarketDataURL}/auth/login`, {
                "secretKey": "Nrkh421@Ao",
                "appKey": "887801176da7b77545e757",
                "source": "WEBAPI"
            }, {
                headers: headersList,
                httpsAgent: agent
            })
            console.log('mkmkmkmkmk', response.data.result.token)
            return response.data.result.token
        } catch (e) {
            console.log(e)
        }
    },
    getClientData: async (token) => {
        let headersList = {
            "Accept": "*/*",
            "Content-Type": "application/json",
            "Authorization": token
        }
        try {
            const response = await axios.get(`${process.env.APIInteractiveURL}/user/profile?clientID=SYMP`, {
                headers: headersList
            })
            return response.data.result
        } catch (e) {
            console.log(e)
        }
    },
    userAuth: async function (req, res) {
        const checkUser = await userModel.findOne({
            where: req.body,
            raw: true
        })
        // console.log(checkUser)
        if (checkUser) {
            const marketdatasession = await module.exports.getMarketDataSession()

            const tradingsession = await module.exports.getTradingSession()

            const getClientData = await module.exports.getClientData(tradingsession)

            const watchlistdata = await watchlistController.getWatchList('TEST140')
            console.log(watchlistdata)
            res.json({ status: true, 'msg': 'loggedin successfully', data: { ...checkUser, tradingclientsession: tradingsession, marketdataclientsession: marketdatasession, clientdata: getClientData, watchlistdata } })
        } else {
            res.json({ status: false, 'msg': 'invalid username or password' })
        }
    }
}