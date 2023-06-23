const express = require('express')
const app = express()
const HttpServer = require('http').createServer(app)
const { Server } = require('socket.io')
const io = new Server(HttpServer,{
  cors: '*'
})

app.use(express.json())

app.use('/v1/', require('./route'))


var XtsMarketDataAPI = require('xts-marketdata-api').XtsMarketDataAPI;
var XTSInteractive_dev_main = require('xts-interactive-api').Interactive;
const axios = require("axios")

xtsMarketDataAPI = new XtsMarketDataAPI(
  'https://trade.gillbroking.com/marketdata'
);

var loginRequestLive = {
  secretKey: "Sopl771$XY",
  appKey: "845e1ca8b0f2d749d6e383"
};

app.get('/', (req, res) => {
  res.send("Gill Stock Server")
})

app.get('/search/:term', async (req, res) => {

  var loginRequestSearch = {
    secretKey: "Dfff656$8y",
    appKey: "d79ac40818c562f9872853"
  };

  const xtsMarketDataAPI = new XtsMarketDataAPI(
    'https://developers.symphonyfintech.in/apimarketdata'
  );

  let logIn = await xtsMarketDataAPI.logIn(loginRequestSearch);
  if(req.params.term == '') {
    res.send([])
  } else {
    try {
        const response = await axios.get(`https://developers.symphonyfintech.in/apimarketdata/search/instruments?searchString=${req.params.term}`, {
        headers: {
            "authorization": logIn.result.token
          }
        })
      if(response.data.result == undefined) {
        res.send([])
      } else {
        res.send(response.data.result.splice(0,10))
      }
    } catch(error) {
      console.log(error)
      res.send([])
    }
  }
})


