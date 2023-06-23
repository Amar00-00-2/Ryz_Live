var XtsMarketDataWS = require('xts-marketdata-api').WS;
const axios = require('axios')
const { globalexchangesegment } = require('../config')

const { subscriptionTrackingModel,subscriptionTrackingModel1510 } = require('../model')
const https = require('https');

const { robotData } = require('./myevents')

let lastsegmentArray = []
let lastsegmentArray1510 = []
const agent = new https.Agent({  
  rejectUnauthorized: false
});
module.exports = (io) => {
  const ioconnection = io.of('/watchlist/marketdata')
  ioconnection.on('connect', async (socket) => {
    console.log('watchlist marketdata connected')
//    console.log('No:2',socket.handshake)
    socket.on('run_watchlist_custom_data', async (data, userSessionData) => {
      console.log("Socket Inn")
      const headersSetupMarket = {
        headers: {
          'authorization': userSessionData.marketdataclientsession
        },
        httpsAgent: agent
      }

      let getInstrumentArray = []
      let getInstrumentData = []

      data.forEach(data => {
        getInstrumentArray.push({ exchangeSegment: data.ExchangeSegment, exchangeInstrumentID: data.ExchangeInstrumentID })
        getInstrumentData.push({ Name: data.Name, DisplayName: data.DisplayName, cname: data.cname, exchangeSegment: data.ExchangeSegment, exchangeInstrumentID: data.ExchangeInstrumentID })
      })
      // add new object to existing object -START //
      try {
        const getQuotesResponse = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`, {
              instruments: getInstrumentArray,
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
          instruments: getInstrumentArray,
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
      // try{
      //   let response1 = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`, {
      //       instruments: getInstrumentArray,
      //       xtsMessageCode: 1502,
      //       publishFormat: "JSON"
      //   }, headersSetupMarket)
      //   console.log('saroooooo', response1.data.result)
      //   response1.data.result.listQuotes.forEach((data) => {
      //       let getjson = JSON.parse(data)
      //       console.log('saroJSON', getjson)
      //       socket.emit('get_stock_data', getjson)
      //   })
      // } catch(error) {
      //   console.log(error)
      // }
      // Previous Close Price API -START//
      try {
        let prevCloseResponse = await axios.post(`${process.env.APIInteractiveURL}/enterprise/instruments/bhavcopy`, {
          instruments: getInstrumentArray
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

      try{
        let response1 = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`, {
            instruments: getInstrumentArray,
            xtsMessageCode: 1510,
            publishFormat: "JSON"
        }, headersSetupMarket)

        response1.data.result.listQuotes.forEach((data) => {
            let getjson = JSON.parse(data)
            socket.emit('get_stock_data_1510', getjson.OpenInterest)
        })
      } catch(error) {
        console.log(error)
      }

      socket.emit('get_stock_name', getInstrumentData)
      xtsMarketDataWS = new XtsMarketDataWS(process.env.SocketAPIMarketDataURL);
      var socketInitRequest = {
        userID: userSessionData.clientdata.ClientId,
        publishFormat: 'JSON',
        broadcastMode: 'Full',
        token: userSessionData.marketdataclientsession,
      };

      xtsMarketDataWS.init(socketInitRequest);

      const getInstrument = await subscriptionTrackingModel.findOne({ where: { user_id: userSessionData.clientdata.ClientId, source: userSessionData.source }, order: [['id', 'DESC']], })
      const getInstrument1510 = await subscriptionTrackingModel1510.findOne({ where: { user_id: userSessionData.clientdata.ClientId, source: userSessionData.source }, order: [['id', 'DESC']], })

      if (getInstrument) {
        lastsegmentArray = JSON.parse(getInstrument.subsscription)
      }

      if (getInstrument1510) {
        lastsegmentArray1510 = JSON.parse(getInstrument1510.subsscription)
      }
      // console.log('lastsegmentArray', lastsegmentArray)
      // console.log('lastsegmentArray1510', lastsegmentArray1510)
      if (lastsegmentArray.length) {
        try {
          await axios.put(`${process.env.SocketAPIMarketDataURL}/instruments/subscription`, {
            instruments: lastsegmentArray,
            xtsMessageCode: 1502,
          }, headersSetupMarket)
        } catch (error) {
          console.log(error.message)
        }
      }

      try {
        let response1 = await axios.post(`${process.env.SocketAPIMarketDataURL}/instruments/subscription`, {
          instruments: getInstrumentArray,
          xtsMessageCode: 1502,
        }, headersSetupMarket)
      } catch (error) {
        console.log(error)
      }

      if (lastsegmentArray1510.length) {
        try {
          await axios.put(`${process.env.SocketAPIMarketDataURL}/instruments/subscription`, {
            instruments: lastsegmentArray1510,
            xtsMessageCode: 1510,
          }, headersSetupMarket)
        } catch (error) {
          console.log(error)
        }
      }

      try {
        let response1 = await axios.post(`${process.env.SocketAPIMarketDataURL}/instruments/subscription`, {
          instruments: getInstrumentArray,
          xtsMessageCode: 1510,
        }, headersSetupMarket)
      } catch (error) {
        console.log(error)
      }
      await subscriptionTrackingModel.create({ user_id: userSessionData.clientdata.ClientId, subsscription: JSON.stringify([...getInstrumentArray]), source: userSessionData.source })
      await subscriptionTrackingModel1510.create({ user_id: userSessionData.clientdata.ClientId, subsscription: JSON.stringify([...getInstrumentArray]), source: userSessionData.source })

      xtsMarketDataWS.onConnect((connectData) => {
        // console.log(connectData);
      });
      let sno = 0;
      let sno_oi = 0;

      xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {

	socket.emit('get_stock_data',marketDepthData)
        if(sno == 5){
          console.log("watchlist marketdata", marketDepthData.Touchline.LastTradedPrice)
          socket.emit('get_options_data', marketDepthData)
          sno = 0
        }
        sno += 1;
      });

      xtsMarketDataWS.onOpenInterestEvent((openInterestData) => {
        if(sno_oi == 5){
          socket.emit('get_stock_data_1510', openInterestData)
        }
        sno_oi += 1;
      });
    })

    socket.on("disconnect", () => {
      // console.log("socket marketdata disconnected", userSessionData.clientdata.ClientId)
      socket.disconnect()
      robotData.remove(socket.id);
    });

  })
}
