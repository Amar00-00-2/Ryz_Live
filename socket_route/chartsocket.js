var XtsMarketDataWS = require("xts-marketdata-api").WS;
var axios = require('axios')
const { subscriptionTrackingModel } = require('../model')

module.exports = (io) => {
    const ioconnection =io.of('/chart')
    ioconnection.on("connect", async (socket) => {
    console.log('Trading view socket is connected Successfully...')

    socket.on('Initialize_socket',async (usersession)=>{
      
      let headersSetupMarket = {
        headers:{
          "authorization":usersession.token
        }
      }
      let getInstrumentArray=[
        {
        "exchangeSegment": parseInt(usersession.es),
        "exchangeInstrumentID": parseInt(usersession.ei)
        }
      ]

      xtsMarketDataWS = new XtsMarketDataWS(process.env.SocketAPIMarketDataURL);
      var socketInitRequest = {
        userID: usersession.userid,
        publishFormat: 'JSON',
        broadcastMode: 'Full',
        token: usersession.token,
      };

      xtsMarketDataWS.init(socketInitRequest);

      const getInstrument = await subscriptionTrackingModel.findOne({ where: { user_id: usersession.userid, source: usersession.source }, order: [['id', 'DESC']], })
      
      if (getInstrument) {
        lastsegmentArray = JSON.parse(getInstrument.subsscription)
        // console.log('lastsegmentArray', lastsegmentArray)
        
      }else{
        lastsegmentArray=[]
      }
      
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
        console.log(error.message)
      }
      
      await subscriptionTrackingModel.create({ user_id: usersession.userid, subsscription: JSON.stringify(getInstrumentArray), source:usersession.source})
      
      xtsMarketDataWS.onConnect((connectData) => {
        console.log("xtsMarketDataWS socket connected..");
      }); 


      xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
        console.log("MarketDepth Data :"+JSON.stringify(marketDepthData.Touchline));

        var time = new Date(marketDepthData.Touchline.LastTradedTime).getTime()
      
        const CandleData={
          BarTime:time,
          TradedPrice: marketDepthData.Touchline.LastTradedPrice,
          Volume:parseInt(marketDepthData.Touchline.LastTradedQunatity),
          ExchangeSegment: marketDepthData.ExchangeSegment,
          sym: usersession.sym,
        }
        socket.emit('trading_view',CandleData)
      })
    socket.on("disconnect", () => {
      console.log("Chart Socket Disconnected")
      socket.disconnect();
    });
  })
  })
}
