const express = require('express')
const cors = require("cors")
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swaggerjson/swagger.json');
//require('dotenv').config({path:__dirname+'/.envmk'})
require('dotenv').config({path:__dirname+'/.env'})
const app = express()
const HttpServer = require('http').createServer(app)
const { Server } = require('socket.io')
var path = require('path');
const { client } = require("./config");
const { marketStatusModel } = require('./model')
const { AppConfigModel } = require("./model")
const io = new Server(HttpServer, {
maxHttpBufferSize: 1e8, pingTimeout: 60000,
// "pingInterval":1000,
// "pingTimeout":2000,
  cors: '*',
//"transports":["websocket","polling"],
});
require('./logger.js')
// console.log('saroio', io)
global.TYPESENSECOLLECTIONNAME = ''
// swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// app.use('/whatsapp', console.log('s'));
const {redisclient} = require('./config')
// watchlist cron
require('./cron/watch_list_cron')
require('./cron/collection_delete')
// cors is used to allow certain domain if admin want
// passing value as a * in cors is allow all domain to get from backend.
// Auto Typesense Run with cronjob
require('./typesense')

app.use(cors("*"))

app.use(express.json())

app.use(express.urlencoded({extended: true}))

app.disable('x-powered-by')

app.disable('Server')

app.set('view engine', 'ejs');

var public = path.join(__dirname, 'public');
app.use('/', express.static(public));
//app.use('/static',express.static(__dirname + '/public'));

app.set('views','public');

app.get('/gillupdates', async (req, res) => {
  res.render('loopedin')
})