io.of('/devsearchitem').on('connection', async socket=>{
  console.log('Dev Search selected data')

    // console.log('data',data)
    xtsMarketDataAPI_DEV_SEARCH = new XtsMarketDataAPI(
      'https://developers.symphonyfintech.in/apimarketdata'
    );
    var loginRequestSearch = {
        secretKey: "Dfff656$8y",
        appKey: "d79ac40818c562f9872853"
    };

  socket.on('run_marketdata', async data => {
    let logIn = await xtsMarketDataAPI_DEV_SEARCH.logIn(loginRequestSearch);

    // console.log(logIn)

    let headersList = {
      "Content-Type": "application/json",
      "Authorization": String(logIn.result.token)
    }

    const instrumentiddata = await axios.post('https://developers.symphonyfintech.in/apimarketdata/search/instrumentsbyid',{
      "source": "WebAPI",
      "UserID": "guest",
      "instruments": [
        {
          "exchangeSegment": data.singlesegmentdata.ExchangeSegment || data.singlesegmentdata.exchangeSegment,
          "exchangeInstrumentID": data.singlesegmentdata.ExchangeInstrumentID || data.singlesegmentdata.exchangeInstrumentID
        }
      ]
    },{
      headers: headersList
    })

    // console.log('instrumentiddata', instrumentiddata)

    var XtsMarketDataWS = require('xts-marketdata-api').WS;
    xtsMarketDataWS = new XtsMarketDataWS('https://developers.symphonyfintech.in/apimarketdata');
    var socketInitRequest = {
    userID: 'TEST140',
    publishFormat: 'JSON',
    broadcastMode: 'Full',
    token: logIn.result.token, // Token Generated after successful LogIn
    };
    let segmentdata = instrumentiddata.data.result[0]
    // console.log(segmentdata)
    xtsMarketDataWS.init(socketInitRequest);


    socket.emit('get_stock_name', {Name:segmentdata.Name, DisplayName: segmentdata.DisplayName, cname: segmentdata.Description, exchangeSegment: data.singlesegmentdata.ExchangeSegment || data.singlesegmentdata.exchangeSegment,exchangeInstrumentID: data.singlesegmentdata.ExchangeInstrumentID || data.singlesegmentdata.exchangeInstrumentID, ExtendedMarketProperties: segmentdata.ExtendedMarketProperties,NameWithExchange: segmentdata.NameWithExchange})
    let response1 = await xtsMarketDataAPI_DEV_SEARCH.subscription({
      instruments: [
        { 
          exchangeSegment: data.singlesegmentdata.ExchangeSegment ||  data.singlesegmentdata.exchangeSegment,exchangeInstrumentID: data.singlesegmentdata.ExchangeInstrumentID || data.singlesegmentdata.exchangeInstrumentID
        }
      ],
      xtsMessageCode: 1502,
    });


    let getjson = JSON.parse(response1.result.listQuotes[0])
    socket.emit('get_stock_data', {ii:getjson.ExchangeInstrumentID,price: getjson.Touchline.LastTradedPrice, percentage: getjson.Touchline.PercentChange, diff: getjson.Touchline.LastTradedPrice - getjson.Touchline.Close, openprice: getjson.Touchline.Close, Touchline: getjson.Touchline, marketDepthData: getjson})

    xtsMarketDataWS.onConnect((connectData) => {
      console.log(connectData);
    });

    xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
      socket.emit('get_stock_data', {ii:marketDepthData.ExchangeInstrumentID,price: marketDepthData.Touchline.LastTradedPrice, percentage: marketDepthData.Touchline.PercentChange, diff: marketDepthData.Touchline.LastTradedPrice - marketDepthData.Touchline.Close, openprice: marketDepthData.Touchline.Open, close: marketDepthData.Touchline.Close, Touchline: marketDepthData.Touchline, marketDepthData})
    });

  })


  socket.on('run_marketdata_buyscreen', async data => {
    let logIn = await xtsMarketDataAPI_DEV_SEARCH.logIn(loginRequestSearch);

    // console.log(logIn)

    let headersList = {
      "Accept": "*/*",
      "Content-Type": "application/json",
      "Authorization": logIn.result.token
    }

    const instrumentiddata = await axios.post('https://developers.symphonyfintech.in/apimarketdata/search/instrumentsbyid',{
      "source": "WebAPI",
      "UserID": "guest",
      "instruments": [
        {
          "exchangeSegment": data.singlesegmentdata.ExchangeSegment || data.singlesegmentdata.exchangeSegment,
          "exchangeInstrumentID": data.singlesegmentdata.ExchangeInstrumentID || data.singlesegmentdata.exchangeInstrumentID
        }
      ]
    },{
      headers: headersList
    })

    console.log('instrumentiddata', instrumentiddata.data.result)

    var XtsMarketDataWS = require('xts-marketdata-api').WS;
    xtsMarketDataWS = new XtsMarketDataWS('https://developers.symphonyfintech.in/apimarketdata');
    var socketInitRequest = {
    userID: 'TEST140',
    publishFormat: 'JSON',
    broadcastMode: 'Full',
    token: logIn.result.token, // Token Generated after successful LogIn
    };
    let segmentdata = instrumentiddata.data.result[0]
    // console.log(segmentdata)
    xtsMarketDataWS.init(socketInitRequest);


    socket.emit('get_stock_name_buyscreen', {Name:segmentdata.Name, DisplayName: segmentdata.DisplayName, cname: segmentdata.Description, exchangeSegment: data.singlesegmentdata.ExchangeSegment || data.singlesegmentdata.exchangeSegment,exchangeInstrumentID: data.singlesegmentdata.ExchangeInstrumentID || data.singlesegmentdata.exchangeInstrumentID, ExtendedMarketProperties: segmentdata.ExtendedMarketProperties,NameWithExchange: segmentdata.NameWithExchange})
    let response1 = await xtsMarketDataAPI_DEV_SEARCH.subscription({
      instruments: [
        { 
          exchangeSegment: data.singlesegmentdata.ExchangeSegment ||  data.singlesegmentdata.exchangeSegment,exchangeInstrumentID: data.singlesegmentdata.ExchangeInstrumentID || data.singlesegmentdata.exchangeInstrumentID
        }
      ],
      xtsMessageCode: 1502,
    });


    let getjson = JSON.parse(response1.result.listQuotes[0])
    socket.emit('get_stock_data_buyscreen', {ii:getjson.ExchangeInstrumentID,price: getjson.Touchline.LastTradedPrice, percentage: getjson.Touchline.PercentChange, diff: getjson.Touchline.LastTradedPrice - getjson.Touchline.Close, openprice: getjson.Touchline.Close, Touchline: getjson.Touchline})

    xtsMarketDataWS.onConnect((connectData) => {
      console.log(connectData);
    });

    xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
      // console.log('get_stock_data_buyscreen', marketDepthData.ExchangeSegment,marketDepthData.ExchangeInstrumentID, marketDepthData.Touchline)
      socket.emit('get_stock_data_buyscreen', {ii:marketDepthData.ExchangeInstrumentID,price: marketDepthData.Touchline.LastTradedPrice, percentage: marketDepthData.Touchline.PercentChange, diff: marketDepthData.Touchline.LastTradedPrice - marketDepthData.Touchline.Close, openprice: marketDepthData.Touchline.Open, close: marketDepthData.Touchline.Close, Touchline: marketDepthData.Touchline})
    });

  })


})

// dev server
xtsMarketDataAPI_DEV = new XtsMarketDataAPI(
  'https://developers.symphonyfintech.in/apimarketdata'
);

var loginRequestDEV = {
    secretKey: "Dfff656$8y",
    appKey: "d79ac40818c562f9872853"
};

let xtsInteractive_dev = new XTSInteractive_dev_main('https://developers.symphonyfintech.in');


