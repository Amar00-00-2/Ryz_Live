var XtsMarketDataWS = require('xts-marketdata-api').WS;
const axios = require('axios')
const { subscriptionTrackingModel } = require('../model')
const { robotData } = require('./myevents')
let lastsegmentArray = []
module.exports = (io) => {
  const ioconnection = io.of('/search/indices_marketdata')
  ioconnection.on('connect', async (socket) => {
    console.log("/search/indices_marketdata")
    let userId = 'unknown'
    socket.on('indices_socket_data', async (data, userSessionData) => {
      userId = userSessionData.clientdata.ClientId;
      console.log('search marketdata connected', userId)

      const headersSetupMarket = {
        headers: {
          'authorization': userSessionData.marketdataclientsession
        }
      }
      const getInstrument = await subscriptionTrackingModel.findOne({ where: { user_id: userId, source: userSessionData.source }, order: [['id', 'DESC']], })

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
      try {
        let response1 = await axios.post(`${process.env.APIMarketDataURL}/instruments/subscription`, {
          instruments: data.instruments,
          xtsMessageCode: 1502,
        }, headersSetupMarket)
      } catch (error) {
        if (error.response.data.code == 'e-session-0002') {

        }
      }
      await subscriptionTrackingModel.create({ user_id: userId, subsscription: JSON.stringify([...instruments]), source: userSessionData.source})

      xtsMarketDataWS = new XtsMarketDataWS(process.env.SocketAPIMarketDataURL);
      var socketInitRequest = {
        userID: userId,
        publishFormat: 'JSON',
        broadcastMode: 'Full',
        token: userSessionData.marketdataclientsession,
      };

      xtsMarketDataWS.init(socketInitRequest);
      xtsMarketDataWS.onConnect((connectData) => {
        // console.log(connectData);
      });
      xtsMarketDataWS.onMarketDepthEvent(marketDepthData => {
        socket.emit('get_indices_market_data', marketDepthData)
      });
    })
    socket.on("disconnect", () => {
      console.log("socket search disconnected", userId)
      socket.disconnect()
      robotData.remove(socket.id);
    });
  })
}