app.get('/digi_kyc', async (req, res) => {
  console.log('params',req.query)
  res.render('digi_kyc',{data: JSON.stringify(req.query)})
})
app.get('/kyc_sign', async (req, res) => {
  res.render('kyc_sign')
})
app.post('/cdsl', async (req, res) => {
  res.render('kyc_sign')
})
app.use('/v1/', require('./route'))

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
// changes 5/11/2022
app.post('/v1/get-futopt-dates', async (req, res) =>{
  try {
    let seriesName
    let exchangeSegment = req.body.ExchangeSegment
    if(req.body.Series_Key) {
      seriesName = req.body.Series_Key
    } else {
      seriesName = req.body.Series
    }

    if(seriesName=='EQ'){
      exchangeSegment = '2'
      seriesName = 'OPTSTK'
    } 
    const uniqueSegmentKey = `${exchangeSegment}${req.body.Name}`
    const checkHasKey = await redisclient.exists(uniqueSegmentKey)
//    console.log('req.headers', req.headers)
    const getresponse = await axios.get(`${process.env.APIMarketDataURL}/instruments/instrument/expiryDate?exchangeSegment=${exchangeSegment}&series=${seriesName}&symbol=${req.body.Name}`)
    var monthNames = [ "January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December" ];
    let getresponses = [...new Set(getresponse.data.result)]
    getresponses.sort()
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const array = req.body.DisplayName.split(" ")
    const finalResponse = []
    const instruments = []
    for(sno=0;sno<getresponses.length;sno++) {
      let d = new Date(getresponses[sno])
      const FullData = {value:`${String(d.getDate())+String(months[d.getMonth()])+String(d.getFullYear())}`, label: `${String(d.getDate())} ${String(months[d.getMonth()])}`, dataformat: `${String(d.getDate())+'/'+String(d.getMonth()+1 > 10?d.getMonth()+1:'0'+(d.getMonth()+1))+'/'+String(d.getFullYear())}`, monthname: monthNames[d.getMonth()],newKey:`${String(d.getDate()<10?'0' + d.getDate():d.getDate())+String(months[d.getMonth()])+String(d.getFullYear())}`,stringData:getresponses[sno]}
//      console.log('dateee', FullData)
      if (seriesName == 'OPTSTK' || seriesName == 'OPTFUT' || seriesName == 'OPTIDX' || seriesName == 'OPTCUR') {
        const array = req.body.DisplayName.split(" ")
        var getFutureDateResponse = await axios.get(`${process.env.APIMarketDataURL}/instruments/instrument/optionSymbol?exchangeSegment=${exchangeSegment}&series=${seriesName}&symbol=${req.body.Name}&expiryDate=${FullData.newKey}&optionType=${array[2]}&strikePrice=${req.body.StrikePrice}`)
      } else {
        var getFutureDateResponse = await axios.get(`${process.env.APIMarketDataURL}/instruments/instrument/futureSymbol?exchangeSegment=${exchangeSegment}&series=${seriesName}&symbol=${req.body.Name}&expiryDate=${FullData.newKey}`)
//        console.log(`${process.env.APIMarketDataURL}/instruments/instrument/futureSymbol?exchangeSegment=${exchangeSegment}&series=${seriesName}&symbol=${req.body.Name}&expiryDate=${FullData.value}`)
      }
//      console.log('futfuture', getFutureDateResponse.data)
      let response1 = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`, {
          instruments: [{exchangeSegment: getFutureDateResponse.data.result.ExchangeSegment, exchangeInstrumentID: getFutureDateResponse.data.result.ExchangeInstrumentID }],
          xtsMessageCode: 1502,
          publishFormat: "JSON"
      }, {
          headers: {
              authorization: req.headers.authorization
          }
      })
      finalResponse.push({...FullData, allAbout: {...getFutureDateResponse.data.result, ...JSON.parse(response1.data.result.listQuotes[0])}})
    }
//    console.log('dataaa', finalResponse)
    await redisclient.set(uniqueSegmentKey, JSON.stringify(finalResponse))
    res.send(finalResponse)
    // }
  } catch(error) {
    console.log(error)
    res.send({"status":"error"})
  }
})
app.post('/v1/get-options-dates/', async (req, res) =>{
  try {
    let seriesName
    let exchangeSegment = req.body.ExchangeSegment
    console.log("seriesKey", req.body.Series_Key)
    if(req.body.Series_Key) {
      seriesName = req.body.Series_Key
    } else {
      seriesName = req.body.Series
    }
    if(seriesName=='EQ'){
      exchangeSegment = '2'
      seriesName = 'OPTSTK'
    }
    if(exchangeSegment == 2) {
      if(seriesName == 'FUTIDX' || seriesName == 'OPTIDX') {
        seriesName = 'OPTIDX'
      } else {
        seriesName = "OPTSTK"
      }
    } else if (exchangeSegment == 3) {
      seriesName = 'OPTCUR'
    } else if (exchangeSegment == 51) {
      seriesName = 'OPTFUT'
    }
    const uniqueSegmentKey = `${exchangeSegment}${req.body.Name}`
    const checkHasKey = await redisclient.exists(uniqueSegmentKey)
    // console.log('req.headers', req.headers)
    // if(checkHasKey) {
    //   console.log('future dates from redis')
    //   let getStringJson = await redisclient.get(uniqueSegmentKey)
    //   res.send(JSON.parse(getStringJson))
    // } else {
      
    // console.log('pradeep1',req.body.Series_Key, `${process.env.APIMarketDataURL}/instruments/instrument/expiryDate?exchangeSegment=${exchangeSegment}&series=${seriesName}&symbol=${req.body.Name}`)

    const getresponse = await axios.get(`${process.env.APIMarketDataURL}/instruments/instrument/expiryDate?exchangeSegment=${exchangeSegment}&series=${seriesName}&symbol=${req.body.Name}`)  
    var monthNames = [ "January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December" ];
    let getresponses = [...new Set(getresponse.data.result)]
    getresponses.sort()
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const finalResponse = []
    const instruments = []
    for(sno=0;sno<getresponses.length;sno++) {
      let d = new Date(getresponses[sno])
      const FullData = {value:`${String(d.getDate())+String(months[d.getMonth()])+String(d.getFullYear())}`, label: `${String(d.getDate())} ${String(months[d.getMonth()])}`, dataformat: `${String(d.getDate())+'/'+String(d.getMonth()+1 > 10?d.getMonth()+1:'0'+(d.getMonth()+1))+'/'+String(d.getFullYear())}`, monthname: monthNames[d.getMonth()], newKey: `${String(d.getDate()<10?'0'+d.getDate():d.getDate())+String(months[d.getMonth()])+String(d.getFullYear())}`, label: `${String(d.getDate())} ${String(months[d.getMonth()])}`,stringData:getresponses[sno]}
      // console.log('pradeep',req.body.Series_Key, `${process.env.APIMarketDataURL}/instruments/instrument/futureSymbol?exchangeSegment=${exchangeSegment}&series=${series}&symbol=${req.body.Name}&expiryDate=${FullData.newKey}`)
      // const getFutureDateResponse = await axios.get(`${process.env.APIMarketDataURL}/instruments/instrument/optionSymbol?exchangeSegment=${exchangeSegment}&series=${series}&symbol=${req.body.Name}&expiryDate=${FullData.newKey}&optionType=CE&strikePrice=7200`)
      // // const getFutureDateResponse = await axios.get(`${process.env.APIMarketDataURL}/instruments/instrument/futureSymbol?exchangeSegment=${exchangeSegment}&series=${series}&symbol=${req.body.Name}&expiryDate=${FullData.newKey}`)
      // let response1 = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`, {
      //     instruments: [{exchangeSegment: getFutureDateResponse.data.result.ExchangeSegment, exchangeInstrumentID: getFutureDateResponse.data.result.ExchangeInstrumentID }],
      //     xtsMessageCode: 1502,
      //     publishFormat: "JSON"
      // }, {
      //     headers: {
      //         authorization: req.headers.authorization
      //     }
      // })
      // finalResponse.push({...FullData, allAbout: {...getFutureDateResponse.data.result, ...JSON.parse(response1.data.result.listQuotes[0])}})
      finalResponse.push({...FullData})
    }
      await redisclient.set(uniqueSegmentKey, JSON.stringify(finalResponse))
      res.send(finalResponse)
    // }
  } catch(error) {
    console.log(error)
    res.send({"status":"error"})
  }
})

app.post('/v1/get-future-dates/', async (req, res) =>{

  try {
    let seriesName
    let exchangeSegment = req.body.ExchangeSegment
    if(req.body.Series_Key) {
      seriesName = req.body.Series_Key
    } else {
      seriesName = req.body.Series
    }
    if(seriesName=='EQ'){
      exchangeSegment = '2'
      seriesName = 'FUTSTK'
    } 
    const uniqueSegmentKey = `${exchangeSegment}${req.body.Name}`
    const checkHasKey = await redisclient.exists(uniqueSegmentKey)
    // console.log('req.headers', req.headers)
    // if(checkHasKey) {
    //   console.log('future dates from redis')
    //   let getStringJson = await redisclient.get(uniqueSegmentKey)
    //   res.send(JSON.parse(getStringJson))
    // } else {
    // console.log('pradeep1',req.body.Series, `${process.env.APIMarketDataURL}/instruments/instrument/expiryDate?exchangeSegment=${exchangeSegment}&series=${seriesName}&symbol=${req.body.Name}`)
    const getresponse = await axios.get(`${process.env.APIMarketDataURL}/instruments/instrument/expiryDate?exchangeSegment=${exchangeSegment}&series=${seriesName}&symbol=${req.body.Name}`)  
    var monthNames = [ "January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December" ];
    let getresponses = [...new Set(getresponse.data.result)]
    getresponses.sort()
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const finalResponse = []
    const instruments = []
    for(sno=0;sno<getresponses.length;sno++) {
      let d = new Date(getresponses[sno])
      const FullData = {value:`${String(d.getDate())+String(months[d.getMonth()])+String(d.getFullYear())}`, label: `${String(d.getDate())} ${String(months[d.getMonth()])}`, dataformat: `${String(d.getDate())+'/'+String(d.getMonth()+1 > 10?d.getMonth()+1:'0'+(d.getMonth()+1))+'/'+String(d.getFullYear())}`, monthname: monthNames[d.getMonth()], newKey: `${String(d.getDate()<10?'0'+d.getDate():d.getDate())+String(months[d.getMonth()])+String(d.getFullYear())}`, label: `${String(d.getDate())} ${String(months[d.getMonth()])}`}
      // https://developers.symphonyfintech.in/marketdata/instruments/instrument/futureSymbol?exchangeSegment=2&series=FUTIDX&symbol=FTSE100&expiryDate=20Sep2019
      // console.log('pradeep',req.body.Series, `${process.env.APIMarketDataURL}/instruments/instrument/futureSymbol?exchangeSegment=${exchangeSegment}&series=${seriesName}&symbol=${req.body.Name}&expiryDate=${FullData.newKey}`)

      const getFutureDateResponse = await axios.get(`${process.env.APIMarketDataURL}/instruments/instrument/futureSymbol?exchangeSegment=${exchangeSegment}&series=${seriesName}&symbol=${req.body.Name}&expiryDate=${FullData.newKey}`)

      let response1 = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`, {
          instruments: [{exchangeSegment: getFutureDateResponse.data.result.ExchangeSegment, exchangeInstrumentID: getFutureDateResponse.data.result.ExchangeInstrumentID }],
          xtsMessageCode: 1502,
          publishFormat: "JSON"
      }, {
          headers: {
              authorization: req.headers.authorization
          }
      })
      finalResponse.push({...FullData, allAbout: {...getFutureDateResponse.data.result, ...JSON.parse(response1.data.result.listQuotes[0])}})
    }
    await redisclient.set(uniqueSegmentKey, JSON.stringify(finalResponse))
    res.send(finalResponse)
  // }
  } catch(error) {
    console.log(error)
    res.send({"status":"error"})
  }
})

app.get('/v1/optional-chain/scannerindex', async (req, res) => {
  try{
    const IndexStocks = [{Name:'NIFTY',Id:26000,Segment:1},{Name:'BANKNIFTY',Id:26001,Segment:1},{Name:'FINNIFTY',Id:26034,Segment:1}]
      const getName = await AppConfigModel.findOne({where: {eventName:"IndexTypeSenseCollectionName"}})
      const TYPESENSECOLLECTIONNAME = getName.eventValue
      const FinalArray=[]
      for(let sno = 0; sno < IndexStocks.length; sno++){
        const x = IndexStocks[sno];
        let searchParameters = {
          "q": `${x.Name}`,
          'query_by': 'Name',
          'per_page':250,
        }
        console.log(TYPESENSECOLLECTIONNAME);
        const getdata = await client
            .collections(TYPESENSECOLLECTIONNAME)
            .documents()
            .search(searchParameters);
//        const finaldataMap = getdata.hits.map((x) => {
//          return x.document
//        });
	const finaldataMap = getdata.hits
	console.log(finaldataMap)
	for(let sno=0;sno < finaldataMap.length;sno++){
	  console.log("in")
	  const x=finaldataMap[sno];
	  console.log(x.document)
	  FinalArray.push(x.document)
	}
//        FinalArray.push(finaldataMap)
      }
      //***Check Collection Code Here***//
      // const v=await client.collections().retrieve()
      // if(v.length){
      //   console.log('iff');
      // }else{
      //   console.log("else");
      // }
      // const finaldataMap = v.map((x) => {
      //   console.log(x.name);
      // // return x.name
      // });
    res.send({status:"success",message:FinalArray})
    }catch (error) {
        console.log(error)
        res.send({status:"failed",message:[]})
    }
})
app.get('/v1/optional-chain/scanneroption', async (req, res) => {
  try{
    const IndexStocks = [
      {Name:'TCS',Id:11536,Segment:1},
      {Name:'RELIANCE',Id:2885,Segment:1},
      {Name:'SBIN',Id:3045,Segment:1},
      {Name:'HDFCBANK',Id:1333,Segment:1},
      {Name:'INDUSINDBK',Id:5258,Segment:1},
      {Name:'ICICIBANK',Id:4963,Segment:1},
      {Name:'KOTAKBANK',Id:1922,Segment:1},
      {Name:'INFY',Id:1594,Segment:1},
      {Name:'AXISBANK',Id:5900,Segment:1},
      {Name:'TATAMOTORS',Id:3456,Segment:1},
      {Name:'HINDALCO',Id:1363,Segment:1}
    ]
    const getName = await AppConfigModel.findOne({where: {eventName:"OptionTypeSenseCollectionName"}})
    const TYPESENSECOLLECTIONNAME = getName.eventValue
    const FinalArray=[]
    for(let sno = 0; sno < IndexStocks.length; sno++){
      const x = IndexStocks[sno];
      let searchParameters = {
        "q": `${x.Name}`,
        'query_by': 'Name',
        'per_page':250,
      }
      console.log(TYPESENSECOLLECTIONNAME);
      const getdata = await client
          .collections(TYPESENSECOLLECTIONNAME)
          .documents()
          .search(searchParameters);
//      const finaldataMap = getdata.hits.map((x) => {
//        return x.document
//      });
//      FinalArray.push(finaldataMap)
	const finaldataMap = getdata.hits
        for(let sno = 0; sno < finaldataMap.length; sno++){
          const x= finaldataMap[sno]
          FinalArray.push(x.document)
        }
    }
    //***Check Collection Code Here***//
    // const v=await client.collections().retrieve()
    // if(v.length){
    //   console.log('iff');
    // }else{
    //   console.log("else");
    // }
    // const finaldataMap = v.map((x) => {
    //   console.log(x.name);
    // // return x.name
    // });
    res.send({status:"success",message:FinalArray})
    }catch (error) {
        console.log(error)
        res.send({status:"failed",message:[]})
    }
})

app.get('/v1/optional-chain/currencies/:term', async (req, res) => {
  try{
    if(req.params.term=="fut"){
      console.log("Currencies Futures Innn");
      const Currencies = ['USDINR','EURINR','GBPINR','JPYINR']
      const getName = await AppConfigModel.findOne({where: {eventName:"CURFUTTypeSenseCollectionName"}})
      const TYPESENSECOLLECTIONNAME = getName.eventValue
      const FinalArray=[]
      for(let sno = 0; sno < Currencies.length; sno++){
        const x = Currencies[sno];
        let searchParameters = {
          "q": `${x}`,
          'query_by': 'Name',
          'per_page':250,
        }
        console.log(TYPESENSECOLLECTIONNAME);
        const getdata = await client
            .collections(TYPESENSECOLLECTIONNAME)
            .documents()
            .search(searchParameters);
        const finaldataMap = getdata.hits.map((x) => {
          return x.document
        });
        FinalArray.push(...finaldataMap)
      }
      res.send({ status: "success", message: FinalArray})

    }
    else if(req.params.term=="opt"){
      console.log("Currencies Options Innn");
      const Currencies = ['USDINR','EURINR','GBPINR','JPYINR']
      const getName = await AppConfigModel.findOne({where: {eventName:"CUROPTTypeSenseCollectionName"}})
      const TYPESENSECOLLECTIONNAME = getName.eventValue
      const FinalArray=[]
      for(let sno = 0; sno < Currencies.length; sno++){
        const x = Currencies[sno];
        let searchParameters = {
          "q": `${x}`,
          'query_by': 'Name',
          'per_page':250,
        }
        console.log(TYPESENSECOLLECTIONNAME);
        const getdata = await client
            .collections(TYPESENSECOLLECTIONNAME)
            .documents()
            .search(searchParameters);
        const finaldataMap = getdata.hits.map((x) => {
          return x.document
        });
        console.log(finaldataMap)
        FinalArray.push(...finaldataMap)
      }
      console.log(FinalArray)
      res.send({ status: "success", message: FinalArray})
    }else{
      res.status(400).send({ status: "failed", message: "something went wrong!!"})
    }
      //***Check Collection Code Here***//
      // const v=await client.collections().retrieve()
      // if(v.length){
      //   console.log('iff');
      // }else{
      //   console.log("else");
      // }
      // const finaldataMap = v.map((x) => {
      //   console.log(x.name);
      // // return x.name
      // });
    }catch (error) {
        console.log(error)
        res.send({ status: "failed", message:[]})
    }
})
app.get('/v1/optional-chain/commodity/:term', async (req, res) => {
  try{
    Commodity = ['GOLD','SILVER','CRUDEOIL','NATURALGAS','LEAD','ZINC','ALUMINIUM','COPPER']
    if(req.params.term=="fut"){
      console.log("Commodity Futures Innn");

      const getName = await AppConfigModel.findOne({where: {eventName:"COMDTYFUTTypeSenseCollectionName"}})
      const TYPESENSECOLLECTIONNAME = getName.eventValue
      const FinalArray=[]
      for(let sno = 0; sno < Commodity.length; sno++){
        const x = Commodity[sno];
        let searchParameters = {
          "q": `${x}`,
          'query_by': 'Name',
          'per_page':250,
        }
        console.log(TYPESENSECOLLECTIONNAME);
        const getdata = await client
            .collections(TYPESENSECOLLECTIONNAME)
            .documents()
            .search(searchParameters);
        const finaldataMap = getdata.hits.map((x) => {
          return x.document
        });
        FinalArray.push(...finaldataMap)
      }
      res.send({ status: "success", message: FinalArray})

    }
    else if(req.params.term=="opt"){
      console.log("Commodity Options Innn");
      const getName = await AppConfigModel.findOne({where: {eventName:"COMDTYOPTTypeSenseCollectionName"}})
      const TYPESENSECOLLECTIONNAME = getName.eventValue
      const FinalArray=[]
      for(let sno = 0; sno < Commodity.length; sno++){
        const x = Commodity[sno];
        let searchParameters = {
          "q": `${x}`,
          'query_by': 'Name',
          'per_page':250,
        }
        console.log(TYPESENSECOLLECTIONNAME);
        const getdata = await client
            .collections(TYPESENSECOLLECTIONNAME)
            .documents()
            .search(searchParameters);
        const finaldataMap = getdata.hits.map((x) => {
          return x.document
        });
        FinalArray.push(...finaldataMap)
      }
      res.send({ status: "success", message: FinalArray})
    }else{
      res.status(400).send({ status: "failed", message: "something went wrong!!"})
    }
      //***Check Collection Code Here***//
      // const v=await client.collections().retrieve()
      // if(v.length){
      //   console.log('iff');
      // }else{
      //   console.log("else");
      // }
      // const finaldataMap = v.map((x) => {
      //   console.log(x.name);
      // // return x.name
      // });
    }catch (error) {
        console.log(error)
        res.send({ status: "failed", message:[]})
    }
})

app.get('/v2/optional-chain/:term/:getexpirydate', async (req, res) => {
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
      const checkHasKey = await redisclient.exists(uniqueSearchKey)
      if(checkHasKey) {
        fromRedisKey = true
        console.log('serach from redis')
        let getStringJson = await redisclient.get(uniqueSearchKey)
        searchResult = JSON.parse(getStringJson)
      } else {
        console.log(`${process.env.APIMarketDataURL}/search/instruments?searchString=${req.params.term}`)
        const response = await axios.get(`${process.env.APIMarketDataURL}/search/instruments?searchString=${req.params.term}`, {
          headers: {
            "authorization": req.headers.authorization
          }
        })
        // console.log('response', response.data)
        searchResult = response.data.result
      }
      // console.log('searchResultsearchResultsearchResultsearchResult', searchResult)
      if (searchResult == undefined) {
        res.send([])
      } else {
        if(!fromRedisKey) {
          await redisclient.set(uniqueSearchKey, JSON.stringify(searchResult))
        }
        let getMkArray = []
        let getMkArrayCE = []

        let getPEArray = []
        let getCEArray = []

        // console.log('searchResultsearchResult', searchResult.length);
        for(let sno = 0; sno < searchResult.length; sno++){
          const x = searchResult[sno];
          if (x.OptionType == 4) {
            getMkArray.push({...x,exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
          } else {
            getMkArrayCE.push({...x,exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
          }
        }
        const getapidataPE = getMkArray.sort((a, b) => a.StrikePrice - b.StrikePrice)
        const getapidataCE = getMkArrayCE.sort((a, b) => a.StrikePrice - b.StrikePrice)
        const instrumentsIndex = getapidataPE.findIndex(x => x.StrikePrice > customprice)
        let instrumentsPE = getapidataPE.slice(instrumentsIndex - 10 < 0?0:instrumentsIndex - 10, instrumentsIndex + 10 )

        instrumentsIndex_forCustomPrice = instrumentsPE.findIndex(x => x.StrikePrice > customprice)
        instrumentsPE[instrumentsIndex_forCustomPrice].drawline = true
        let instrumentsCE = getapidataCE.slice(instrumentsIndex - 10 < 0?0:instrumentsIndex - 10, instrumentsIndex + 10 )
        // instrumentsCE[instrumentsIndex]['drawline'] = true
        // axios.all is another axios method which is used to run multiple api at a time (parallelly)
        const [responsePE,responseCE,responsePE1510,responseCE1510] = await axios.all([
          axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
            instruments:instrumentsPE,
            "xtsMessageCode": 1502,
            "publishFormat": "JSON"
          }, {
            headers: {
              "authorization": req.headers.authorization
            }
          }), 
          axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
            instruments:instrumentsCE,
            "xtsMessageCode": 1502,
            "publishFormat": "JSON"
          }, {
            headers: {
              "authorization": req.headers.authorization
            }
          }),
          axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
            instruments:instrumentsPE,
            "xtsMessageCode": 1510,
            "publishFormat": "JSON"
          }, {
            headers: {
              "authorization": req.headers.authorization
            }
          }),
          axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
            instruments:instrumentsCE,
            "xtsMessageCode": 1510,
            "publishFormat": "JSON"
          }, {
            headers: {
              "authorization": req.headers.authorization
            }
          })
        ])
        const QuotesForPE = responsePE.data.result.listQuotes
        const QuotesForCE = responseCE.data.result.listQuotes
        const QuotesForPE1510 = responsePE1510.data.result.listQuotes
        const QuotesForCE1510 = responseCE1510.data.result.listQuotes
        console.log('Api End Start ',  new Date())
        // const instruments = instrumentsPE.concat(instrumentsCE)
        instrumentsPE = instrumentsPE.map((x , i) =>{     
          const getPE = QuotesForPE1510.filter(mk =>  {
            if(mk) {
              const getJsonData = JSON.parse(mk)
              if(getJsonData.ExchangeSegment == x.ExchangeSegment && getJsonData.ExchangeInstrumentID == x.ExchangeInstrumentID) {
                return true
              }
            }
          })
          return {...JSON.parse(QuotesForPE[i]?QuotesForPE[i]:'{}'),...JSON.parse(getPE && getPE[0]?getPE[0]:'{}'),...x}
          // return {...x}
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
          // return {...x}
        })
        res.json({ "PE": instrumentsPE,"CE": instrumentsCE })
      }
    } catch (error) {
      console.log(error)
      res.send([])
    }
  }
})

app.get('/v1/optional-chain/:term/:getexpirydate', async (req, res) => {
  console.log('start_date_optional_chain', new Date())
  if (req.params.term == '') {
    res.send([])
  } else {
    const customprice = req.headers.customprice
    try {
      let searchResult = []
        console.log(`${process.env.APIMarketDataURL}/search/instruments?searchString=${req.params.term}`)
        const response = await axios.get(`${process.env.APIMarketDataURL}/search/instruments?searchString=${req.params.term}`, {
          headers: {
            "authorization": req.headers.authorization
          }
        })
        searchResult = response.data.result
	//console.log("search string Api length",searchResult.length)
      // }
      if (searchResult == undefined) {
	console.log("coming In Undefined ifff")
        res.send([])
      } else {
        let getMkArray = []
        let getMkArrayCE = []
        
        for(let sno = 0; sno < searchResult.length; sno++){
          const x = searchResult[sno];
          if(x.ContractExpiration == req.params.getexpirydate){
            if (x.OptionType == 4) {
              getMkArray.push({...x,exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
            } else if(x.OptionType == 3) {
              getMkArrayCE.push({...x,exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
            }
          }
        }

        const getapidataPE = getMkArray.sort((a, b) => a.StrikePrice - b.StrikePrice)
        const getapidataCE = getMkArrayCE.sort((a, b) => a.StrikePrice - b.StrikePrice)

        const instrumentsIndexPE = getapidataPE.findIndex(x => x.StrikePrice > customprice)
        const instrumentsIndexCE = getapidataCE.findIndex(x => x.StrikePrice > customprice)
        let instrumentsPE = getapidataPE.slice(instrumentsIndexPE - 10 < 0?0:instrumentsIndexPE - 10, instrumentsIndexPE + 10 )
        console.log('after slice instrumentsPE', instrumentsPE.length)
//        instrumentsIndex_forCustomPrice = instrumentsPE.findIndex(x => x.StrikePrice > customprice)
//        instrumentsPE[instrumentsIndex_forCustomPrice].drawline = true
        let instrumentsCE = getapidataCE.slice(instrumentsIndexCE - 10 < 0?0:instrumentsIndexCE - 10, instrumentsIndexCE + 10 )
	      console.log("instruments data",instrumentsPE,instrumentsCE)
        const [responsePE,responseCE] = await axios.all([
          axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
            instruments:instrumentsPE,
            "xtsMessageCode": 1502,
            "publishFormat": "JSON"
          }, {
            headers: {
              "authorization": req.headers.authorization
            }
          }), 
          axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
            instruments:instrumentsCE,
            "xtsMessageCode": 1502,
            "publishFormat": "JSON"
          }, {
            headers: {
              "authorization": req.headers.authorization
            }
          })
        ])
        console.log('Api End Start ',  new Date())
	      console.log("data2",responsePE,responseCE)

        const QuotesForPE = responsePE.data.result.listQuotes
        const QuotesForCE = responseCE.data.result.listQuotes
        instrumentsPE = instrumentsPE.map((x , i) =>{     
          const getPEQuote = QuotesForPE.filter(mk =>  {
            if(mk) {
              const getJsonData = JSON.parse(mk)
              if(getJsonData.ExchangeSegment == x.ExchangeSegment && getJsonData.ExchangeInstrumentID == x.ExchangeInstrumentID) {
                return true
              }
            }
          })
         
          const Touchline  = JSON.parse(getPEQuote && getPEQuote[0]?getPEQuote[0]:'{}')
          return {Touchline: {LastTradedPrice:Touchline.Touchline?Touchline.Touchline.LastTradedPrice:0,PercentChange:Touchline.Touchline?Touchline.Touchline.PercentChange:0},...x,PriceBand: null}
        })

        instrumentsCE = instrumentsCE.map((x , i) =>{
          
          const getCEQuote = QuotesForCE.filter(mk =>  {
            if(mk) {
              const getJsonData = JSON.parse(mk)
              if(getJsonData.ExchangeSegment == x.ExchangeSegment && getJsonData.ExchangeInstrumentID == x.ExchangeInstrumentID) {
                return true
              }
            }
          })

          const Touchline = JSON.parse(getCEQuote && getCEQuote[0]?getCEQuote[0]:'{}')
          return {Touchline: {LastTradedPrice:Touchline.Touchline?Touchline.Touchline.LastTradedPrice:0,PercentChange:Touchline.Touchline?Touchline.Touchline.PercentChange:0},...x, PriceBand: null}
        })
        // extracting the required data from the both CE and PE for better performance
        const extractedOptionalChain = instrumentsCE.map((data, index) => {
          console.log('saroooo', data)
          return {
            [String(instrumentsPE[index].exchangeSegment)+String(instrumentsPE[index].exchangeInstrumentID)]:'PeData',
            PeData: instrumentsPE[index],
            StrikePrice: data.StrikePrice,
            [String(data.exchangeSegment)+String(data.exchangeInstrumentID)]:'CeData',
            CeData: data
          }
        })
	console.log("res.send data",extractedOptionalChain)
        res.json({ extractedOptionalChain })
        console.log('end_date_optional_chain', new Date())
      }
    } catch (error) {
      console.log(error)
      res.send([])
    }
  }
})
app.get('/v1/optional-chain-oi/:term/:getexpirydate', async (req, res) => {
  // console.log('start_date_optional_chain-oi', new Date())
  console.log(req.params.term,req.params.getexpirydate);
  if (req.params.term == '') {
    res.send([])
  } else {
    const customprice = req.headers.customprice
    try {
      let searchResult = []
        //console.log(`${process.env.APIMarketDataURL}/search/instruments?searchString=${req.params.term}`)
        const response = await axios.get(`${process.env.APIMarketDataURL}/search/instruments?searchString=${req.params.term}`, {
          headers: {
            "authorization": req.headers.authorization
          }
        })
        searchResult = response.data.result
      // }
      if (searchResult == undefined) {
        res.send([])
      } else {
        let getMkArray = []
        let getMkArrayCE = []
        
        for(let sno = 0; sno < searchResult.length; sno++){
          const x = searchResult[sno];
          if(x.ContractExpiration == req.params.getexpirydate){
            if (x.OptionType == 4 && x.Name ==req.params.term) {
              getMkArray.push({...x,exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
            } else if(x.OptionType == 3 && x.Name ==req.params.term) {
              getMkArrayCE.push({...x,exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
            }
          }
        }

        const getapidataPE = getMkArray.sort((a, b) => a.StrikePrice - b.StrikePrice)
        const getapidataCE = getMkArrayCE.sort((a, b) => a.StrikePrice - b.StrikePrice)

        const instrumentsIndexPE = getapidataPE.findIndex(x => x.StrikePrice > customprice)
        const instrumentsIndexCE = getapidataCE.findIndex(x => x.StrikePrice > customprice)
        let instrumentsPE = getapidataPE.slice(instrumentsIndexPE - 10 < 0?0:instrumentsIndexPE - 10, instrumentsIndexPE + 10 )
        //console.log('after slice instrumentsPE', instrumentsPE.length)
//        instrumentsIndex_forCustomPrice = instrumentsPE.findIndex(x => x.StrikePrice > customprice)
//        instrumentsPE[instrumentsIndex_forCustomPrice].drawline = true
        let instrumentsCE = getapidataCE.slice(instrumentsIndexCE - 10 < 0?0:instrumentsIndexCE - 10, instrumentsIndexCE + 10 )
	//console.log('instrumentsCE',instrumentsCE)
        const [responsePE1510,responseCE1510,responsePE,responseCE,searchbyidresPE,searchbyidresCE] = await axios.all([
          axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
            instruments:instrumentsPE,
            "xtsMessageCode": 1510,
            "publishFormat": "JSON"
          }, {
            headers: {
              "authorization": req.headers.authorization
            }
          }),
          axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
            instruments:instrumentsCE,
            "xtsMessageCode": 1510,
            "publishFormat": "JSON"
          }, {
            headers: {
              "authorization": req.headers.authorization
            }
          }),
          axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
            instruments:instrumentsPE,
            "xtsMessageCode": 1502,
            "publishFormat": "JSON"
          }, {
            headers: {
              "authorization": req.headers.authorization
            }
          }), 
          axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
            instruments:instrumentsCE,
            "xtsMessageCode": 1502,
            "publishFormat": "JSON"
          }, {
            headers: {
              "authorization": req.headers.authorization
            }
          }),
	  axios.post(`${process.env.APIMarketDataURL}/search/instrumentsbyid`,{
            instruments:instrumentsPE,
          }, {
            headers: {
              "authorization": req.headers.authorization
            }
          }),
	 axios.post(`${process.env.APIMarketDataURL}/search/instrumentsbyid`,{
            instruments:instrumentsCE,
          }, {
            headers: {
              "authorization": req.headers.authorization
            }
          })
        ])
// console.log('responsePE1510.data',responsePE1510.data)
// console.log('responseCE1510.data',responseCE1510.data)
// console.log('responseCE.data',responseCE.data)
// console.log('responsePE.data',responsePE.data)
// console.log('searchbyidresCE.data',searchbyidresCE.data)
// console.log('searchbyidresPE.data',searchbyidresPE.data)
        // console.log('Api End Start ',  new Date())
        const QuotesForPE1510 = responsePE1510.data.result.listQuotes
        const QuotesForCE1510 = responseCE1510.data.result.listQuotes
        const QuotesForPE = responsePE.data.result.listQuotes
        const QuotesForCE = responseCE.data.result.listQuotes
	const instrumentsByIdResPE = searchbyidresPE.data.result
	const instrumentsByIdResCE = searchbyidresCE.data.result
        instrumentsPE = instrumentsPE.map((x , i) =>{     
          const getPE = QuotesForPE1510.filter(mk =>  {
            if(mk) {
              const getJsonData = JSON.parse(mk)
              if(getJsonData.ExchangeSegment == x.ExchangeSegment && getJsonData.ExchangeInstrumentID == x.ExchangeInstrumentID) {
                return true
              }
            }
          })
          const getPEQuote = QuotesForPE.filter(mk =>  {
            if(mk) {
              const getJsonData = JSON.parse(mk)
              if(getJsonData.ExchangeSegment == x.ExchangeSegment && getJsonData.ExchangeInstrumentID == x.ExchangeInstrumentID) {
                return true
              }
            }
          })
	  const getPESearch = instrumentsByIdResPE.filter((PE)=>{
	     if(PE){
		  if(PE.ExchangeSegment == x.ExchangeSegment && PE.ExchangeInstrumentID == x.ExchangeInstrumentID){
		    return true
		  }
		}
	  })
	 const SearchData = getPESearch[0]
         
          const Touchline  = JSON.parse(getPEQuote && getPEQuote[0]?getPEQuote[0]:'{}')
// console.log('pradeep',Touchline.Bhavcopy,SearchData.Bhavcopy)
          const OpenInterest = JSON.parse(getPE && getPE[0]?getPE[0]:'{}')
          return {Touchline: {LastTradedPrice:Touchline.Touchline?Touchline.Touchline.LastTradedPrice:0,TotalTradedQuantity:Touchline.Touchline?Touchline.Touchline.TotalTradedQuantity:0,PercentChange:Touchline.Touchline?(((Touchline.Touchline.LastTradedPrice - SearchData.Bhavcopy.Close) / SearchData.Bhavcopy.Close) * 100):0,Close:SearchData.Bhavcopy.Close},OpenInterest: OpenInterest.OpenInterest?OpenInterest.OpenInterest:0,...x,PriceBand: null}
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

          const getCEQuote = QuotesForCE.filter(mk =>  {
            if(mk) {
              const getJsonData = JSON.parse(mk)
              if(getJsonData.ExchangeSegment == x.ExchangeSegment && getJsonData.ExchangeInstrumentID == x.ExchangeInstrumentID) {
                return true
              }
            }
          })
	const getCESearch = instrumentsByIdResCE.filter((CE)=>{
             if(CE){
                  if(CE.ExchangeSegment == x.ExchangeSegment && CE.ExchangeInstrumentID == x.ExchangeInstrumentID){
                    return true
                  }
                }
          })
         const SearchData = getCESearch[0]

          const Touchline = JSON.parse(getCEQuote && getCEQuote[0]?getCEQuote[0]:'{}')
          
          const OpenInterest = JSON.parse(getCE && getCE[0]?getCE[0]:'{}')
	// console.log('pradeep',Touchline.Bhavcopy,SearchData.Bhavcopy)
          return {Touchline: {LastTradedPrice:Touchline.Touchline?Touchline.Touchline.LastTradedPrice:0,TotalTradedQuantity:Touchline.Touchline?Touchline.Touchline.TotalTradedQuantity:0,PercentChange:Touchline.Touchline?(((Touchline.Touchline.LastTradedPrice - SearchData.Bhavcopy.Close) / SearchData.Bhavcopy.Close) * 100):0,Close:SearchData.Bhavcopy.Close},OpenInterest: OpenInterest.OpenInterest?OpenInterest.OpenInterest:0,...x, PriceBand: null}
        })
        // extracting the required data from the both CE and PE for better performance
        const extractedOptionalChain = instrumentsCE.map((data, index) => {
//          console.log('saroooo', data)
          return {
            [String(instrumentsPE[index].exchangeSegment)+String(instrumentsPE[index].exchangeInstrumentID)]:'PeData',
            PeData: instrumentsPE[index],
            StrikePrice: data.StrikePrice,
            [String(data.exchangeSegment)+String(data.exchangeInstrumentID)]:'CeData',
            CeData: data
          }
        })
        res.json({ extractedOptionalChain })
// console.log('option',{ extractedOptionalChain })
        // console.log('end_date_optional_chain_oi', new Date())
      }
    } catch (error) {
      console.log('error',error.message)
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
require('./socket_route_web')(io);

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
      console.log('socketconnection', connectData);
    });

    xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
      // console.log('get_stock_data_buyscreen', marketDepthData.ExchangeSegment,marketDepthData.ExchangeInstrumentID, marketDepthData.Touchline)
      socket.emit('get_stock_data_buyscreen', { ii: marketDepthData.ExchangeInstrumentID, price: marketDepthData.Touchline.LastTradedPrice, percentage: marketDepthData.Touchline.PercentChange, diff: marketDepthData.Touchline.LastTradedPrice - marketDepthData.Touchline.Close, openprice: marketDepthData.Touchline.Open, close: marketDepthData.Touchline.Close, Touchline: marketDepthData.Touchline })
    });

  })


})

// Market Status Testing //
  // xtsMarketDataWS = new XtsMarketDataWS(process.env.APIMarketDataURL);
  //   var socketInitRequest = {
  //     userID: 'TABTREE05',
  //     publishFormat: 'JSON',
  //     broadcastMode: 'Full',
  //     token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJUQUJUUkVFMDUiLCJtZW1iZXJJRCI6IkdJTEwiLCJzb3VyY2UiOiJFTlRFUlBSSVNFTU9CSUxFIiwiaWF0IjoxNjcyNjU0NTQwLCJleHAiOjE2NzI3NDA5NDB9.t56OIBtWwDawsvMcQuTbW8P4C5LRE1qJF0c7PVT68k8`, // Token Generated after successful LogIn
  //   };
  //   xtsMarketDataWS.init(socketInitRequest);

  //   xtsMarketDataWS.onExchangeTradingStatus(async (tradingStatus) => {
  //     console.log('marketStatus', tradingStatus);
  //     const tradingJson = JSON.stringify(tradingStatus)

  //     const insertMarketStatus = await marketStatusModel.create({
  //         exchange_segment: tradingStatus.ExchangeSegment,
  //         exchange_instrument_id: tradingStatus.ExchangeInstrumentID,
  //         market_type: tradingStatus.maketType,
  //         message: 'index Page',
  //         trading_session: tradingStatus.tradingSession,
  //         status_json: tradingJson
  //     })
  // });





HttpServer.listen(process.env.PORT, (req, res) => {
  console.log(`gill server up and running in \n port ${process.env.PORT} mode ${process.env.MODE}`)
})


