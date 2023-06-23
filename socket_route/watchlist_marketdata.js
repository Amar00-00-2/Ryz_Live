var XtsMarketDataWS = require('xts-marketdata-api').WS;
var XtsMarketDataAPI = require('xts-marketdata-api').XtsMarketDataAPI;
const axios = require('axios')
const { globalexchangesegment } = require('../config')

const { subscriptionTrackingModel } = require('../model')

const { robotData } = require('./myevents')

let lastsegmentArray = []

module.exports = (io) => {
  const ioconnection = io.of('/search/marketdata')
  ioconnection.on('connect', async (socket) => {
    console.log("/search/marketdata socket connected..")
    let userId = 'unknown'

    socket.on('run_marketdata', async (data, userSessionData) => {
      userId = userSessionData.clientdata.ClientId;
//      console.log('search marketdata connected', userId)
//      console.log('saroUserData', userSessionData)

      const headersSetupMarket = {
        headers: {
          'authorization': userSessionData.marketdataclientsession
        }
      }
      // add new object to existing object -START //
      try {
        const getQuotesResponse = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`, {
              instruments: [
                {
                  "exchangeSegment":data.singlesegmentdata.exchangeSegment || data.singlesegmentdata.ExchangeSegment,
                  "exchangeInstrumentID": data.singlesegmentdata.ExchangeInstrumentID || data.singlesegmentdata.exchangeInstrumentID
                }
              ],
              xtsMessageCode: 1502,
              publishFormat: "JSON"
            }, headersSetupMarket)
        const quotesData = getQuotesResponse.data.result.listQuotes
        // console.log("getQuotesResponse", quotesData)
        let object1 = []
        for(let i = 0; i < quotesData.length; i++) {
            const data1 = JSON.parse(quotesData[i])
            object1.push(data1)
        }
//        console.log("object1", object1)
        const prevCloseResponse = await axios.post(`${process.env.APIInteractiveURL}/enterprise/instruments/bhavcopy`, {
          instruments: [
            {
              "exchangeSegment":data.singlesegmentdata.exchangeSegment || data.singlesegmentdata.ExchangeSegment,
              "exchangeInstrumentID": data.singlesegmentdata.ExchangeInstrumentID || data.singlesegmentdata.exchangeInstrumentID
            }
          ],
        }, headersSetupMarket)
        const prevCloseData = prevCloseResponse.data.result
//        console.log('prevCloseResponse', prevCloseData)

        let arrayList = []
        for(var i in object1) {
            var obj = object1[i]

            for(var j in prevCloseData) {
                if(object1[i].ExchangeInstrumentID == prevCloseData[j].instrumentID) {
                    obj.prevClosePrice = prevCloseData[j].bhavCopyData.Close
                }
            }
            arrayList.push(obj)
            socket.emit('get_stock_data', obj)
        }
        // socket.emit('get_stock_data', arrayList)
//        console.log('resultObject', arrayList)
    } catch (error) {
        console.log(error)
    }
    // add new object to existing object -END //
      // Previous Close Price API -START//
      try {
        let prevCloseResponse = await axios.post(`${process.env.APIInteractiveURL}/enterprise/instruments/bhavcopy`, {
          instruments: [
            {
              "exchangeSegment":data.singlesegmentdata.exchangeSegment || data.singlesegmentdata.ExchangeSegment,
              "exchangeInstrumentID": data.singlesegmentdata.ExchangeInstrumentID || data.singlesegmentdata.exchangeInstrumentID
            }
          ],
        }, headersSetupMarket)
//        console.log('saroPrev', prevCloseResponse.data.result)
        const prevCloseData = prevCloseResponse.data.result
        for( let i=0; i < prevCloseData.length; i++) {
          const closePrice = prevCloseData[i]
//          console.log('closePrice', closePrice)
          socket.emit('get_prevclose_price', closePrice)
        }
      } catch (error) {
        console.log('prevCloseError', error)
      }
      // Previous Close Price API -END//
      
      // get default 1502 or marketdata
      try{
        let response1 = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`, {
            instruments: [
              {
                "exchangeSegment":data.singlesegmentdata.exchangeSegment || data.singlesegmentdata.ExchangeSegment,
                "exchangeInstrumentID": data.singlesegmentdata.ExchangeInstrumentID || data.singlesegmentdata.exchangeInstrumentID
              }
            ],
            // ,...peersdata
            xtsMessageCode: 1502,
            publishFormat: "JSON"
        }, headersSetupMarket)

        response1.data.result.listQuotes.forEach((data) => {
          let getjson = JSON.parse(data)
          // console.log('getjson', getjson)
          socket.emit('get_ltp_data', {LastTradedPrice: getjson.Touchline.LastTradedPrice, Close: getjson.Touchline.Close, PercentChange: getjson.Touchline.PercentChange, ExchangeSegment: getjson.ExchangeSegment, ExchangeInstrumentID: getjson.ExchangeInstrumentID})
          // socket.emit('get_stock_data', getjson)
        })
      } catch(error) {
        console.log(error)
      }

      // get default 1510 or open interest (OI)
      try{
        let response1 = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`, {
            instruments: [
              {
                "exchangeSegment":data.singlesegmentdata.exchangeSegment || data.singlesegmentdata.ExchangeSegment ,
                "exchangeInstrumentID": data.singlesegmentdata.ExchangeInstrumentID || data.singlesegmentdata.exchangeInstrumentID
              }
            ],
            // ,...peersdata
            xtsMessageCode: 1510,
            publishFormat: "JSON"
        }, headersSetupMarket)

        response1.data.result.listQuotes.forEach((data) => {
            let getjson = JSON.parse(data)
            socket.emit('get_stock_io_data', {oi:getjson})
        })
      } catch(error) {
        console.log(error)
      }

      const instruments = [
        {
          exchangeSegment: data.singlesegmentdata.exchangeSegment || data.singlesegmentdata.ExchangeSegment || data.exchangeSegment || data.ExchangeSegment , exchangeInstrumentID: data.singlesegmentdata.ExchangeInstrumentID || data.singlesegmentdata.exchangeInstrumentID || data.ExchangeInstrumentID || data.exchangeInstrumentID
        }
        // ,...peersdata
      ]

      try {
        // console.log(instruments,  userId)
        const instrumentiddata = await axios.post(`${process.env.APIMarketDataURL}/search/instrumentsbyid`, {
          "source": "WebAPI",
          "UserID": "guest",
          "instruments": instruments
        }, headersSetupMarket)
        let segmentdata = instrumentiddata.data.result[0]
        socket.emit('get_stock_name', { Name: segmentdata.Name, DisplayName: segmentdata.DisplayName, cname: segmentdata.Description, exchangeSegment: data.singlesegmentdata.ExchangeSegment || data.singlesegmentdata.exchangeSegment, exchangeInstrumentID: data.singlesegmentdata.ExchangeInstrumentID || data.singlesegmentdata.exchangeInstrumentID, ExtendedMarketProperties: segmentdata.ExtendedMarketProperties, NameWithExchange: segmentdata.NameWithExchange, PriceBand: segmentdata.PriceBand })
      } catch (error){
        console.log(error.response.data)
      }

      

      xtsMarketDataWS = new XtsMarketDataWS(process.env.SocketAPIMarketDataURL);
      var socketInitRequest = {
        userID: userId,
        publishFormat: 'JSON',
        broadcastMode: 'Full',
        token: userSessionData.marketdataclientsession,
      };

      xtsMarketDataWS.init(socketInitRequest);

    

      const getInstrument = await subscriptionTrackingModel.findOne({ where: { user_id: userId, source: userSessionData.source }, order: [['id', 'DESC']], })

      if (getInstrument) {
        lastsegmentArray = JSON.parse(getInstrument.subsscription)
      }
      // console.log(lastsegmentArray.length)
      if (lastsegmentArray.length) {
        try {
          await axios.put(`${process.env.SocketAPIMarketDataURL}/instruments/subscription`, {
            instruments: lastsegmentArray,
            xtsMessageCode: 1502,
          }, headersSetupMarket)
        } catch (error) {
          // console.log(error)
        }
      }

      try {
        let response1 = await axios.post(`${process.env.SocketAPIMarketDataURL}/instruments/subscription`, {
          instruments: instruments,
          xtsMessageCode: 1502,
        }, headersSetupMarket)
      } catch (error) {
        if (error.response.data.code == 'e-session-0002') {

        }
      }


      // console.log(lastsegmentArray.length)
      if (lastsegmentArray.length) {
        try {
          await axios.put(`${process.env.SocketAPIMarketDataURL}/instruments/subscription`, {
            instruments: lastsegmentArray,
            xtsMessageCode: 1505,
          }, headersSetupMarket)
        } catch (error) {
          // console.log(error)
        }
      }

      try {
        let response1 = await axios.post(`${process.env.SocketAPIMarketDataURL}/instruments/subscription`, {
          instruments: instruments,
          xtsMessageCode: 1505,
        }, headersSetupMarket)
      } catch (error) {
        if (error.response.data.code == 'e-session-0002') {

        }
      }

      // subscription for change property event
      try {
        let response1 = await axios.post(`${process.env.SocketAPIMarketDataURL}/instruments/subscription`, {
          instruments: instruments,
          xtsMessageCode: 1105
        }, headersSetupMarket)

        // console.log('110511051105',response1.data.result)

      } catch (error) {
	console.log(error)
        if (error.response.data.code == 'e-session-0002') {

        }
      }


      await subscriptionTrackingModel.create({ user_id: userId, subsscription: JSON.stringify([...instruments]), source: userSessionData.source })

      xtsMarketDataWS.onConnect((connectData) => {
        // console.log(connectData);
      });

      xtsMarketDataWS.onMarketDepthEvent(marketDepthData => {
        // console.log('searchmarketdataId', marketDepthData.Touchline.LastTradedPrice,userId)
        socket.emit('get_ltp_data', {LastTradedPrice: marketDepthData.Touchline.LastTradedPrice, Close: marketDepthData.Touchline.Close, PercentChange: marketDepthData.Touchline.PercentChange, ExchangeSegment: marketDepthData.ExchangeSegment, ExchangeInstrumentID: marketDepthData.ExchangeInstrumentID})
        socket.emit('get_stock_data', marketDepthData)
        
      });

      //"marketDepth100Event" event listener
        xtsMarketDataWS.onMarketDepth100Event((marketDepth100Data) => {
          // console.log('marketDepth100Data',marketDepth100Data);
        });

        //"instrumentPropertyChangeEvent" event listener
        xtsMarketDataWS.onInstrumentPropertyChangeEvent((propertyChangeData) => {
          // console.log(propertyChangeData);
          // console.log('onInstrumentPropertyChangeEvent',propertyChangeData);

        });

        //"candleDataEvent" event listener
        xtsMarketDataWS.onCandleDataEvent((candleData) => {
          // console.log('candleData',candleData);
        });


    })

    socket.on("disconnect", () => {
      console.log("socket search disconnected", userId)
      socket.disconnect()
      robotData.remove(socket.id);
    });

  })
}
