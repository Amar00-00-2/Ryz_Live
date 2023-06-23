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
  const ioconnection = io.of('/optionalchain/marketdata')
  ioconnection.on('connect', async (socket) => {
    console.log('/optionalchain/marketdata socket connected', socket.handshake.auth)
    socket.on('run_watchlist_custom_data', async (data, userSessionData) => {
      // console.log(userSessionData)
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

      try{
        let response1 = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`, {
            instruments: getInstrumentArray,
            xtsMessageCode: 1502,
            publishFormat: "JSON"
        }, headersSetupMarket)

        response1.data.result.listQuotes.forEach((data) => {
            let getjson = JSON.parse(data)
            // console.log('get_stock_dataget_stock_data', getjson)
            socket.emit('get_stock_data', getjson)
        })
      } catch(error) {
        console.log(error)
      }



      // console.log('datadatadata', getInstrumentArray)

      // console.log(getInstrumentArray)

      socket.emit('get_stock_name', getInstrumentData)
      xtsMarketDataWS = new XtsMarketDataWS(process.env.SocketAPIMarketDataURL);
      var socketInitRequest = {
        userID: socket.handshake.auth.userid,
        publishFormat: 'JSON',
        broadcastMode: 'Full',
        token: userSessionData.marketdataclientsession,
      };

      xtsMarketDataWS.init(socketInitRequest);

      const getInstrument = await subscriptionTrackingModel.findOne({ where: { user_id: socket.handshake.auth.userid, source: userSessionData.source }, order: [['id', 'DESC']], })
      const getInstrument1510 = await subscriptionTrackingModel1510.findOne({ where: { user_id: socket.handshake.auth.userid, source: userSessionData.source }, order: [['id', 'DESC']], })

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
          await axios.put(`${process.env.APIMarketDataURL}/instruments/subscription`, {
            instruments: lastsegmentArray,
            xtsMessageCode: 1502,
          }, headersSetupMarket)
        } catch (error) {
          console.log(error.response.data)
        }
      }

      try {
        let response1 = await axios.post(`${process.env.APIMarketDataURL}/instruments/subscription`, {
          instruments: getInstrumentArray,
          xtsMessageCode: 1502,
        }, headersSetupMarket)
      } catch (error) {
        console.log(error.response.data.result.errors)
      }

      if (lastsegmentArray.length) {
        try {
          await axios.put(`${process.env.APIMarketDataURL}/instruments/subscription`, {
            instruments: lastsegmentArray1510,
            xtsMessageCode: 1510,
          }, headersSetupMarket)
        } catch (error) {
          console.log(error.response.data.result.errors)
        }
      }

      try {
        let response1 = await axios.post(`${process.env.APIMarketDataURL}/instruments/subscription`, {
          instruments: getInstrumentArray,
          xtsMessageCode: 1510,
        }, headersSetupMarket)
          // console.log('1510 response', response1.data)
          // response1.data.result.listQuotes.forEach((data) => {
          //   let getjson = JSON.parse(data)
          //   socket.emit('get_stock_data_1510', getjson)
          // })
      } catch (error) {
        console.log(error.response.data.result.errors)
      }
      await subscriptionTrackingModel.create({ user_id: socket.handshake.auth.userid, subsscription: JSON.stringify([...getInstrumentArray]), source: userSessionData.source })
      await subscriptionTrackingModel1510.create({ user_id: socket.handshake.auth.userid, subsscription: JSON.stringify([...getInstrumentArray]), source: userSessionData.source })

      xtsMarketDataWS.onConnect((connectData) => {
        console.log(connectData);
      });
      let sno = 0;
      let sno_oi = 0;

      xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
        if(sno == 10){
          // console.log('get_stock_data', marketDepthData.ExchangeInstrumentID, marketDepthData.ExchangeSegment,socket.handshake.auth.mkdate)
          socket.emit('get_stock_data', marketDepthData)
          sno = 0
        }
        sno += 1;
      });
      xtsMarketDataWS.onOpenInterestEvent((openInterestData) => {
        // socket.emit('get_stock_data_1510', openInterestData)
        if(sno_oi == 25){
          socket.emit('get_stock_data', openInterestData)
          sno_oi = 0
        }
        sno_oi += 1;
      });
    })

    socket.on("disconnect", () => {
      console.log("socket marketdata disconnected", socket.handshake.auth.userid)
      socket.disconnect()
      robotData.remove(socket.id);
    });

  })
}
