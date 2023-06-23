var XtsMarketDataWS = require("xts-marketdata-api").WS;
const { robotData } = require("../socket_route/myevents");
	
module.exports = (io) => {
  const ioconnection = io.of("/indice_list");
  ioconnection.on("connect", async (socket) => {
    console.log("/indice_list connected")
    socket.on("run_indice_list_data", async ( userSessionData) => {
      //Common Market Live Data
      xtsMarketDataWS = new XtsMarketDataWS(process.env.SocketAPIMarketDataURL);
      var socketInitRequest = {
        userID: userSessionData.clientdata.ClientId,
        publishFormat: "JSON",
        broadcastMode: "Full",
        token: userSessionData.marketdataclientsession,
      };
      xtsMarketDataWS.init(socketInitRequest);
      console.log(" Indice Socket Iniated")
      xtsMarketDataWS.onConnect((connectData) => {
	    console.log('Indice socket connected')
      });

      xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
	    // indice list data
      // console.log('Indice ', marketDepthData.ExchangeInstrumentID,marketDepthData.Touchline.LastTradedPrice, (new Date()).getTime())
        socket.emit("get_unique_stock_data_indice_list", marketDepthData);
      });
    
    
    });

    socket.on("disconnect", () => {
      console.log("indice_list socket disconnected")
      // console.log("socket marketdata disconnected", userSessionData.clientdata.ClientId)
      socket.disconnect();
      console.log('socket disconnection', socket.connected);
      robotData.remove(socket.id);
    });

    
  });
};
