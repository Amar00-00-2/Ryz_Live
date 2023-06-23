const express = require("express")
const router = express.Router()
const { userController } = require('../controller')
const axios = require('axios')
const {redisclient} = require('../config')


router
    .route('/profile/:symbol')
    .get(async (req, res) => {
        const uniqueSearchKey = req.params.symbol.toUpperCase()+'.NS'
        try {

            const checkHasKey = await redisclient.exists(uniqueSearchKey)

            if(checkHasKey) {
                const getDetailsUsingKey = await redisclient.get(uniqueSearchKey)
                res.send({"status":"success", "symbolDetails": JSON.parse(getDetailsUsingKey)})
                return;
            } else {

                const response = await axios.get(`https://financialmodelingprep.com/api/v3/profile/${req.params.symbol}.NS?apikey=${process.env.FMPKEY}`)

                if(response.data["Error Message"]) {
                    res.send({"status":"error", "msg": response.data["Error Message"]})
                } else {
                    res.send({"status":"success", "symbolDetails": response.data})
                    redisclient.set(uniqueSearchKey, JSON.stringify(response.data))
                }
            }

        } catch (error) {
            res.send({"status":"success", "data": "something went wrong. ask your developer"})
        }
    })

router  
    .route('/peers')
    .post( async (req, res) =>{

        // checking the request has a header token tradingauthorization (used to authenticate api from the symphony)

        if(!req.headers.tradingauthorization) {
            return res.send("tradingauthorization token is not found")
        }

        const peersList = req.body.peersList
        peersList.sort()
        const index =peersList.findIndex((el)=>el==='MINDAIND.NS')
        peersList[index]='UNOMINDA.NS';
        // checking the requested body has the peersList Array

        if(!peersList) {
            return res.send("peersList is not found")
        } else {
            if(!Array.isArray(peersList)){
                return res.send("peersList should be a Array")
            } else {
                if(!(peersList.length > 1)) {
                    return res.send("peersList should have one value")
                }
            }
        }

        let headersList = {
            "Authorization": req.headers.tradingauthorization,
            "Content-Type": "application/json; charset=utf-8"
        }

        // first process, extract symbols from the array of data which is requested.
        const getExtractedData = []
        for(let si = 0;si < peersList.length; si++) {
            const explodeStringGetSymbol = peersList[si].split(".")[0];
            const series = "EQ";
            const exchangeSegment = 1;

            try {
                const getResponse = await axios.get(`${process.env.APIMarketDataURL}/instruments/instrument/symbol?exchangeSegment=${exchangeSegment}&series=${series}&symbol=${explodeStringGetSymbol}`,{
                    headers: headersList
                });
	        let getQuotesResponse = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
                   instruments:[{exchangeSegment:getResponse.data.result[0].ExchangeSegment,exchangeInstrumentID:getResponse.data.result[0].ExchangeInstrumentID}],
                   xtsMessageCode: 1502,
                   publishFormat: "JSON",
                },
                {
                  headers: headersList,
                });
                let getjson = JSON.parse(getQuotesResponse.data.result.listQuotes)
                getExtractedData.push({...getResponse.data.result[0],...getjson});
            } catch (error) {
               continue;
               console.log(error.message);
            }
       }
  return res.send(getExtractedData);
});

module.exports = router
