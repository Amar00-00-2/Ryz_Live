const express = require('express')
const cors = require("cors")
require('dotenv').config({path:__dirname+'/.envmk'})
// require('dotenv').config({path:__dirname+'/.env'})
const app = express()
const HttpServer = require('http').createServer(app)
const { Server } = require('socket.io')
var path = require('path');
const io = new Server(HttpServer, {
  cors: '*'
})

const Typesense = require('typesense')

const {redisclient} = require('./config')

// cors is used to allow certain domain if admin want
// passing value as a * in cors is allow all domain to get from backend.

app.use(cors("*"))

app.use(express.json())
app.disable('x-powered-by')
app.disable('Server')

app.set('view engine', 'ejs');

var public = path.join(__dirname, 'public');
app.use('/', express.static(public));
//app.use('/static',express.static(__dirname + '/public'));

app.set('views','public');

app.use('/v1/', require('./route'))

// Auto Typesense using cronjob

// require('./typesense')

var XtsMarketDataAPI = require('xts-marketdata-api').XtsMarketDataAPI;
var XTSInteractive_dev_main = require('xts-interactive-api').Interactive;
var XtsMarketDataWS = require('xts-marketdata-api').WS;

const axios = require("axios")
const { Console } = require('console')

xtsMarketDataAPI = new XtsMarketDataAPI(
  'https://trade.gillbroking.com/marketdata'
);

var loginRequestLive = {
  secretKey: "Sopl771$XY",
  appKey: "845e1ca8b0f2d749d6e383"
};

app.get('/', (req, res) => {
  console.log('main route requested')
  res.send("Gill Stock Server")
})

app.post('/v1/get-future-dates/', async (req, res) =>{
  console.log(req.body)
  try {
    const uniqueSegmentKey = `${req.body.ExchangeSegment}${req.body.Name}`

    const checkHasKey = await redisclient.exists(uniqueSegmentKey)

    if(checkHasKey) {
      console.log('future dates from redis')
      let getStringJson = await redisclient.get(uniqueSegmentKey)
      res.send(JSON.parse(getStringJson))
    } else {
      const getresponse = await axios.get(`${process.env.APIMarketDataURL}/instruments/instrument/expiryDate?exchangeSegment=2&series=FUTSTK&symbol=${req.body.Name}`)  

      var monthNames = [ "January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December" ];
      let getresponses = [...new Set(getresponse.data.result)]
      getresponses.sort()
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      const finalResponse = []
      for(sno=0;sno<getresponses.length;sno++) {
        let d = new Date(getresponses[sno])
        const FullData = {value:`${String(d.getDate())+String(months[d.getMonth()])+String(d.getFullYear())}`, label: `${String(d.getDate())} ${String(months[d.getMonth()])}`, dataformat: `${String(d.getDate())+'/'+String(d.getMonth()+1 > 10?d.getMonth()+1:'0'+(d.getMonth()+1))+'/'+String(d.getFullYear())}`, monthname: monthNames[d.getMonth()], allAbout: req.body}
        // https://developers.symphonyfintech.in/marketdata/instruments/instrument/futureSymbol?exchangeSegment=2&series=FUTIDX&symbol=FTSE100&expiryDate=20Sep2019

        const getFutureDateResponse = await axios.get(`${process.env.APIMarketDataURL}/instruments/instrument/futureSymbol?exchangeSegment=2&series=FUTSTK&symbol=${req.body.Name}&expiryDate=${FullData.value}`)

        finalResponse.push({value:`${String(d.getDate())+String(months[d.getMonth()])+String(d.getFullYear())}`, label: `${String(d.getDate())} ${String(months[d.getMonth()])}`, dataformat: `${String(d.getDate())+'/'+String(d.getMonth()+1 > 10?d.getMonth()+1:'0'+(d.getMonth()+1))+'/'+String(d.getFullYear())}`, monthname: monthNames[d.getMonth()], allAbout: getFutureDateResponse.data.result})
      }

      // getresponses = getresponses.map( element => {
         
      // });
      await redisclient.set(uniqueSegmentKey, JSON.stringify(finalResponse))
      res.send(finalResponse)
    }
  } catch(error) {
    console.log(error.response.data)
    res.send({"status":"error"})
  }
})

