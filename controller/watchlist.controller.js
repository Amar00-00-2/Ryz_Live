const {watchlistModel} = require('../model')
const axios = require("axios")
module.exports = {
    addWatchList: async (req, res) => {
        const checkwatchListForUserId = await watchlistModel.findOne({where:{user_id: req.body.user_id}})
        if(checkwatchListForUserId) {
            const updatewatchlist = await watchlistModel.update({watchlist: req.body.watchlist},{where: {user_id: req.body.user_id}})
            if(updatewatchlist) {
                res.send({"status":"success"})
            } else {
                res.send({"status": "error"})
            }
        } else {
            const addwatchlist = await watchlistModel.create(req.body)
            if(addwatchlist) {
                res.send({"status":"success"})
            } else {
                res.send({"status": "error"})
            }
        }
    },
    getWatchList: async (user_id) => {
        const getWatchList = await watchlistModel.findOne({
            where:{user_id}, raw: true
        })
        if(getWatchList) {
            return JSON.parse(getWatchList.watchlist)
        } else {
            return {
                watchlist_title: ['WatchList1', 'WatchList2', 'WatchList3'],
                watchlist_data: {},
                watchlist_segment_data: []
            }
        }
    },
    getUserSelectedWatchList: async (req, res) => {
        try{

            if (!req.headers.tradingauthorization) {
                return res.send({ 'status': 'error', 'msg': 'authorization token not found' })
            }

            if(!req.body.instruments) {
                return res.send({"status":"error", "msg":"Instruments key value is required"})
            }

            if(!(req.body.instruments.length > 0)) {
                return res.send({"status":"error", "msg":"Instruments shoud have one set of exchangeSegment and exchangeInstrumentID"})
            }

            const instruments = req.body.instruments.map(x => {
                return {exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID}
            })

            const headersSetupMarket = {
                headers: {
                  'authorization': req.headers.tradingauthorization
                }
            }

            let response1 = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`, {
                instruments: instruments,
                xtsMessageCode: 1502,
                publishFormat: "JSON"
            }, headersSetupMarket)
            
            const finalProcessedWatchList = req.body.instruments.map((x ,i)=> {
                return {...x, ...JSON.parse(response1.data.result.listQuotes[i])}
            })
            res.send(finalProcessedWatchList)
            // response1.data.result.listQuotes.forEach((data) => {
            //     let getjson = JSON.parse(data)
            //     socket.emit('get_stock_data', getjson)
            // })
          } catch(error) {
            console.log(error)
          }
    }
}