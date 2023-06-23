var XtsMarketDataWS = require("xts-marketdata-api").WS;
const { robotData } = require("../socket_route/myevents");
	
module.exports = (io) => {
  const ioconnection = io.of("/dashboard_socket");
  ioconnection.on("connect", async (socket) => {
    console.log("/dashboard_socket connected")
    socket.on("run_dashboard_socket_data", async ( userSessionData) => {
      //Common Market Live Data
      xtsMarketDataWS = new XtsMarketDataWS(process.env.SocketAPIMarketDataURL);
      var socketInitRequest = {
        userID: userSessionData.clientdata.ClientId,
        publishFormat: "JSON",
        broadcastMode: "Full",
        token: userSessionData.marketdataclientsession,
      };
      xtsMarketDataWS.init(socketInitRequest);
      console.log(" Dashboard Socket Iniated")
      xtsMarketDataWS.onConnect((connectData) => {
	    console.log('Dashboard socket connected')
      });

      xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
	    // Dashboard  data
      console.log('Dashboard ', marketDepthData.ExchangeInstrumentID,marketDepthData.Touchline.LastTradedPrice, (new Date()).getTime())
        socket.emit("get_unique_stock_data_indice_home", marketDepthData);
      });
    
    
    });

    socket.on("disconnect", () => {
      console.log("dashboard_socket socket disconnected")
      // console.log("socket marketdata disconnected", userSessionData.clientdata.ClientId)
      socket.disconnect();
      console.log('socket disconnection', socket.connected);
      robotData.remove(socket.id);
    });

    
  });
};
