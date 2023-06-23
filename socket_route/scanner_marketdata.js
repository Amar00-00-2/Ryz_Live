var XtsMarketDataWS = require('xts-marketdata-api').WS;
const axios = require('axios')
const {subscriptionTrackingModel} = require('../model')
const { robotData } = require('./myevents')

module.exports = (io) =>{
    const ioconnection = io.of('/scanner/marketdata')
    ioconnection.on('connection', socket => {
        console.log("/scanner/marketdata connected")
        let scannerInteravl = null
        socket.on('run_scanner', (scannerJson, userSessionData) => {
            scannerInteravl = setInterval(async () =>{

            // to know the socket is connected to the frontend, this event will be useful
        
            socket.emit("connection_status", 'Scanner Connected Successfully')

            const headersSetupMarket = {headers : {
                'authorization': userSessionData.marketdataclientsession
            } }

            try{
               
                /*

                * from client can able to send the scanner api body of data dynamically.

                * below json is the example of it.

                {
                    "exchangeSegment": 1,
                    "period": "",
                    "scannerSubType": "PercentageChange",
                    "scannerType": "TopGainer",
                    "segmentGroup": "Bank_Nifty",
                    "source": "TWSAPI"
                }

                */

                let responseScanner = await axios.post(`${process.env.APIMarketDataURL}/scanner`, scannerJson, headersSetupMarket)

                try{
                    let responseQuotes = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`, {
                        instruments: responseScanner.data.result.instruments,
                        xtsMessageCode: 1502,
                        publishFormat: "JSON"
                    }, headersSetupMarket)
            
                    // this api is to fetch full details like name , symbol etc..,

                    // https://developers.symphonyfintech.in/marketdata/search/instrumentsbyid
                    let responseSearchById = await axios.post(`${process.env.APIMarketDataURL}/search/instrumentsbyid`, {
                        instruments: responseScanner.data.result.instruments,
                        "source": "WebAPI",
                        "UserID": userSessionData.clientdata.ClientId,
                    }, headersSetupMarket)
            
                    const ScannerFinal = [] 
                    responseSearchById.data.result.forEach((data, index) => {
                        ScannerFinal.push({...data,... JSON.parse(responseQuotes.data.result.listQuotes[index])})

                    })

                    // with this event clientdata can get the extracted data from the both apis
                    console.log('ScannerFinal', ScannerFinal.length)
                    socket.emit('get_scanner_data', ScannerFinal)

                } catch(error) {

                    // with this event client side can get the error while doing the api request
                    socket.emit('get_scanner_error', error)
                    clearInterval(scannerInteravl)
                }
                
            } catch(error) {

                // with this event client side can get the error while doing the api request

                socket.emit('get_scanner_error', error)
                clearInterval(scannerInteravl)
            }

        },1500)

        

    })

        socket.on("disconnect", () => {
            clearInterval(scannerInteravl)
            console.log("scanner socket disconnected", socket.handshake.auth.userid)
            socket.disconnect()
            robotData.remove(socket.id);
        });

    })

}