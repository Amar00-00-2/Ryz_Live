var XtsMarketDataWS = require("xts-marketdata-api").WS;
const { robotData } = require("../socket_route/myevents");
const {redisclient} = require('../config')
const { default: axios } = require("axios");

	
module.exports = (io) => {
  const ioconnection = io.of("/watchlist_layout");
  ioconnection.on("connect", async (socket) => {
    console.log("/watchlist_layout connected")
    socket.on('connect_socket',(userSessionData)=>{
      xtsMarketDataWS = new XtsMarketDataWS(process.env.SocketAPIMarketDataURL);
      var socketInitRequest = {
        userID: userSessionData.clientdata.ClientId,
        publishFormat: "JSON",
        broadcastMode: "Full",
        token: userSessionData.marketdataclientsession,
      };
      xtsMarketDataWS.init(socketInitRequest);
      console.log("watchlist_layout Socket Iniated")

      xtsMarketDataWS.onConnect((connectData) => {
        console.log('Watch layout connected')
      });
    })
    socket.on("run_watchlist_tab_data", async ( data) => {
      console.log('run_watchlist_tab_data listen')
      xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
        socket.emit("get_unique_stock_data_watchlist_tab", marketDepthData);
      });
      const CommonSocketInstruments = await redisclient.get(`CommonSocketInstruments${data.userSessionData.marketdataclientsession}`)
      let newInstruments = data.socketInstruments
      if(CommonSocketInstruments){
        var subsData = JSON.parse(CommonSocketInstruments)
        newInstruments = [...subsData,...newInstruments]
        newInstruments = await newInstruments.filter((value, index, self) =>
          index === self.findIndex((t) => (
            t.exchangeSegment === value.exchangeSegment && t.exchangeInstrumentID === value.exchangeInstrumentID
          ))
        )
      } 
      await redisclient.set(`CommonSocketInstruments${data.userSessionData.marketdataclientsession}`,JSON.stringify(newInstruments))
    });
    socket.on("run_indice_list_data", async ( data) => {
      console.log('run_indice_list_data listen')
      xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
        socket.emit("get_unique_stock_data_indice_list", marketDepthData);
      });
      const CommonSocketInstruments = await redisclient.get(`CommonSocketInstruments${data.userSessionData.marketdataclientsession}`)
      let newInstruments = data.socketInstruments
      if(CommonSocketInstruments){
        var subsData = JSON.parse(CommonSocketInstruments)
        newInstruments = [...subsData,...newInstruments]
        newInstruments = await newInstruments.filter((value, index, self) =>
          index === self.findIndex((t) => (
            t.exchangeSegment === value.exchangeSegment && t.exchangeInstrumentID === value.exchangeInstrumentID
          ))
        )
      } 
      await redisclient.set(`CommonSocketInstruments${data.userSessionData.marketdataclientsession}`,JSON.stringify(newInstruments))
    });

    socket.on("run_dashboard_socket_data", async ( userSessionData) => {
      console.log('run_dashboard_socket_data listen')
      xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
        socket.emit("get_unique_stock_data_indice_home", marketDepthData);
        socket.emit("get_stock_holdings_data", {
          ii: marketDepthData.ExchangeInstrumentID,
          price: marketDepthData.Touchline.LastTradedPrice,
          percentage: marketDepthData.Touchline.PercentChange,
          diff:
            marketDepthData.Touchline.LastTradedPrice -
            marketDepthData.Touchline.Close,
          openprice: marketDepthData.Touchline.Open,
          close: marketDepthData.Touchline.Close,
          marketDepthData,
        });
     });
    });
    socket.on("run_watchlist_table_data", async ( userSessionData) => {
      console.log('run_watchlist_table_data listen')
      xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
        socket.emit("get_unique_stock_data_watchlist_table", marketDepthData);
      });
    });

    socket.on("run_market_table_data", async ( userSessionData) => {
      console.log('run_market_table_data listen')
      xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
        socket.emit("get_unique_stock_data_market_table", marketDepthData);
      });
    });
    socket.on("run_basket_table_data", async ( userSessionData) => {
      console.log('run_basket_table_data listen')
      xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
        socket.emit("get_unique_stock_data_basket_table", marketDepthData);
      });
    });

    socket.on("run_optionchain_data", async ( data) => {

      console.log('run_optionchain_data listen')
      xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
        socket.emit("get_optionchain_data", marketDepthData);
      });
      xtsMarketDataWS.onOpenInterestEvent((openInterestData) => {
        socket.emit("get_optionchain_data_1510", openInterestData);
      });

      await redisclient.set(`CurrentStocks${data.userSessionData.marketdataclientsession}`,JSON.stringify(data.currentStock))

      let AllStocks = await redisclient.get(`AllStocks${data.userSessionData.marketdataclientsession}`)
      if(AllStocks){
        AllStocks = JSON.parse(AllStocks)
        console.log('====================================');
        console.log('AllStocks in op',AllStocks.length);
        console.log('====================================');
      } else {
        console.log('====================================');
        console.log('AllStocks in op', null);
        console.log('====================================');
      }
      
      let CommonSocketInstruments = await redisclient.get(`CommonSocketInstruments${data.userSessionData.marketdataclientsession}`)
      if(CommonSocketInstruments){
        CommonSocketInstruments = JSON.parse(CommonSocketInstruments)
        console.log('====================================');
        console.log('CommonSocketInstruments in op', CommonSocketInstruments.length);
        console.log('====================================');

        let response1 = await axios.put(
          `${process.env.SocketAPIMarketDataURL}/instruments/subscription`,
          {
            instruments: CommonSocketInstruments,
            xtsMessageCode: 1502,
          },{
          headers: {
            authorization: data.userSessionData.marketdataclientsession,
          }
        },
        );
        console.log('response1',JSON.stringify(response1.data))

      } else {
        console.log('====================================');
        console.log('CommonSocketInstruments in op', null);
        console.log('====================================');
      }


      let OCStocks = await redisclient.get(`OCStocks${data.userSessionData.marketdataclientsession}`)
      if(OCStocks){
        OCStocks = JSON.parse(OCStocks)
        console.log('====================================');
        console.log('OCStocks in op', OCStocks.length);
        console.log('====================================');
      } else{
        console.log('====================================');
        console.log('OCStocks in op', null);
        console.log('====================================');
      }

      
     
     



    });

    socket.on("run_portfolio_table_data", async ( userSessionData) => {
      console.log('run_portfolio_table_data listen')
      xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
        socket.emit("get_stock_holdings_data", {
          ii: marketDepthData.ExchangeInstrumentID,
          price: marketDepthData.Touchline.LastTradedPrice,
          percentage: marketDepthData.Touchline.PercentChange,
          diff:
            marketDepthData.Touchline.LastTradedPrice -
            marketDepthData.Touchline.Close,
          openprice: marketDepthData.Touchline.Open,
          close: marketDepthData.Touchline.Close,
          marketDepthData,
        });
      });
    });
    socket.on("run_positions_table_data", async ( userSessionData) => {
      console.log('run_positions_table_data listen')
      xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
        socket.emit("get_stock_positions_data", {
          ii: marketDepthData.ExchangeInstrumentID,
          price: marketDepthData.Touchline.LastTradedPrice,
          percentage: marketDepthData.Touchline.PercentChange,
          diff:
            marketDepthData.Touchline.LastTradedPrice -
            marketDepthData.Touchline.Close,
          openprice: marketDepthData.Touchline.Open,
          close: marketDepthData.Touchline.Close,
          marketDepthData,
        });
      });
    });
    socket.on("run_equity_screen", async ( userSessionData) => {
      console.log('run_equity_screen listen')
      xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
        socket.emit("get_eq_ltp", {LastTradedPrice: marketDepthData.Touchline.LastTradedPrice, Close: marketDepthData.Touchline.Close, PercentChange: marketDepthData.Touchline.PercentChange, ExchangeSegment: marketDepthData.ExchangeSegment, ExchangeInstrumentID: marketDepthData.ExchangeInstrumentID});
        socket.emit("get_eq_data", marketDepthData);
      });
    });
    socket.on("run_futopt_screen", async ( userSessionData) => {
      console.log('run_futopt_screen listen',userSessionData/userSessionData,userSessionData.currentStock)
      xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
        socket.emit("get_futopt_ltp", {LastTradedPrice: marketDepthData.Touchline.LastTradedPrice, Close: marketDepthData.Touchline.Close, PercentChange: marketDepthData.Touchline.PercentChange, ExchangeSegment: marketDepthData.ExchangeSegment, ExchangeInstrumentID: marketDepthData.ExchangeInstrumentID});
        socket.emit("get_futopt_data", marketDepthData);
      });
    });

    

    socket.on('remove_listeners',async(data)=>{      

      let OCStocks = await redisclient.get(`OCStocks${data.userSessionData.marketdataclientsession}`)
      if(OCStocks){
        OCStocks = JSON.parse(OCStocks)
      }

      console.log('====================================');
      console.log('OCStocks', OCStocks);
      console.log('====================================');

      let CommonSocketInstruments = await redisclient.get(`CommonSocketInstruments${data.userSessionData.marketdataclientsession}`)
      if(CommonSocketInstruments){
        CommonSocketInstruments = JSON.parse(CommonSocketInstruments)
      }

      console.log('====================================');
      console.log('CommonSocketInstruments', CommonSocketInstruments);
      console.log('====================================');

      let AllStocks = await redisclient.get(`AllStocks${data.userSessionData.marketdataclientsession}`)
      if(AllStocks){
        AllStocks = JSON.parse(AllStocks)
        console.log('====================================');
        console.log('AllStocks',AllStocks.length);
        console.log('====================================');
        await redisclient.set(`AllStocks${data.userSessionData.marketdataclientsession}`,null)

        const UnSubscribeStocks = AllStocks.filter((value) =>{
          x = CommonSocketInstruments.findIndex((t) => (t.exchangeSegment == value.exchangeSegment && t.exchangeInstrumentID == value.exchangeInstrumentID))
          if(x+1){
            return false
          } else {
            return true
          }
        })
        if(UnSubscribeStocks.length>0){
          let response1 = await axios.put(
            `${process.env.SocketAPIMarketDataURL}/instruments/subscription`,
            {
              instruments: UnSubscribeStocks,
              xtsMessageCode: 1502,
            },{
              headers: {
                authorization: data.userSessionData.marketdataclientsession,
              }
            },
          );
  
          console.log('response1',JSON.stringify(response1.data))
        }
        
      }
      
      console.log('listener removed',data.eventArray);
      // data.eventArray.forEach(event => {
      //   socket.removeAllListeners(event);
      // });
    })

    socket.on("disconnect", () => {
      console.log("watchlist_layout socket disconnected")
      // console.log("socket marketdata disconnected", userSessionData.clientdata.ClientId)
      socket.disconnect();

      console.log('socket disconnection', socket.connected);
      robotData.remove(socket.id);
    });

    
  });
};
