const express = require("express")
const router = express.Router()
const {userController} = require('../controller')
const axios = require('axios')
const {redisclient, client} = require('../config')

process.env.TZ = 'Asia/Kolkata'

router
    .route('/:term')
    .get(async (req, res) =>{
        const uniqueSearchKey = `${req.params.term}`
        if(req.params.term == '') {
            res.send([])
        } else {
            const checkHasKey = await redisclient.exists(uniqueSearchKey)
            if(false && checkHasKey) {
                console.log('serach from redis')
                console.log('search start time', new Date())
                let getStringJson = await redisclient.get(req.params.term)
                searchResult = JSON.parse(getStringJson)
                res.send(searchResult)
                console.log('search start time', new Date())
            } else {
                try {
                    console.log('search api start time', new Date())
                // const response = await axios.get(`${process.env.APIMarketDataURL}/search/instruments?searchString=${req.params.term}`, {
                //     headers: {
                //         "authorization": req.headers.authorization
                //     }
                // })
                // if(response.data.result == undefined) {
                //     res.send([])
                //     await redisclient.set(uniqueSearchKey, JSON.stringify([]))
                // } else {
                    console.log('TYPESENSECOLLECTIONNAME', TYPESENSECOLLECTIONNAME)

                    const checkItIsIndex = req.params.term.includes('nifty')
                    console.log('checkItIsIndex',checkItIsIndex)
		    const main =`${req.params.term.split(" ")}`
                    const DecimalSearch =`${req.params.term.split("")}`.includes('.')
                    if(DecimalSearch){
                    var searchParameters = {
                        q:req.params.term.toLowerCase(),
                        query_by:"Name, Month, OptionTypeString,StrikePriceString, Description",
                        per_page:250,
                        filter_by:`StrikePriceString:=[${main}]`,
                        sort_by:"Series:asc"
                    }
                    }else{
                    var searchParameters = {
                        q:req.params.term.toLowerCase(),
                        query_by:"Name, Month,DisplayName, OptionTypeString,StrikePriceString, Description",
                        per_page:250,
                        sort_by:"Series:asc"
                    }
                    }
                    const getdata = await client.collections(TYPESENSECOLLECTIONNAME).documents().search(searchParameters)
                    console.log('searchGetData', getdata)
                    const finaldataMap = getdata.hits.map(x => {
                        const splitDisplayName = x.document.DisplayName.split(" ")
                        if(splitDisplayName.includes('SPD')) {
                            return undefined;
                        }
                        if(x.document.Series == 'OPTIDX') {
                            x.document.Series = 'OPTSTK'
                        } else if(x.document.Series == 'FUTIDX') {
                            x.document.Series = 'FUTSTK'
                        }
                        return {...x.document}
                    })
                    console.log('finaldataMap', finaldataMap)
                    const finaldata = finaldataMap.filter(x => x)
                    console.log('searchData', finaldata)
                    console.log('searchLen', finaldataMap.length)
                    res.send(finaldata)
                    await redisclient.set(uniqueSearchKey, JSON.stringify(finaldata))
                // }
                } catch(error) {
                    console.log(error)
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

        console.log('req.body.instruments', req.body.instruments, req.headers)

        if(!req.body.instruments) {
            return res.send({"status":"error", "msg":"instruments not found"})
        }

        if(req.body.instruments.length <= 0) {
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
