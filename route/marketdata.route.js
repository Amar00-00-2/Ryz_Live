const express = require('express')
const app = express()
const router = express.Router()
const axios = require('axios')

router
    .route('/get_symbol_data/:exchangeSegment/:series/:symbol')
    .get(async (req, res) => {
        if(!req.headers.marketauthorization) {
            res.send({"status":"error", "msg":"token not found"})
        }
        try{
            const getresponse = await axios.get(`${process.env.APIMarketDataURL}/instruments/instrument/symbol?exchangeSegment=${req.params.exchangeSegment}&series=${req.params.series}&symbol=${req.params.symbol}`, {
                headers: {
                    "authorization": req.headers.marketauthorization
                }
            })
            if (getresponse.data.type == 'success') {
                res.send(getresponse.data.result)
            } else {
                res.send({ "status": "error1" })
            }
        } catch (error) {
            console.log('sym_error',error)
            res.send({ "status": "error", message: error.message })
        }
    })

router
    .route('/get_quotes')
    .post(async (req, res) => {
        // console.log("authorizationauthorization",req.headers.marketauthorization)
        if(!req.headers.marketauthorization) {
            res.send({"status":"error", "msg":"token not found"})
        }
        try {
            const getresponse = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,req.body, {
                headers: {
                    "authorization": req.headers.marketauthorization
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

// get data based on Exchangesegemnt & ExchangeInstrumentId

router
    .route('/search_byid')
    .post(async (req, res) => {
        // console.log("authorizationauthorization",req.headers.marketauthorization)
        if(!req.headers.marketauthorization) {
            return res.send({"status":"error", "msg":"token not found"})
        }

        if(!req.headers.userid) {
            return res.send({"status":"error", "msg":"userid not found"})
        }

        if(!req.body.exchangeSegment) {
            return res.send({"status":"error", "msg":"exchangeSegment not found"})
        }


        // if(isNaN(Number(req.body.exchangeSegment))){
        //     return res.send({"status":"error", "msg":"exchangeSegment is not Number"})
        // }

        // if(isNaN(Number(req.body.exchangeInstrumentID))){
        //     return res.send({"status":"error", "msg":"exchangeSegment is not Number"})
        // }


        if(!req.body.exchangeInstrumentID) {
            return res.send({"status":"error", "msg":"exchangeInstrumentID not found"})
        }
        try {
            const getresponse = await axios.post(`${process.env.APIMarketDataURL}/search/instrumentsbyid`,{
                "source": "WebAPI",
                "UserID": req.headers.userid,
                "instruments": [
                  {
                    "exchangeSegment": Number(req.body.exchangeSegment),
                    "exchangeInstrumentID": req.body.exchangeInstrumentID
                  }
                ]
              }, {
                headers: {
                    "authorization": req.headers.marketauthorization
                }
            })
            if (getresponse.data.type == 'success') {
                console.log("Amarrr Passsss");
                res.send(getresponse.data.result)
            } else {
                console.log("Amarrr Failll");
                res.send({ "status": "error" })
            }
        } catch (error) {
            console.log('saroerror', error)
            res.send({ "status": "error", message: error })
        }
    })

router
    .route('/get_future_date')
    .post(async (req, res) =>{
        // https://developers.symphonyfintech.in/marketdata/instruments/instrument/futureSymbol?exchangeSegment=2&series=FUTIDX&symbol=FTSE100&expiryDate=20Sep2019
        console.log(req.body)
        try {
            const getresponse = await axios.get(`${process.env.APIMarketDataURL}/instruments/instrument/futureSymbol?exchangeSegment=${req.body.checkDate.allAbout.ExchangeSegment}&series=FUTSTK&symbol=${req.body.checkDate.allAbout.Name}&expiryDate=${req.body.checkDate.value}`,{
                headers: {
                    authorization: req.headers.marketauthorization
                }
            })  
            res.send({"status": 'success', data: getresponse.data.result})
        } catch (error) {
            res.send({"status":"error"})
        }
      
    })

/**
 * Trading View Chart Web Views
 */

router.get('/tv/:sym/:es/:ei/:uid/:src/:token', function (req, res) {
    // console.log('saroreq', req)
    res.render('index', { data: { sym:req.params.sym,es: req.params.es, ei: req.params.ei, token: req.params.token ,uid:req.params.uid,src:req.params.src} })
});  

router.get('/data/:es/:ei/:token', async (req, res) => {
    const months = { "1": "Jan", "2": "Feb", "3": "Mar", "4": "Apr", "5": "May", "6": "Jun", "7": "Jul", "8": "Aug", "9": "Sep", "10": "Oct", "11": "Nov", "12": "Dec" }
    const todayDateTime = new Date();
    const todayDate = months[(todayDateTime.getMonth() + 1)] + ' ' + ('0' + todayDateTime.getDate()).slice(-2) + ' ' + todayDateTime.getFullYear();

    const fromDateTime  = new Date();
    fromDateTime.setDate(fromDateTime.getDate() - 6)
    // console.log('todayDate',todayDate)
    const fromDate = months[(fromDateTime.getMonth() + 1)] + ' ' + ('0' + fromDateTime.getDate()).slice(-2) + ' ' + fromDateTime.getFullYear();
    try {
        const responseData = await axios.get(`${process.env.APIMarketDataURL}/instruments/ohlc?exchangeSegment=${req.params.es}&exchangeInstrumentID=${req.params.ei}&startTime=${fromDate} 090000&endTime=${todayDate} 153000&compressionValue=60`, {
            headers: {
                'Authorization': req.params.token
            }
        })
        // console.log('responseData', responseData)
        if(responseData.data.result.dataReponse){
        const ohlcRowData = responseData.data.result.dataReponse.split(',');
        let ohlcData = []
        for (let i = 0; i < ohlcRowData.length; i++) {
            const ohlcColumnData = ohlcRowData[i].split('|');
            const ChartTime= new Date(new Date(ohlcColumnData[0] * 1000).toLocaleString('en-US', { timeZone: 'UTC' }));
            
            ohlcData.push({
                time: Number(ChartTime.getTime()),
                open: parseFloat(ohlcColumnData[1]),
                high: parseFloat(ohlcColumnData[2]),
                low: parseFloat(ohlcColumnData[3]),
                close: parseFloat(ohlcColumnData[4]),
                volume: parseFloat(ohlcColumnData[5]),
                exchange:1
            })
        }
        res.json({ Data: ohlcData })
       } else {
	res.json({Data: []})
	}
    } catch (error) {
        res.json(error)
    }
})



router.get('/mobilechart/:exchangeSegment/:exchangeInstrumentId/:token', async (req, res) => {
    try {
        const months = { "1": "Jan", "2": "Feb", "3": "Mar", "4": "Apr", "5": "May", "6": "Jun", "7": "Jul", "8": "Aug", "9": "Sep", "10": "Oct", "11": "Nov", "12": "Dec" }

        const todayDateTime = new Date();
        const todayDate = months[(todayDateTime.getMonth() + 1)] + ' ' + ('0' + todayDateTime.getDate()).slice(-2) + ' ' + todayDateTime.getFullYear();
        const responseData = await axios.get(`${process.env.APIMarketDataURL}/instruments/ohlc?exchangeSegment=${req.params.exchangeSegment}&exchangeInstrumentID=${req.params.exchangeInstrumentId}&startTime=${todayDate} 090000&endTime=${todayDate} 153000&compressionValue=300`, {
            headers: {
                'Authorization': req.params.token
            }
        })
//        console.log('sarorespone', responseData)
        if(responseData.data.result.dataReponse){
            const ohlcRowData = responseData.data.result.dataReponse.split(',');
            let ohlcData = []
            for (let i = 0; i < ohlcRowData.length; i++) {
                const ohlcColumnData = ohlcRowData[i].split('|');
                ohlcData.push(parseFloat(ohlcColumnData[4]))
            }
            res.send({ ohlcData: ohlcData })
        } else {
            res.json({ ohlcData: [] })
        }
        
    } catch (error) {
        console.log('saroerror', error)
        res.json({ ohlcData: [] })
    }
});
router.get('/webchart/:exchangeSegment/:exchangeInstrumentId/:token', async (req, res) => {
    try {
        const months = { "1": "Jan", "2": "Feb", "3": "Mar", "4": "Apr", "5": "May", "6": "Jun", "7": "Jul", "8": "Aug", "9": "Sep", "10": "Oct", "11": "Nov", "12": "Dec" }

        const todayDateTime = new Date();
        const todayDate = months[(todayDateTime.getMonth() + 1)] + ' ' + ('0' + todayDateTime.getDate()).slice(-2) + ' ' + todayDateTime.getFullYear();
	console.log("OHLC Date",todayDate)
        const responseData = await axios.get(`${process.env.APIMarketDataURL}/instruments/ohlc?exchangeSegment=${req.params.exchangeSegment}&exchangeInstrumentID=${req.params.exchangeInstrumentId}&startTime=${todayDate} 090000&endTime=${todayDate} 153000&compressionValue=300`, {
            headers: {
                'Authorization': req.params.token
            }
        })
        // console.log('sarorespone', responseData)
        if(responseData.data.result.dataReponse){
            const ohlcRowData = responseData.data.result.dataReponse.split(',');
            let ohlcData = []
            for (let i = 0; i < ohlcRowData.length; i++) {
                const ohlcColumnData = ohlcRowData[i].split('|');
		ohlcData.push({time:Number(ohlcColumnData[0]),value:parseFloat(ohlcColumnData[4])})
            }
	    // console.log("ArrayData",ohlcData)
            res.send({ ohlcData: ohlcData })
        } else {
            res.json({ ohlcData: [] })
        }
        
    } catch (error) {
        console.log('saroerror', error)
        res.json({ ohlcData: [] })
    }
});
router
    .route('/instrumentwithquote')
    .post(async (req, res) => {
        if(!req.headers.marketauthorization) {
            res.send({"status":"error", "msg":"token not found"})
            return;
        }

        if(!req.body.instruments.exchangeSegment) {
            res.send({"status":"error", "msg":"exchangeSegment not found"})
            return;
        }

        if(!req.body.instruments.exchangeInstrumentId) {
            res.send({"status":"error", "msg":"exchangeInstrumentId not found"})
            return;
        }
        const instrumentiddata = await axios.post(`${process.env.APIMarketDataURL}/search/instrumentsbyid`, {
            "source": "WebAPI",
            "UserID": req.headers.userid,
            "instruments": req.body.instruments
          }, {
            headers: {
                authorization: req.headers.marketauthorization
            }
        })

        let response1 = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`, {
            instruments: req.body.instruments,
            xtsMessageCode: 1502,
            publishFormat: "JSON"
        }, {
            headers: {
                authorization: req.headers.marketauthorization
            }
        })

        res.send({})

        response1.data.result.listQuotes.forEach((data) => {
            let getjson = JSON.parse(data)
            socket.emit('get_stock_io_data', {oi:getjson})
        })
    })

router
    .route('/focalculator')
    .post(async(req, res) =>{

        try {
            const instrumentiddata = await axios.post(`${process.env.APIMarketDataURL}/instruments/calculator/position`, req.body)
            res.send(instrumentiddata.data.result)
        } catch (error) {

        }
    })
router
    .route('/scanners')
    .post(async (req, res) => {
        // console.log("authorizationauthorization",req.headers.marketauthorization)
        if(!req.headers.marketauthorization) {
            res.send({"status":"error", "msg":"token not found"})
        }
        try {
            const getresponse = await axios.post(`${process.env.APIMarketDataURL}/scanner`,req.body, {
                headers: {
                    "authorization": req.headers.marketauthorization
                }
            })
           console.log(getresponse.data)
            if (getresponse.data.type == 'success') {
		res.send({ "status": "success","message":getresponse.data.result })
            } else {
                res.send({ "status": "error" })
            }
        } catch (error) {
            console.log(error)
            res.send({ "status": "error" })
        }
    })

module.exports = router
