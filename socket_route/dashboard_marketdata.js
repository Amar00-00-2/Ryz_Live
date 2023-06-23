var XtsMarketDataWS = require('xts-marketdata-api').WS;
const axios = require('axios')
const {subscriptionTrackingModel} = require('../model')
const { robotData } = require('./myevents')

module.exports = (io) =>{
    const ioconnection = io.of('/dashboard/marketdata')
    ioconnection.on('connection', socket => {
	let lastsegmentArray = []
        console.log("/dashboard/marketdata connected")
        socket.on('run_index_data', async (instruments, userSessionData) => {
            let allinstruments = instruments
            const headersSetupMarket = { headers : {
                'authorization': socket.handshake.auth.userSessionData.marketdataclientsession
            } }
            const headersSetupTrading = {
                headers: {
                    'authorization': userSessionData.tradingclientsession
                }
            }

            try {
                const getresponse = await axios.get(`${process.env.APIInteractiveURL}/enterprise/portfolio/holdings?clientID=${userSessionData.clientdata.ClientId}&userID=${userSessionData.clientdata.ClientId}`, headersSetupTrading)

                const instruments = await Object.values(getresponse.data.result.holdingsList).map((x) => {
                    allinstruments.push({
                        "exchangeSegment": 1,
                        "exchangeInstrumentID": x.ExchangeNSEInstrumentId
                    })
                })
                socket.emit('send_holdings_data', { holding: getresponse.data.result })
            } catch(error) {
                console.log(error)
            }

            try {
                let response1 = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`, {
                    instruments: allinstruments,
                    xtsMessageCode: 1502,
                    publishFormat: "JSON"
                }, headersSetupMarket)
    
                response1.data.result.listQuotes.forEach((data) => {
                    let getjson = JSON.parse(data)
                    // console.log('apidata', getjson)
                    socket.emit('get_index_stock_data', getjson)
                })
                
            } catch(error) {
            
            }

            xtsMarketDataWS = new XtsMarketDataWS(process.env.SocketAPIMarketDataURL);
            var socketInitRequest = {userID: userSessionData.clientdata.ClientId,publishFormat: 'JSON',broadcastMode: 'Full',token: socket.handshake.auth.userSessionData.marketdataclientsession};
            xtsMarketDataWS.init(socketInitRequest);

            const getInstrument = await subscriptionTrackingModel.findOne({ where:{ user_id: userSessionData.clientdata.ClientId, source: userSessionData.source },  order: [['id', 'DESC']],})

            if(getInstrument) {
              lastsegmentArray = JSON.parse(getInstrument.subsscription)
            }

            if(lastsegmentArray.length){
                try{
                    await axios.put(`${process.env.SocketAPIMarketDataURL}/instruments/subscription`, {
                        instruments: lastsegmentArray,
                        xtsMessageCode: 1502,
                    }, headersSetupMarket)
                } catch(error) {
                    console.log(error.response)
                }
            }
  
            try{
              let response1 = await axios.post(`${process.env.SocketAPIMarketDataURL}/instruments/subscription`, {
                  instruments: instruments,
                  xtsMessageCode: 1502,
              }, headersSetupMarket)

              response1.data.result.listQuotes.forEach((data) => {
                    let getjson = JSON.parse(data)
                    socket.emit('get_index_stock_data', getjson)
                })
            } catch(error) {
              if(error.response.data.code == 'e-session-0002') {
  
              }
            }
            await subscriptionTrackingModel.create({ user_id: userSessionData.clientdata.ClientId, subsscription: JSON.stringify([...instruments]), source: userSessionData.source })

            xtsMarketDataWS.onConnect((connectData) => {
                console.log(connectData);
            });

            let sno = 0;
            xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
            // if(sno == 5){
                // console.log('indexData', marketDepthData)
                socket.emit('get_index_stock_data', marketDepthData)
                // sno = 0
            // }
            // sno += 1;
            });
        })

        socket.on("disconnect", () => {
            // console.log("dashboard socket disconnected", userSessionData.clientdata.ClientId)
            socket.disconnect()
            robotData.remove(socket.id);
        });
    })
}