io.of('/dev').on('connection', async socket=>{
  console.log('run_watchlist_custom_data')

    socket.on('run_client_order', async data => {
      let loginRequest = {
        secretKey: 'Rpqt871@HL',
        appKey: 'f80d52b3172e99a0044326',
        source: 'WEBAPI',
      };
      
      let logIn = await xtsInteractive_dev.logIn(loginRequest);
      console.log(logIn)
      let balance = await xtsInteractive_dev.getBalance();

      const getOrders = await axios.get('https://developers.symphonyfintech.in/interactive/orders', {
        headers: {
          Authorization: logIn.result.token
        }
      })

      // console.log('getOrders', getOrders.data)

      const getOrdersWithSegmentData = getOrders.data.map((x) => {
          console.log('orders',x)
      })


      socket.emit('load_orders', getOrders.data)

      // console.log(balance.result.BalanceList);

      var XTSInteractiveWS = require('xts-interactive-api').WS;
      xtsInteractiveWS = new XTSInteractiveWS(
        'https://developers.symphonyfintech.in'
      );
      var socketInitRequest = {
        userID: 'TEST140',
        token: logIn.result.token, // Token Generated after successful LogIn
      };
      xtsInteractiveWS.init(socketInitRequest);


      xtsInteractiveWS.onConnect((connectData) => {
        console.log('connectData', connectData);
      });

          //"joined" event listener
      xtsInteractiveWS.onJoined((joinedData) => {
        console.log(joinedData);
      });

      //"error" event listener
      xtsInteractiveWS.onError((errorData) => {
        console.log(errorData);
      });

      //"disconnect" event listener
      xtsInteractiveWS.onDisconnect((disconnectData) => {
        console.log('disconnectData', disconnectData);
      });

      //"order" event listener
      xtsInteractiveWS.onOrder((orderData) => {
        socket.emit('new_order', orderData)
        console.log('orderData',orderData);
      });

      //"trade" event listener
      xtsInteractiveWS.onTrade((tradeData) => {
        console.log(tradeData);
      });

      //"position" event listener
      xtsInteractiveWS.onPosition((positionData) => {
        console.log(positionData);
      });

      //"logout" event listener
      xtsInteractiveWS.onLogout((logoutData) => {
        console.log(logoutData);
      });


    })


      socket.on('run_client_executed_order', async data => {
        let loginRequest = {
          secretKey: 'Rpqt871@HL',
          appKey: 'f80d52b3172e99a0044326',
          source: 'WEBAPI',
        };
        
        let logIn = await xtsInteractive_dev.logIn(loginRequest);
        console.log(logIn)
        let balance = await xtsInteractive_dev.getBalance();
  
        const getOrders = await axios.get('https://developers.symphonyfintech.in/interactive/orders/trades', {
          headers: {
            Authorization: logIn.result.token
          }
        })

        socket.emit('load_executed_orders', getOrders.data.result)
  
      })

    socket.on('run_ohlc_data', async data => {
      // console.log('sfsdfs',data)
      let logIn = await xtsMarketDataAPI_DEV.logIn(loginRequestDEV);

      let getInstrumentArray =  []
      let getInstrumentData = []

      getInstrumentData.push({Name:'TCS', DisplayName: 'TCS', cname: 'TATA CONSULTANCY SERV LT-EQ', exchangeSegment: 1,exchangeInstrumentID: 11536})


      // data.forEach(data => {
      //   getInstrumentArray.push({ exchangeSegment: data.exchangeSegment,exchangeInstrumentID: data.exchangeInstrumentID})
      //   getInstrumentData.push({Name:data.Name, DisplayName: data.DisplayName, cname: data.cname, exchangeSegment: data.exchangeSegment,exchangeInstrumentID: data.exchangeInstrumentID})
      // })

      socket.emit('get_stock_name', getInstrumentData)

      var XtsMarketDataWS = require('xts-marketdata-api').WS;
      xtsMarketDataWS = new XtsMarketDataWS('https://developers.symphonyfintech.in/apimarketdata');
      var socketInitRequest = {
      userID: 'TEST140',
      publishFormat: 'JSON',
      broadcastMode: 'Full',
      token: logIn.result.token, // Token Generated after successful LogIn
      };
      xtsMarketDataWS.init(socketInitRequest);
      getInstrumentArray.push({ exchangeSegment: 1,exchangeInstrumentID: 11536})

      let response1 = await xtsMarketDataAPI_DEV.subscription({
        instruments: getInstrumentArray,
        xtsMessageCode: 1502,
      });
      console.log(response1)

  

      xtsMarketDataWS.onConnect((connectData) => {
        console.log(connectData);
      });

        // "marketDepthEvent" event listener
      xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
          // console.log('munishhhhh',marketDepthData)
          socket.emit('get_stock_data', {ii:marketDepthData.ExchangeInstrumentID,price: marketDepthData.Touchline.LastTradedPrice, percentage: marketDepthData.Touchline.PercentChange, diff: marketDepthData.Touchline.LastTradedPrice - marketDepthData.Touchline.Close, openprice: marketDepthData.Touchline.Open, close: marketDepthData.Touchline.Close, marketDepthData})
      });

      //"openInterestEvent" event listener
      xtsMarketDataWS.onOpenInterestEvent((openInterestData) => {
        console.log('event2',openInterestData);
      });

      //"indexDataEvent" event listener
      xtsMarketDataWS.onIndexDataEvent((indexData) => {
        console.log('event3',indexData);
      });

      //"marketDepth100Event" event listener
      xtsMarketDataWS.onMarketDepth100Event((marketDepth100Data) => {
        console.log('event4',marketDepth100Data);
      });

      //"instrumentPropertyChangeEvent" event listener
      xtsMarketDataWS.onInstrumentPropertyChangeEvent(async (propertyChangeData) => {
        // console.log('event5',propertyChangeData, getInstrumentArray.length);
      });

      //"candleDataEvent" event listener
      xtsMarketDataWS.onCandleDataEvent((candleData) => {
        console.log('event6',candleData);
      });

      // //"logout" event listener
      xtsMarketDataWS.onLogout((logoutData) => {
        // console.log('event7',logoutData);
      });
    })


    socket.on('run_watchlist_custom_data', async data => {
      console.log('sfsdfs',data)
      let logIn = await xtsMarketDataAPI_DEV.logIn(loginRequestDEV);

      let getInstrumentArray =  []
      let getInstrumentData = []

      data.forEach(data => {
        getInstrumentArray.push({ exchangeSegment: data.exchangeSegment,exchangeInstrumentID: data.exchangeInstrumentID})
        getInstrumentData.push({Name:data.Name, DisplayName: data.DisplayName, cname: data.cname, exchangeSegment: data.exchangeSegment,exchangeInstrumentID: data.exchangeInstrumentID})
      })

      socket.emit('get_stock_name', getInstrumentData)

      var XtsMarketDataWS = require('xts-marketdata-api').WS;
      xtsMarketDataWS = new XtsMarketDataWS('https://developers.symphonyfintech.in/apimarketdata');
      var socketInitRequest = {
      userID: 'TEST140',
      publishFormat: 'JSON',
      broadcastMode: 'Full',
      token: logIn.result.token, // Token Generated after successful LogIn
      };
      xtsMarketDataWS.init(socketInitRequest);


      let response1 = await xtsMarketDataAPI_DEV.subscription({
        instruments: getInstrumentArray,
        xtsMessageCode: 1502,
      });
      // console.log(response1)

      response1.result.listQuotes.forEach((data) => {
        let getjson = JSON.parse(data)
        // console.log(getjson.Touchline)
        socket.emit('get_stock_data', {ii:getjson.ExchangeInstrumentID,price: getjson.Touchline.LastTradedPrice, percentage: getjson.Touchline.PercentChange, diff: getjson.Touchline.LastTradedPrice - getjson.Touchline.Close, openprice: getjson.Touchline.Close, marketDepthData: getjson})
      })


      xtsMarketDataWS.onConnect((connectData) => {
        console.log(connectData);
      });

        // "marketDepthEvent" event listener
        xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
            // console.log('munishhhhh',marketDepthData)
            socket.emit('get_stock_data', {ii:marketDepthData.ExchangeInstrumentID,price: marketDepthData.Touchline.LastTradedPrice, percentage: marketDepthData.Touchline.PercentChange, diff: marketDepthData.Touchline.LastTradedPrice - marketDepthData.Touchline.Close, openprice: marketDepthData.Touchline.Open, close: marketDepthData.Touchline.Close, marketDepthData})
      });

      //"openInterestEvent" event listener
      xtsMarketDataWS.onOpenInterestEvent((openInterestData) => {
        // console.log('event2',openInterestData);
      });

      //"indexDataEvent" event listener
      xtsMarketDataWS.onIndexDataEvent((indexData) => {
        // console.log('event3',indexData);
      });

      //"marketDepth100Event" event listener
      xtsMarketDataWS.onMarketDepth100Event((marketDepth100Data) => {
        // console.log('event4',marketDepth100Data);
      });

      //"instrumentPropertyChangeEvent" event listener
      xtsMarketDataWS.onInstrumentPropertyChangeEvent(async (propertyChangeData) => {
        // console.log('event5',propertyChangeData, getInstrumentArray.length);
      });

      //"candleDataEvent" event listener
      xtsMarketDataWS.onCandleDataEvent((candleData) => {
        // console.log('event6',candleData);
      });

      // //"logout" event listener
      xtsMarketDataWS.onLogout((logoutData) => {
        // console.log('event7',logoutData);
      });
    })
})


HttpServer.listen(4400)