app.get('/v1/optional-chain/:term/:getexpirydate', async (req, res) => {
  // console.log(req.params)
  console.log('start_date_optional_chain', new Date())
  const uniqueSearchKey = `${req.params.term}`
  if (req.params.term == '') {
    res.send([])
  } else {

    const customprice = req.headers.customprice

    try {
      let searchResult = []
      let fromRedisKey = false
      // const checkHasKey = await redisclient.exists(uniqueSearchKey)
      // if(checkHasKey) {
      //   fromRedisKey = true
      //   console.log('serach from redis')
      //   let getStringJson = await redisclient.get(uniqueSearchKey)
      //   searchResult = JSON.parse(getStringJson)
      // } else {
      //   const response = await axios.get(`${process.env.APIMarketDataURL}/search/instruments?searchString=${req.params.term}`, {
      //     headers: {
      //       "authorization": req.headers.authorization
      //     }
      //   })
      //   searchResult = response.data.result
      // }
      // if (searchResult == undefined) {
      //   res.send([])
      // } else {
        // if(!fromRedisKey) {
        //   await redisclient.set(uniqueSearchKey, JSON.stringify(searchResult))
        // }
        let getMkArray = []
        let getMkArrayCE = []


        let client = new Typesense.Client({
          'nodes': [{
            'host': 'localhost',
            'port': '8108',
            'protocol': 'http'
          }],
          'apiKey': 'KLDtWW0jLJ8katOEtIVtfZlcia7d4n8XcHObVGcy4OjP4ztL',
          'connectionTimeoutSeconds': 5
        });

        const getdataForPEFirstOff = await client.collections('NSEFO08-26-2022').documents().search({
        q:req.params.term,
        per_page: 10,
        query_by:"ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Description, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize, LotSize, Multiplier",
        filter_by:`ContractExpirationString:=${req.params.getexpirydate} && OptionType:=4 && Series:=OPTSTK && StrikePrice:>=${customprice}`,
        sort_by:"StrikePrice:asc"
        })
        getapidataPEFirstOff = getdataForPEFirstOff.hits.map(x => {
          return {...x.document}
        })

        const getdataForPESecondOff = await client.collections('NSEFO08-26-2022').documents().search({
          q:req.params.term,
          per_page: 10,
          query_by:"ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Description, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize, LotSize, Multiplier",
          filter_by:`ContractExpirationString:=${req.params.getexpirydate} && OptionType:=4 && Series:=OPTSTK && StrikePrice:<=${customprice}`,
          sort_by:"StrikePrice:desc"
          })
        getapidataPESecondOff = getdataForPESecondOff.hits.map(x => {
          return {...x.document}
        })
        getapidataPESecondOff = getapidataPESecondOff.sort((a,b) => a.StrikePrice - b.StrikePrice)
        getapidataPE = [...getapidataPESecondOff,...getapidataPEFirstOff]

        const getdataForCEFirstOff = await client.collections('NSEFO08-26-2022').documents().search({
        q:req.params.term,
        per_page: 10,
        query_by:"ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Description, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize, LotSize, Multiplier",
        filter_by:`ContractExpirationString:=${req.params.getexpirydate} && OptionType:=4 && Series:=OPTSTK && StrikePrice:>=${customprice}`,
        sort_by:"StrikePrice:asc"
        })
        getapidataCEFirstOff = getdataForCEFirstOff.hits.map(x => {
          return {...x.document}
        })

        const getdataForCESecondOff = await client.collections('NSEFO08-26-2022').documents().search({
          q:req.params.term,
          per_page: 10,
          query_by:"ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Description, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize, LotSize, Multiplier",
          filter_by:`ContractExpirationString:=${req.params.getexpirydate} && OptionType:=4 && Series:=OPTSTK && StrikePrice:<=${customprice}`,
          sort_by:"StrikePrice:desc"
          })
          getapidataCESecondOff = getdataForCESecondOff.hits.map(x => {
            return {...x.document}
          })

        getapidataCESecondOff = getapidataCESecondOff.sort((a,b) => a.StrikePrice - b.StrikePrice)

        getapidataCE = [...getapidataCESecondOff,...getapidataCEFirstOff]

        console.log('customprice', customprice)
        console.log('getapidataCE', getapidataCE.length);
        console.log('getapidataPE', getapidataPE.length);
        // console.log('start_date_optional_chain_filter_loop', new Date())
        // const finaldata = searchResult.filter(x => {
        //   // console.log('searchResultsearchResult', x);
        //   // const getdisplay = x.DisplayName.split(' ')
        //     if (x.OptionType == 4) {
        //       getMkArray.push({...x,exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
        //     } else {
        //       getMkArrayCE.push({...x,exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
        //     }
        // })

        let instrumentsPE = getapidataPE.map(x => {
          return {exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID}
        })

        let instrumentsCE = getapidataCE.map(x => {
          return {exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID}
        })

        console.log('end_date_optional_chain_filter_loop', new Date())

        // const getapidataPE = getMkArray.sort((a, b) => a.StrikePrice - b.StrikePrice)
        // const getapidataCE = getMkArrayCE.sort((a, b) => a.StrikePrice - b.StrikePrice)

        // const getStrtikepE = getapidataPE.map(x => x.StrikePrice)
        // const getStrtikeCE = getapidataCE.map(x => x.StrikePrice)
        // console.log('getStrtikepE',getStrtikepE)
        // console.log('getStrtikeCE',getStrtikeCE)
        // const instrumentsIndex = getapidataPE.findIndex(x => x.StrikePrice > customprice)
        // console.log('instrumentsIndex', instrumentsIndex)
        // let instrumentsPE = getapidataPE.slice(instrumentsIndex - 10, instrumentsIndex + 10 )
        // instrumentsIndex_forCustomPrice = instrumentsPE.findIndex(x => x.StrikePrice > customprice)
        // console.log('instrumentsIndex_forCustomPrice', instrumentsIndex_forCustomPrice)
        // instrumentsPE[instrumentsIndex_forCustomPrice].drawline = true
        // console.log('instrumentsPE[instrumentsIndex]',instrumentsPE[instrumentsIndex])
        // let instrumentsCE = getapidataCE.slice(instrumentsIndex - 10, instrumentsIndex + 10 )
        // instrumentsCE[instrumentsIndex]['drawline'] = true


        const responsePE = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
          instruments:instrumentsPE,
          "xtsMessageCode": 1502,
          "publishFormat": "JSON"
        }, {
          headers: {
            "authorization": req.headers.authorization
          }
        })

        const QuotesForPE = responsePE.data.result.listQuotes

        const responseCE = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
          instruments:instrumentsCE,
          "xtsMessageCode": 1502,
          "publishFormat": "JSON"
        }, {
          headers: {
            "authorization": req.headers.authorization
          }
        })

        const QuotesForCE = responseCE.data.result.listQuotes


        const responsePE1510 = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
          instruments:instrumentsPE,
          "xtsMessageCode": 1510,
          "publishFormat": "JSON"
        }, {
          headers: {
            "authorization": req.headers.authorization
          }
        })

        // console.log(responsePE1510)

        const QuotesForPE1510 = responsePE1510.data.result.listQuotes

        // console.log('QuotesForPE1510',instrumentsPE.length, QuotesForPE1510.length)

        const responseCE1510 = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
          instruments:instrumentsCE,
          "xtsMessageCode": 1510,
          "publishFormat": "JSON"
        }, {
          headers: {
            "authorization": req.headers.authorization
          }
        })

        const QuotesForCE1510 = responseCE1510.data.result.listQuotes

        // console.log('QuotesForCE1510', instrumentsCE.length,QuotesForCE1510.length)


        const instruments = instrumentsPE.concat(instrumentsCE)
        instrumentsPE = instrumentsPE.map((x , i) =>{          
          const getPE = QuotesForPE1510.filter(mk =>  {
            if(mk) {
              const getJsonData = JSON.parse(mk)
              if(getJsonData.ExchangeSegment == x.ExchangeSegment && getJsonData.ExchangeInstrumentID == x.ExchangeInstrumentID) {
                return true
              }
            }
          })

          // console.log('getPE.length', getPE && getPE[0]?getPE[0]:{})

          return {...JSON.parse(QuotesForPE[i]?QuotesForPE[i]:'{}'),...JSON.parse(getPE && getPE[0]?getPE[0]:'{}'),...x}
        })
        instrumentsCE = instrumentsCE.map((x , i) =>{
          const getCE = QuotesForCE1510.filter(mk =>  {
            if(mk) {
              const getJsonData = JSON.parse(mk)
              if(getJsonData.ExchangeSegment == x.ExchangeSegment && getJsonData.ExchangeInstrumentID == x.ExchangeInstrumentID) {
                return true
              }
            }
          })
          return {...JSON.parse(QuotesForCE[i]?QuotesForCE[i]:'{}'),...JSON.parse(getCE && getCE[0] ?getCE[0]:'{}'),...x}
        })
        res.json({ "PE": instrumentsPE,"CE": instrumentsCE })
        // console.log('end_date_optional_chain', new Date())
      // }

      
    } catch (error) {
      console.log(error)
      res.send([])
    }
  }
})

