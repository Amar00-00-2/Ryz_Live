var XtsMarketDataWS = require('xts-marketdata-api').WS;
var XtsMarketDataAPI = require('xts-marketdata-api').XtsMarketDataAPI;
const Typesense = require('typesense')
const axios = require('axios')
const { globalexchangesegment, neworexistingCollection } = require('../config')
const { AppConfigModel } = require("../model")
const { subscriptionTrackingModel } = require('../model')

let lastsegmentArray = []

let client = new Typesense.Client({
    'nodes': [{
        'host': 'localhost',
        'port': '8108',
        'protocol': 'http'
    }],
    'apiKey': 'mpXxyAwbS6bsifkkRIpabtSKSkLLotlkVFDtnovRlW1J24LP',
    'connectionTimeoutSeconds': 5
});

module.exports = (io) => {
    const ioconnection = io.of('/portfolio/positions')
    ioconnection.on('connect', async (socket) => {

        socket.on('run_data_getter', async (userSessionData) => {
            console.log('run_data_getter', userSessionData)

            const headersSetupTrading = {
                headers: {
                    'authorization': userSessionData.userSessionData.tradingclientsession
                }
            }

            const headersSetupMarket = {
                headers: {
                    'authorization': userSessionData.userSessionData.marketdataclientsession
                }
            }
            let instruments = []
            try {
                const getresponse = await axios.get(`${process.env.APIInteractiveURL}/enterprise/portfolio/positions?dayOrNet=${userSessionData.DayorNet}&clientID=${userSessionData.userSessionData.clientdata.ClientId}&userID=${userSessionData.userSessionData.clientdata.ClientId}`, headersSetupTrading)
                instruments = await getresponse.data.result.positionList.map((x) => {
                    return {
                        "exchangeSegment": globalexchangesegment[x.ExchangeSegment],
                        "exchangeInstrumentID": x.ExchangeInstrumentId
                    }
                })
                console.log('hi', getresponse)
                try {
                    const getOrdersall = await axios.post(`${process.env.APIMarketDataURL}/search/instrumentsbyid`, {
                        "source": "WebAPI",
                        "UserID": "guest",
                        "instruments": instruments
                    }, headersSetupMarket)
                    console.log('portfoliaorder', getOrdersall.data.result)
                    console.log('portfolia', getresponse.data.result)

                    // get pricenumerator and denominator values using array of exchange values passing to the typensense


                    const getIntrumentsValues = await Promise.all(instruments.map(async x => {

                        let searchParameters = {
                            "q": x.exchangeInstrumentID,
                            'query_by': 'ExchangeInstrumentID',
                            'filter_by': `ExchangeInstrumentID:=${x.exchangeInstrumentID} && ExchangeSegment:=${x.exchangeSegment}`
                        }
                        const getName = await AppConfigModel.findOne({ where: { eventName: "TypeSenseCollectionName" } })
                        global.TYPESENSECOLLECTIONNAME = getName.eventValue
                        const checkData = await client.collections(TYPESENSECOLLECTIONNAME).documents().search(searchParameters)
                        console.log('checkData', checkData)
                        const getDocumentFromData = checkData.hits.map(x => {
                            console.log('x.document', x.document)
                            return { ...x.document }
                        })
                        console.log('getDocumentFromData', getDocumentFromData)
                        return { ...getDocumentFromData[0] }

                    }))

                    console.log('getIntrumentsValues', getIntrumentsValues)

                    socket.emit('send_positions_data', { position: getresponse.data.result, segments: getOrdersall.data.result, getIntrumentsValues: getIntrumentsValues })

                } catch (error) {
                    console.log('instrumentsbyid:portfolio', error)
                }


            } catch (error) {
                console.log(error)
            }



            xtsMarketDataWS = new XtsMarketDataWS(process.env.SocketAPIMarketDataURL);
            var socketInitRequest = {
                userID: userSessionData.userSessionData.clientdata.ClientId, publishFormat: 'JSON', broadcastMode: 'Full', token: userSessionData.marketdataclientsession
            };
            xtsMarketDataWS.init(socketInitRequest);

            const getInstrument = await subscriptionTrackingModel.findOne({ where: { user_id: userSessionData.userSessionData.clientdata.ClientId, source: userSessionData.userSessionData.source }, order: [['id', 'DESC']], })

            if (getInstrument) {
                lastsegmentArray = JSON.parse(getInstrument.subsscription)
            }
            console.log('lastsegmentArray', lastsegmentArray)

            if (lastsegmentArray.length) {
                let response12 = await axios.put(`${process.env.SocketAPIMarketDataURL}/instruments/subscription`, {
                    instruments: lastsegmentArray,
                    xtsMessageCode: 1502,
                }, headersSetupMarket)
                console.log('response12', response12)
            }
            try {
                let response1 = await axios.post(`${process.env.SocketAPIMarketDataURL}/instruments/subscription`, {
                    instruments: instruments,
                    xtsMessageCode: 1502,
                }, headersSetupMarket)

                response1.data.result.listQuotes.forEach((data) => {
                    let getjson = JSON.parse(data)
                    console.log('get_stock_positions_data1')
                    socket.emit('get_stock_positions_data', { ii: getjson.ExchangeInstrumentID, price: getjson.Touchline.LastTradedPrice, percentage: getjson.Touchline.PercentChange, diff: getjson.Touchline.LastTradedPrice - getjson.Touchline.Close, openprice: getjson.Touchline.Close, marketDepthData: getjson })
                })

            } catch (eerr) {
                console.log(eerr.response)
            }


            await subscriptionTrackingModel.create({ user_id: userSessionData.userSessionData.clientdata.ClientId, subsscription: JSON.stringify([...instruments]), source: userSessionData.userSessionData.source })



            xtsMarketDataWS.onConnect((connectData) => {
                console.log(connectData);
            });

            xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
                // console.log('get_stock_positions_data2')
                socket.emit('get_stock_positions_data', { ii: marketDepthData.ExchangeInstrumentID, price: marketDepthData.Touchline.LastTradedPrice, percentage: marketDepthData.Touchline.PercentChange, diff: marketDepthData.Touchline.LastTradedPrice - marketDepthData.Touchline.Close, openprice: marketDepthData.Touchline.Open, close: marketDepthData.Touchline.Close, marketDepthData })
            });

            socket.on('disconnect', () => {
                console.log('socket.disconnect')
                socket.disconnect()
            })
        })
    })

    ioholdingsconnection = io.of('/portfolio/holdings')

    ioholdingsconnection.on('connect', (socket) => {
        socket.on('run_data_getter', async userSessionData => {

            const headersSetupTrading = {
                headers: {
                    'authorization': userSessionData.tradingclientsession
                }
            }

            const headersSetupMarket = {
                headers: {
                    'authorization': userSessionData.marketdataclientsession
                }
            }
            console.log('headersSetupMarket', headersSetupMarket);
            try {


                const getresponse = await axios.get(`${process.env.APIInteractiveURL}/enterprise/portfolio/holdings?clientID=${userSessionData.clientdata.ClientId}&userID=${userSessionData.clientdata.ClientId}`, headersSetupTrading)

                if (getresponse.data.result.holdingsList) {
                    const instruments = await Object.values(getresponse.data.result.holdingsList).map((x) => {
                        return {
                            "exchangeSegment": 1,
                            "exchangeInstrumentID": x.ExchangeNSEInstrumentId
                        }
                    })

                    console.log('instrumentsinstruments', instruments, `${process.env.APIMarketDataURL}/search/instrumentsbyid`, {
                        "source": "WebAPI",
                        "UserID": "guest",
                        "instruments": instruments
                    })

                    const getOrdersall = await axios.post(`${process.env.APIMarketDataURL}/search/instrumentsbyid`, {
                        "source": "WebAPI",
                        "UserID": "guest",
                        "instruments": instruments
                    }, headersSetupMarket)

                    // console.log({ holding: getresponse.data.result, segments: getOrdersall.data.result })

                    try {
                        let response1 = await axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`, {
                            instruments: instruments,
                            xtsMessageCode: 1502,
                            publishFormat: "JSON"
                        }, headersSetupMarket)

                        response1.data.result.listQuotes.forEach((data) => {
                            let getjson = JSON.parse(data)
                            console.log('getjsongetjsongetjson', getjson)
                            socket.emit('get_stock_holdings_data', { ii: getjson.ExchangeInstrumentID, price: getjson.Touchline.LastTradedPrice, percentage: getjson.Touchline.PercentChange, diff: getjson.Touchline.LastTradedPrice - getjson.Touchline.Close, openprice: getjson.Touchline.Close, marketDepthData: getjson })
                        })
                    } catch (error) {
                        console.log(error.response)
                    }


                    socket.emit('send_holdings_data', { holding: getresponse.data.result, segments: getOrdersall.data.result })

                    xtsMarketDataWS = new XtsMarketDataWS(process.env.SocketAPIMarketDataURL);

                    var socketInitRequest = { userID: userSessionData.clientdata.ClientId, publishFormat: 'JSON', broadcastMode: 'Full', token: userSessionData.marketdataclientsession };

                    xtsMarketDataWS.init(socketInitRequest);

                    try {
                        let response12 = await axios.put(`${process.env.SocketAPIMarketDataURL}/instruments/subscription`, {
                            instruments: instruments,
                            xtsMessageCode: 1502,
                        }, headersSetupMarket)
                    } catch (error) {
                        // console.log(error.response.data)
                    }

                    try {
                        let response1 = await axios.post(`${process.env.SocketAPIMarketDataURL}/instruments/subscription`, {
                            instruments: instruments,
                            xtsMessageCode: 1502,
                        }, headersSetupMarket)
                    } catch (error) {
                        // console.log(error.response.data)
                    }




                    xtsMarketDataWS.onConnect((connectData) => {
                        console.log(connectData);
                    });

                    xtsMarketDataWS.onMarketDepthEvent(async (marketDepthData) => {
                        socket.emit('get_stock_holdings_data', { ii: marketDepthData.ExchangeInstrumentID, price: marketDepthData.Touchline.LastTradedPrice, percentage: marketDepthData.Touchline.PercentChange, diff: marketDepthData.Touchline.LastTradedPrice - marketDepthData.Touchline.Close, openprice: marketDepthData.Touchline.Open, close: marketDepthData.Touchline.Close, marketDepthData })
                    });
                } else {

                }
            } catch (error) {
                console.log(error)
            }
        })
    })
}
