var XtsMarketDataWS = require("xts-marketdata-api").WS;
const { robotData } = require("../socket_route/myevents");
	
module.exports = (io) => {
  const ioconnection = io.of("/watchlist_table");
  ioconnection.on("connect", async (socket) => {
    console.log("/watchlist_table connected")
    socket.on("run_watchlist_table_data", async ( userSessionData) => {
      //Common Market Live Data
      xtsMarketDataWS = new XtsMarketDataWS(process.env.SocketAPIMarketDataURL);
      var socketInitRequest = {
        userID: userSessionData.clientdata.ClientId,
        publishFormat: "JSON",
        broadcastMode: "Full",
        token: userSessionData.marketdataclientsession,
      };
      xtsMarketDataWS.init(socketInitRequest);
      console.log("Watch layout Socket Iniated")
      xtsMarketDataWS.onConnect((connectData) => {
	    console.log('Watch layout connected')
      });

      xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
        if(marketDepthData.ExchangeInstrumentID=='243149'){
          console.log('Watch',marketDepthData.ExchangeInstrumentID, marketDepthData.Touchline.LastTradedPrice, (new Date()).getTime())
          }
	    // watchlist tab layout data
      // console.log('Watch ', marketDepthData.ExchangeInstrumentID,marketDepthData.Touchline.LastTradedPrice, (new Date()).getTime())
        socket.emit("get_unique_stock_data_watchlist_table", marketDepthData);
      });
    
    
    });

    socket.on("disconnect", () => {
      console.log("watchlist_table socket disconnected")
      // console.log("socket marketdata disconnected", userSessionData.clientdata.ClientId)
      socket.disconnect();

      console.log('socket disconnection', socket.connected);
      robotData.remove(socket.id);
    });

    
  });
};
