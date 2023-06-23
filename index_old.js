const express = require('express')
const app = express()
const HttpServer = require('http').createServer(app)
const { Server } = require('socket.io')
const io = new Server(HttpServer,{
  cors: '*'
})

app.use(express.json())

var XtsMarketDataAPI = require('xts-marketdata-api').XtsMarketDataAPI;
var XTSInteractive = require('xts-interactive-api').Interactive;
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

io.on('connection', async socket=>{
  console.log('device connected')
    socket.emit('welcome', 'welcome to live ')


    socket.on('run_tragingview', data =>{
      let logIn = await xtsMarketDataAPI.logIn(loginRequestLive);

    })


    socket.on('run_watchlist_custom_data', async data => {
      console.log('sfsdfs',data)


      let logIn = await xtsMarketDataAPI.logIn(loginRequestLive);
      // console.log(logIn)

      let response = await xtsMarketDataAPI.clientConfig();

    // console.log(response);

      let getInstrumentArray =  []
      let getInstrumentData = []

      data.forEach(data => {
        getInstrumentArray.push({ exchangeSegment: data.exchangeSegment,exchangeInstrumentID: data.exchangeInstrumentID})

        getInstrumentData.push({Name:data.Name, DisplayName: data.DisplayName, cname: data.cname, exchangeSegment: data.exchangeSegment,exchangeInstrumentID: data.exchangeInstrumentID})

      })

      socket.emit('get_stock_name', getInstrumentData)


    var XtsMarketDataWS = require('xts-marketdata-api').WS;
    xtsMarketDataWS = new XtsMarketDataWS('https://trade.gillbroking.com/marketdata');
    var socketInitRequest = {
    userID: 'VIP100',
    publishFormat: 'JSON',
    broadcastMode: 'Full',
    token: logIn.result.token, // Token Generated after successful LogIn
    };
    xtsMarketDataWS.init(socketInitRequest);


    let response1 = await xtsMarketDataAPI.subscription({
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

  //   var XtsMarketDataWS = require('xts-marketdata-api').WS;
  //   xtsMarketDataWS = new XtsMarketDataWS('https://trade.gillbroking.com/marketdata');
  //   var socketInitRequest = {
  //   userID: 'VIP100',
  //   publishFormat: 'JSON',
  //   broadcastMode: 'Full',
  //   token: logIn.result.token, // Token Generated after successful LogIn
  //   };
  //   xtsMarketDataWS.init(socketInitRequest);


  //   let getInstrumentArray =  []
  //   let getInstrumentData = []

  //   // loop watch list get segment details



  //   // getInstrumentArray.push({ exchangeSegment: 1,exchangeInstrumentID: 18564})
  //   // getInstrumentData.push({Name:'LTTS', DisplayName: 'LTTS', cname: 'L&T TECHNOLOGY SER. LTD.', exchangeSegment: 1,exchangeInstrumentID: 18564})


  //   // getInstrumentArray.push({ exchangeSegment: 1,exchangeInstrumentID: 11536})
  //   // getInstrumentData.push({Name:'TCS', DisplayName: 'TCS', cname: 'TATA CONSULTANCY SERV LT-EQ', exchangeSegment: 1,exchangeInstrumentID: 11536})


  //   // getInstrumentArray.push({ exchangeSegment: 1,exchangeInstrumentID: 1594})
  //   // getInstrumentData.push({Name:'INFY', DisplayName: 'INFY-AF', cname: 'INFOSYS LIMITED-AF', exchangeSegment: 1,exchangeInstrumentID: 1594})

  //   // getInstrumentArray.push({ exchangeSegment: 1,exchangeInstrumentID: 15083})

  //   // getInstrumentData.push({Name:'ADANIPORTS', DisplayName: 'ADANIPORTS', cname: 'ADANI PORT & SEZ LTD-EQ', exchangeSegment: 1,exchangeInstrumentID: 15083})

  //   // getInstrumentArray.push({ exchangeSegment: 1,exchangeInstrumentID: 2885})

  //   // getInstrumentData.push({Name:'RELIANCE', DisplayName: 'RELIANCE', cname: 'RELIANCE INDUSTRIES LTD-EQ', exchangeSegment: 1,exchangeInstrumentID: 2885})

  //   // getInstrumentArray.push({ exchangeSegment: 51,exchangeInstrumentID: 236952})


  //   // socket.emit('get_stock_name', getInstrumentData)


  //   let response1 = await xtsMarketDataAPI.subscription({
  //     instruments: getInstrumentArray,
  //     xtsMessageCode: 1502,
  //   });
  //   // console.log(response1)

  //   response1.result.listQuotes.forEach((data) => {
  //     let getjson = JSON.parse(data)
  //     // console.log(getjson.Touchline)
  //      socket.emit('get_stock_data', {ii:getjson.ExchangeInstrumentID,price: getjson.Touchline.LastTradedPrice, percentage: getjson.Touchline.PercentChange, diff: getjson.Touchline.LastTradedPrice - getjson.Touchline.Close, openprice: getjson.Touchline.Close, marketDepthData: getjson})
  //   })


  //   xtsMarketDataWS.onConnect((connectData) => {
  //     console.log(connectData);
  //   });

  //   // "marketDepthEvent" event listener
  //   xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
  //       // console.log('munishhhhh',marketDepthData)
  //       // socket.emit('get_stock_data', {ii:marketDepthData.ExchangeInstrumentID,price: marketDepthData.Touchline.LastTradedPrice, percentage: marketDepthData.Touchline.PercentChange, diff: marketDepthData.Touchline.LastTradedPrice - marketDepthData.Touchline.Close, openprice: marketDepthData.Touchline.Open, close: marketDepthData.Touchline.Close, marketDepthData})
  // });

  // //"openInterestEvent" event listener
  // xtsMarketDataWS.onOpenInterestEvent((openInterestData) => {
  //   // console.log('event2',openInterestData);
  // });

  // //"indexDataEvent" event listener
  // xtsMarketDataWS.onIndexDataEvent((indexData) => {
  //   // console.log('event3',indexData);
  // });

  // //"marketDepth100Event" event listener
  // xtsMarketDataWS.onMarketDepth100Event((marketDepth100Data) => {
  //   // console.log('event4',marketDepth100Data);
  // });

  // //"instrumentPropertyChangeEvent" event listener
  // xtsMarketDataWS.onInstrumentPropertyChangeEvent(async (propertyChangeData) => {
  //   // console.log('event5',propertyChangeData, getInstrumentArray.length);
  // });

  // //"candleDataEvent" event listener
  // xtsMarketDataWS.onCandleDataEvent((candleData) => {
  //   // console.log('event6',candleData);
  // });

  // // //"logout" event listener
  // xtsMarketDataWS.onLogout((logoutData) => {
  //   // console.log('event7',logoutData);
  // });

})

io.of('/devsearchitem').on('connection', async socket=>{
  console.log('Dev Search selected data')

  // console.log(response);

  socket.on('run_marketdata', async data => {

    xtsMarketDataAPI_DEV_SEARCH = new XtsMarketDataAPI(
      'https://developers.symphonyfintech.in/apimarketdata'
    );

    var loginRequestSearch = {
        secretKey: "Dfff656$8y",
        appKey: "d79ac40818c562f9872853"
    };


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
          "exchangeSegment": data.singlesegmentdata.ExchangeSegment,
          "exchangeInstrumentID": data.singlesegmentdata.ExchangeInstrumentID
        }
      ]
    },{
      headers: headersList
    })

    console.log(instrumentiddata.data.result)

    // console.log('run_marketdatarun_marketdata')
    var XtsMarketDataWS = require('xts-marketdata-api').WS;
    // console.log("mk_check12")
    // console.log('token',data.token)
    xtsMarketDataWS = new XtsMarketDataWS('https://developers.symphonyfintech.in/apimarketdata');
    var socketInitRequest = {
    userID: 'TEST140',
    publishFormat: 'JSON',
    broadcastMode: 'Full',
    token: logIn.result.token, // Token Generated after successful LogIn
    };
    let segmentdata = instrumentiddata.data.result[0]
    console.log(segmentdata)
    xtsMarketDataWS.init(socketInitRequest);
    socket.emit('get_stock_name', {Name:segmentdata.Name, DisplayName: segmentdata.DisplayName, cname: segmentdata.Description, exchangeSegment: data.singlesegmentdata.ExchangeSegment,exchangeInstrumentID: data.singlesegmentdata.ExchangeInstrumentID, ExtendedMarketProperties: segmentdata.ExtendedMarketProperties,NameWithExchange: segmentdata.NameWithExchange})
    let response1 = await xtsMarketDataAPI_DEV_SEARCH.subscription({
      instruments: [
        {
          exchangeSegment: data.singlesegmentdata.ExchangeSegment,exchangeInstrumentID: data.singlesegmentdata.ExchangeInstrumentID
        }
      ],
      xtsMessageCode: 1502,
    });

    // console.log(response1)

    let getjson = JSON.parse(response1.result.listQuotes[0])
    socket.emit('get_stock_data', {ii:getjson.ExchangeInstrumentID,price: getjson.Touchline.LastTradedPrice, percentage: getjson.Touchline.PercentChange, diff: getjson.Touchline.LastTradedPrice - getjson.Touchline.Close, openprice: getjson.Touchline.Close, Touchline: getjson.Touchline, marketDepthData: getjson})

    xtsMarketDataWS.onConnect((connectData) => {
      console.log(connectData);
    });

    xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
      // console.log('marketdatass', marketDepthData)
      socket.emit('get_stock_data', {ii:marketDepthData.ExchangeInstrumentID,price: marketDepthData.Touchline.LastTradedPrice, percentage: marketDepthData.Touchline.PercentChange, diff: marketDepthData.Touchline.LastTradedPrice - marketDepthData.Touchline.Close, openprice: marketDepthData.Touchline.Open, close: marketDepthData.Touchline.Close, Touchline: marketDepthData.Touchline, marketDepthData})
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


io.of('/dev').on('connection', async socket=>{
  console.log('run_watchlist_custom_data')

  socket.on('run_client_order', data => {

  })

    socket.on('run_watchlist_custom_data', async data => {
      console.log('sfsdfs',data)
      let logIn = await xtsMarketDataAPI_DEV.logIn(loginRequestDEV);
      // console.log(logIn)

      // let response = await xtsMarketDataAPI_DEV.clientConfig();

    // console.log(response);

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


