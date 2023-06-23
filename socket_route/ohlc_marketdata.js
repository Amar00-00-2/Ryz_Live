var XtsMarketDataWS = require('xts-marketdata-api').WS;
var XtsMarketDataAPI = require('xts-marketdata-api').XtsMarketDataAPI;
const axios = require('axios')
const { globalexchangesegment } = require('../config')

const { subscriptionTrackingModel } = require('../model')

const { robotData } = require('./myevents')

let lastsegmentArray = []

module.exports = (io) => {
  const ioconnection = io.of('/webview/marketdata')
  ioconnection.on('connect', async (socket) => {
    console.log('search marketdata connected', 'TABTREE03')

    socket.on('run_marketdata', async (data) => {

      console.log('ohlclsdjfdlaskjdlaskjdlaskjdl', data)

      const headersSetupMarket = {
        headers: {
          'authorization': data.marketdataclientsession
        }
      }

    
      const instruments = [
        {
          "exchangeSegment": Number(data.exchangeSegment),
          "exchangeInstrumentID": Number(data.exchangeInstrumentId)
        }
      ]

  
      xtsMarketDataWS = new XtsMarketDataWS(process.env.SocketAPIMarketDataURL);
      var socketInitRequest = {
        userID: 'TABTREE03',
        publishFormat: 'JSON',
        broadcastMode: 'Full',
        token: data.marketdataclientsession,
      };

      xtsMarketDataWS.init(socketInitRequest);

    

      const getInstrument = await subscriptionTrackingModel.findOne({ where: { user_id: 'TABTREE03', source: data.source }, order: [['id', 'DESC']], })

      if (getInstrument) {
        lastsegmentArray = JSON.parse(getInstrument.subsscription)
      }
      // console.log(lastsegmentArray.length)
      if (lastsegmentArray.length) {
        try {
          await axios.put(`${process.env.APIMarketDataURL}/instruments/subscription`, {
            instruments: lastsegmentArray,
            xtsMessageCode: 1502,
          }, headersSetupMarket)
        } catch (error) {
          // console.log(error)
        }
      }

      console.log('instrumentsinstruments', instruments)

      try {
        let response1 = await axios.post(`${process.env.APIMarketDataURL}/instruments/subscription`, {
          instruments: instruments,
          xtsMessageCode: 1502,
        }, headersSetupMarket)

        // let getjson = JSON.parse(response1.data.result.listQuotes)
        // console.log('getjsongetjson',response1.data)
        // socket.emit('get_stock_data', getjson)
      } catch (error) {
          console.log(error)
        // if (error.response.data.code == 'e-session-0002') {

        // }
      }
      await subscriptionTrackingModel.create({ user_id: 'TABTREE03', subsscription: JSON.stringify([...instruments]), source: data.source })

      xtsMarketDataWS.onConnect((connectData) => {
        // console.log(connectData);
      });

      xtsMarketDataWS.onMarketDepthEvent(marketDepthData => {
        // console.log('marketDepthData', marketDepthData)
        socket.emit('get_stock_data', marketDepthData)
      });

    })

    socket.on("disconnect", () => {
      console.log("socket search disconnected", 'TABTREE03')
      socket.disconnect()
      robotData.remove(socket.id);
    });

  })
}
