const express = require("express")
const router = express.Router()
const {userController} = require('../controller')
const axios = require('axios')
const {redisclient} = require('../config')
router
    .route('/:term')
    .get(async (req, res) =>{
        const uniqueSearchKey = `${req.params.term}`
        if(req.params.term == '') {
            res.send([])
        } else {
            const checkHasKey = await redisclient.exists(uniqueSearchKey)
            if(checkHasKey) {
                console.log('serach from redis')
                console.log('search start time', new Date())
                let getStringJson = await redisclient.get(req.params.term)
                searchResult = JSON.parse(getStringJson)
                res.send(searchResult)
                console.log('search start time', new Date())
            } else {
                try {
                    console.log('search api start time', new Date())
                const response = await axios.get(`${process.env.APIMarketDataURL}/search/instruments?searchString=${req.params.term}`, {
                    headers: {
                        "authorization": req.headers.authorization
                    }
                })
                if(response.data.result == undefined) {
                    res.send([])
                    await redisclient.set(uniqueSearchKey, JSON.stringify([]))
                } else {
                    const finaldata = response.data.result
                    res.send(finaldata)
                    console.log('saroresponse', finaldata)
                    await redisclient.set(uniqueSearchKey, JSON.stringify(finaldata))
                }
                } catch(error) {
                    console.log('errorsaro', error.response.data)
                    res.send([])
                    await redisclient.set(uniqueSearchKey, JSON.stringify([]))
                }
                console.log('search api end time', new Date())
            }
        }
    })


router
    .route('/searchbyid')
    .post(async (req, res) => {
        if(!req.headers.tradingauthorization) {
            return res.send({"status":"error", "msg":"token not found"})
        }

        if(!req.headers.userid) {
            return res.send({"status":"error", "msg":"userid not found"})
        }

        if(!req.body.instruments) {
            return res.send({"status":"error", "msg":"instruments not found"})
        }

        if(req.body.instruments.length > 0) {
            return res.send({"status":"error", "msg":"instruments should have more than one object of segment & instrumentId"})
        }

        try {
            const getresponse = await axios.post(`${process.env.APIMarketDataURL}/search/instrumentsbyid`,{
                "source": "WebAPI",
                "UserID": req.headers.userid,
                "instruments": req.body.instruments
              }, {
                headers: {
                    "authorization": req.headers.tradingauthorization
                }
            })
            if (getresponse.data.type == 'success') {
                res.send(getresponse.data.result)
            } else {
                res.send({ "status": "error" })
            }
        } catch (error) {
            console.log(error)
            res.send({ "status": "error" })
        }
    })

module.exports = router