app.post('/v1/optional-chain/get-quotes/', async (req, res) => {
  try {
    const response = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,req.body, {
      headers: {
        "authorization": req.headers.authorization
      }
    })
    res.send(response.data.result.quotesList)
  } catch (error) {
    res.send([])
  }
})


// load socket in index file
require('./socket_route')(io);

io.of('/buyscreen/marketdata').on('connection', async socket => {
  console.log('/buyscreen/marketdata selected data')

  socket.on('run_marketdata_buyscreen', async data => {

    // console.log(logIn)

    let headersList = {
      "Accept": "*/*",
      "Content-Type": "application/json",
      "Authorization": logIn.result.token
    }

    const instrumentiddata = await axios.post('${process.env.APIMarketDataURL}/search/instrumentsbyid', {
      "source": "WebAPI",
      "UserID": "guest",
      "instruments": [
        {
          "exchangeSegment": data.singlesegmentdata.ExchangeSegment || data.singlesegmentdata.exchangeSegment,
          "exchangeInstrumentID": data.singlesegmentdata.ExchangeInstrumentID || data.singlesegmentdata.exchangeInstrumentID
        }
      ]
    }, {
      headers: headersList
    })

    console.log('instrumentiddata', instrumentiddata.data.result)

    var XtsMarketDataWS = require('xts-marketdata-api').WS;
    xtsMarketDataWS = new XtsMarketDataWS('${process.env.APIMarketDataURL}');
    var socketInitRequest = {
      userID: 'TEST140',
      publishFormat: 'JSON',
      broadcastMode: 'Full',
      token: logIn.result.token, // Token Generated after successful LogIn
    };
    let segmentdata = instrumentiddata.data.result[0]
    // console.log(segmentdata)
    xtsMarketDataWS.init(socketInitRequest);


    socket.emit('get_stock_name_buyscreen', { Name: segmentdata.Name, DisplayName: segmentdata.DisplayName, cname: segmentdata.Description, exchangeSegment: data.singlesegmentdata.ExchangeSegment || data.singlesegmentdata.exchangeSegment, exchangeInstrumentID: data.singlesegmentdata.ExchangeInstrumentID || data.singlesegmentdata.exchangeInstrumentID, ExtendedMarketProperties: segmentdata.ExtendedMarketProperties, NameWithExchange: segmentdata.NameWithExchange })


    let response1 = await xtsMarketDataAPI_DEV_SEARCH.subscription({
      instruments: [
        {
          exchangeSegment: data.singlesegmentdata.ExchangeSegment || data.singlesegmentdata.exchangeSegment, exchangeInstrumentID: data.singlesegmentdata.ExchangeInstrumentID || data.singlesegmentdata.exchangeInstrumentID
        }
      ],
      xtsMessageCode: 1502,
    });


    let getjson = JSON.parse(response1.result.listQuotes[0])
    socket.emit('get_stock_data_buyscreen', { ii: getjson.ExchangeInstrumentID, price: getjson.Touchline.LastTradedPrice, percentage: getjson.Touchline.PercentChange, diff: getjson.Touchline.LastTradedPrice - getjson.Touchline.Close, openprice: getjson.Touchline.Close, Touchline: getjson.Touchline })

    xtsMarketDataWS.onConnect((connectData) => {
      console.log(connectData);
    });

    xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
      // console.log('get_stock_data_buyscreen', marketDepthData.ExchangeSegment,marketDepthData.ExchangeInstrumentID, marketDepthData.Touchline)
      socket.emit('get_stock_data_buyscreen', { ii: marketDepthData.ExchangeInstrumentID, price: marketDepthData.Touchline.LastTradedPrice, percentage: marketDepthData.Touchline.PercentChange, diff: marketDepthData.Touchline.LastTradedPrice - marketDepthData.Touchline.Close, openprice: marketDepthData.Touchline.Open, close: marketDepthData.Touchline.Close, Touchline: marketDepthData.Touchline })
    });

  })


})




HttpServer.listen(process.env.PORT, (req, res) => {
  console.log(`gill server up and running in \n port ${process.env.PORT} mode ${process.env.MODE}`)
})


