const { default: axios } = require("axios");
const { categoryTypeModel } = require("../model");
const { redisclient } = require("../config");
module.exports = {
  subcribe: async (req, res) => {
    try {
      let CommonSocketInstruments = await redisclient.get(`CommonSocketInstruments${req.headers.marketdataclientsession}`)
      if(CommonSocketInstruments){
        CommonSocketInstruments = JSON.parse(CommonSocketInstruments)
        console.log('====================================');
        console.log('CommonSocketInstruments in sub', CommonSocketInstruments.length);
        console.log('====================================')
      } else {
        console.log('====================================');
        console.log('CommonSocketInstruments in sub', null);
        console.log('====================================');
      }

      const OCStocks = await redisclient.get(`OCStocks${req.headers.marketdataclientsession}`)
      if(OCStocks){
        var subsData = JSON.parse(OCStocks)
        console.log('subsData',subsData.length)
        let unsubscribe1502 = await axios.put(
          `${process.env.SocketAPIMarketDataURL}/instruments/subscription`,
          {
            instruments: subsData,
            xtsMessageCode: 1502,
          },{
          headers: {
            authorization: req.headers.marketdataclientsession,
          }
        },
        );
        console.log('unsubscribe1502',JSON.stringify(unsubscribe1502.data))
        let unsubscribe1510 = await axios.put(
          `${process.env.SocketAPIMarketDataURL}/instruments/subscription`,
          {
            instruments: subsData,
            xtsMessageCode: 1510,
          },{
          headers: {
            authorization: req.headers.marketdataclientsession,
          }
        },
        );
        console.log('unsubscribe1510',JSON.stringify(unsubscribe1510.data))

        await redisclient.set(`OCStocks${req.headers.marketdataclientsession}`,null)
      } 

      let response1 = await axios.post(
        `${process.env.SocketAPIMarketDataURL}/instruments/subscription`,
        {
          instruments: req.body.instruments,
          xtsMessageCode: 1502,
        },
        {
          headers: {
            authorization: req.headers.marketdataclientsession,
          }
        },
      );

      const AllStocks = await redisclient.get(`AllStocks${req.headers.marketdataclientsession}`)
      let newInstruments = req.body.instruments
      if(AllStocks){
        var subsData = JSON.parse(AllStocks)
        newInstruments = [...subsData,...newInstruments]
        newInstruments = await newInstruments.filter((value, index, self) =>
          index === self.findIndex((t) => (
            t.exchangeSegment === value.exchangeSegment && t.exchangeInstrumentID === value.exchangeInstrumentID
          ))
        )
      } 
      await redisclient.set(`AllStocks${req.headers.marketdataclientsession}`,JSON.stringify(newInstruments))

      res.send({status:"success",msg:response1.data})
    } catch (error) {
      console.log("error", error);
      res.send({status:"error",msg:error.message})
    }
  },
  ocsubcribe: async (req, res) => {
    try {
      const OCStocks = await redisclient.get(`OCStocks${req.headers.marketdataclientsession}`)
      let newInstruments = req.body.instruments
      if(OCStocks){
        var subsData = JSON.parse(OCStocks)
        let unsubscribe1502 = await axios.put(
          `${process.env.SocketAPIMarketDataURL}/instruments/subscription`,
          {
            instruments: subsData,
            xtsMessageCode: 1502,
          },{
          headers: {
            authorization: req.headers.marketdataclientsession,
          }
        },
        );
        let unsubscribe1510 = await axios.put(
          `${process.env.SocketAPIMarketDataURL}/instruments/subscription`,
          {
            instruments: subsData,
            xtsMessageCode: 1510,
          },{
          headers: {
            authorization: req.headers.marketdataclientsession,
          }
        },
        );

        newInstruments = newInstruments
        newInstruments = await newInstruments.filter((value, index, self) =>
          index === self.findIndex((t) => (
            t.exchangeSegment === value.exchangeSegment && t.exchangeInstrumentID === value.exchangeInstrumentID
          ))
        )
      } 
      await redisclient.set(`OCStocks${req.headers.marketdataclientsession}`,JSON.stringify(newInstruments))
     
      const CurrentStocks = await redisclient.get(`CurrentStocks${req.headers.marketdataclientsession}`)
      let currstock = req.body.instruments
      if(CurrentStocks){
        currstock = [...req.body.instruments,JSON.parse(CurrentStocks)]
      } 

      let subscribe1502 = await axios.post(
        `${process.env.SocketAPIMarketDataURL}/instruments/subscription`,
        {
          instruments: currstock,
          xtsMessageCode: 1502,
        },
        {
          headers: {
            authorization: req.headers.marketdataclientsession,
          }
        },
      );
      let subscribe1510 = await axios.post(
        `${process.env.SocketAPIMarketDataURL}/instruments/subscription`,
        {
          instruments: req.body.instruments,
          xtsMessageCode: 1510,
        },
        {
          headers: {
            authorization: req.headers.marketdataclientsession,
          }
        },
      );

      res.send({status:"success",msg:subscribe1502.data})
    } catch (error) {
      console.log("error", error);
      res.send({status:"error",msg:error.message})
    }
  },
  unsubcribe: async (req, res) => {
    try {
      let response1 = await axios.put(
        `${process.env.SocketAPIMarketDataURL}/instruments/subscription`,
        {
          instruments: req.body.instruments,
          xtsMessageCode: 1502,
        },{
        headers: {
          authorization: req.headers.marketdataclientsession,
        }
      },
      );
      res.send({status:"success",msg:response1.data})

    } catch (error) {
      console.log("error", error);
      res.send({status:"error",msg:error.message})
    }
  },
  bhavecopy: async (req, res) => {
    try {
      const prevCloseResponse = await axios.post(`${process.env.APIInteractiveURL}/enterprise/instruments/bhavcopy`,{
              instruments: req.body.instruments,
            },
            {
              headers: {
                authorization: req.headers.marketdataclientsession,
              }
            }
          );
      res.send({status:"success",msg:prevCloseResponse.data})
    } catch (error) {
      console.log("error", error);
      res.send({status:"error",msg:error.message})
    }
  },
 quotes: async (req, res) => {
    try {
      let response1 = await axios.post(
        `${process.env.APIMarketDataURL}/instruments/quotes`,
        {
          instruments: req.body.instruments,
          xtsMessageCode: 1502,
          publishFormat: "JSON",
        },
        {
          headers: {
            authorization: req.headers.marketdataclientsession,
          }
        }
      );
      res.send({status:"success",msg:response1.data})
    } catch (error) {
      console.log("error", error);
      res.send({status:"error",msg:error.message})
    }
  },
  prevclose: async (req, res) => {
    // add new object to existing object -START //
      try {
        //console.log(req.body.instruments);
        const getQuotesResponse = await axios.post(
          `${process.env.APIMarketDataURL}/instruments/quotes`,
          {
            instruments: req.body.instruments,
            xtsMessageCode: 1502,
            publishFormat: "JSON",
          },
          {
            headers: {
              authorization: req.headers.marketdataclientsession,
            }
          }
        );
        const quotesData = getQuotesResponse.data.result.listQuotes;
        // console.log("getQuotesResponse", quotesData)
        let object1 = [];
        for (let i = 0; i < quotesData.length; i++) {
          const data1 = JSON.parse(quotesData[i]);
          object1.push(data1);
        }
        // console.log("object1", object1);
        const prevCloseResponseSearch = await axios.post(
          `${process.env.APIMarketDataURL}/search/instrumentsbyid`,
          {
            instruments: req.body.instruments,
          },
          {
            headers: {
              authorization: req.headers.marketdataclientsession,
            }
          }
        );
        const prevCloseSearchData = prevCloseResponseSearch.data.result;
        // console.log("searchApi",prevCloseSearchData);
        let arrayList = [];
        for (var i in object1) {
          var obj = object1[i];
          //console.log("ss",obj);
          for (var j in prevCloseSearchData) {
            if (
              object1[i].ExchangeInstrumentID == prevCloseSearchData[j].ExchangeInstrumentID
            ) {
              obj = {...obj,...prevCloseSearchData[j]};
            }
          }
          arrayList.push(obj);
        }
	// console.log(arrayList)
        res.send({status:"success",msg:arrayList})
  }catch(error){
    console.log(error);
    res.send({status:"error",msg:error.message})
  }
  },
 holdingsdata: async (req, res) => {
    try {
      const headersSetupMarket = {
        headers: {
          authorization: req.headers.marketdataclientsession,
        },
      };
      const getresponse = await axios.get(
        `${process.env.APIInteractiveURL}/enterprise/portfolio/holdings?clientID=${req.headers.userid}&userID=${req.headers.userid}`,
        headersSetupMarket
      );
      // console.log("isntruments", getresponse.data.result.holdingsList)
      if (!getresponse.data.result.holdingsList.length) {
        res.send({status:"success",msg:{
          holding: {holdingsList:[]},
          segments: [],
        }})
      }else {
        const instruments = await Object.values(
          getresponse.data.result.holdingsList
        ).map((x) => {
          return {
            exchangeSegment: 1,
            exchangeInstrumentID: x.ExchangeNSEInstrumentId,
          };
        });
        await axios.post(`${process.env.SocketAPIMarketDataURL}/instruments/subscription`,{
	  instruments: instruments,
          xtsMessageCode: 1502,
        },headersSetupMarket
	);
        const AllStocks = await redisclient.get(`AllStocks${req.headers.marketdataclientsession}`)
        let newInstruments = instruments
        if(AllStocks){
          var subsData = JSON.parse(AllStocks)
          newInstruments = [...subsData,...newInstruments]
          newInstruments = await newInstruments.filter((value, index, self) =>
            index === self.findIndex((t) => (
              t.exchangeSegment === value.exchangeSegment && t.exchangeInstrumentID === value.exchangeInstrumentID
            ))
          )
        } 
        await redisclient.set(`AllStocks${req.headers.marketdataclientsession}`,JSON.stringify(newInstruments))
        let newArr =[];
        const getOrdersall = await axios.post(
          `${process.env.APIMarketDataURL}/search/instrumentsbyid`,
          {
            source: "WebAPI",
            UserID: "guest",
            instruments: instruments,
          },
          headersSetupMarket
        );
        let response1 = await axios.post(
              `${process.env.APIMarketDataURL}/instruments/quotes`,
              {
                instruments: instruments,
                xtsMessageCode: 1502,
                publishFormat: "JSON",
              },
              headersSetupMarket
            );
        response1.data.result.listQuotes.forEach((data) => {
          let getjson = JSON.parse(data);
          // console.log("getjsongetjsongetjson", getjson);
          var xx = getOrdersall.data.result.filter((y)=>y.ExchangeInstrumentID==getjson.ExchangeInstrumentID)

          newArr.push({...xx[0],...{
            ii: getjson.ExchangeInstrumentID,
            price: getjson.Touchline.LastTradedPrice,
            percentage: getjson.Touchline.PercentChange,
            diff:
              getjson.Touchline.LastTradedPrice - getjson.Touchline.Close,
            openprice: getjson.Touchline.Close,
            marketDepthData: getjson,
          }});
        })
        const finaldata={
          holding: getresponse.data.result,
          segments: newArr,
        }
        res.send({status:"success",msg:finaldata})
      }
    } catch (error) {
      console.log(error);
      res.send({status:"error",msg:error.response.data.description})
    }
  },
  positiondata: async (req, res) => {
    let instruments = [];
    try {
      const headersSetupMarket = {
        headers: {
          authorization: req.headers.marketdataclientsession,
        },
      };
      const getresponse = await axios.get(
        `${process.env.APIInteractiveURL}/enterprise/portfolio/positions?dayOrNet=DayWise&clientID=${req.headers.userid}&userID=${req.headers.userid}`,
        headersSetupMarket
      );
      // console.log("isntruments", getresponse.data.result.positionList)
      if (!getresponse.data.result.positionList.length) {
        res.send({status:"success",msg:{
          position: {positionList:[]},
          segments: [],
        }})
      }else{
        instruments = await getresponse.data.result.positionList.map((x) => {
          return {
            exchangeSegment: globalexchangesegment[x.ExchangeSegment],
            exchangeInstrumentID: x.ExchangeInstrumentId,
          };
        });
        // console.log("hi", getresponse.data.result.positionList);
        let response1 = await axios.post(
        `${process.env.SocketAPIMarketDataURL}/instruments/subscription`,
        {
          instruments: instruments,
          xtsMessageCode: 1502,
        },headersSetupMarket
        );

        let newArr=[]; 
        const getOrdersall = await axios.post(
          `${process.env.APIMarketDataURL}/search/instrumentsbyid`,
          {
            source: "WebAPI",
            UserID: "guest",
            instruments: instruments,
          },
          headersSetupMarket
        );
        // console.log("portfoliaorder", getOrdersall.data.result);
        await axios.post(`${process.env.APIMarketDataURL}/instruments/subscription`,{
            instruments: instruments,
            xtsMessageCode: 1502,
          },
          headersSetupMarket
        );
        response1.data.result.listQuotes.forEach((data) => {
          let getjson = JSON.parse(data);
          const check = getOrdersall.data.result.filter((data)=>data.ExchangeInstrumentID==getjson.ExchangeInstrumentID)
          
          newArr.push({...check[0],...{
            ii: getjson.ExchangeInstrumentID,
            price: getjson.Touchline.LastTradedPrice,
            percentage: getjson.Touchline.PercentChange,
            diff: getjson.Touchline.LastTradedPrice - getjson.Touchline.Close,
            openprice: getjson.Touchline.Close,
            marketDepthData: getjson,
          }});
        });
        const finaldata = {
          position: getresponse.data.result,
          segments: newArr,
        };
        res.send({status:"success",msg:finaldata})
      }
    }catch (error) {
      console.log(error);
      res.send({status:"error",msg:error.response.data.description});
    }
  },
  indexlistdata: async (req, res) => {
    try {
      if(!req.headers.marketdataclientsession){
        return res.send({status:"error",msg:"Token not found"})
      }
      if(!req.headers.userid){
        return res.send({status:"error",msg:"Userid not found"})
      }
      const headersSetupMarket = {
        headers: {
          authorization: req.headers.marketdataclientsession,
        },
      };
      const getresponse = await axios.get(
        `${process.env.APIInteractiveURL}/enterprise/group/indexlist?exchangeSegment=${req.params.segment}`,
        headersSetupMarket
      );
      // console.log("IndexList",getresponse)
      res.send({status:"success",msg:getresponse.data.result})
    }catch (error) {
      console.log(error);
      res.send({status:"error",msg:error.response.data.description});
    }
  },
};
