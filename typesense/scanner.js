const axios = require("axios")
const { NSEFOIndex, NSEFOOption, NSEFOCURFUT_Schema, NSEFOCUROPT_Schema, NSEFOCMTDYFUT_Schema, NSEFOCMTDYOPT_Schema } = require('./schema')
require('dotenv').config({ path: __dirname + "/../.env" })
const { client, Indexneworexistingcolection, Stockneworexistingcolection, Currenciesfutneworexistingcolection, Currenciesoptneworexistingcolection, Commodityfuteworexistingcolection, Commodityoptneworexistingcolection } = require('../config')
const { AppConfigModel } = require("../model")

const OptionIndexCollection = async(token)=>{
    console.log("***Scanner OptionIndexCollection Start***" );
    console.log('\n')
    try{
      let fetchingtime = 0
      let apiInteravl = setInterval(function () {
        process.stdout.write(`\r ****** SCANNER INDEX PROCESS TIME : ${fetchingtime++} seconds ******`);
      }, 1000);
      letHasTable=true
      try{
        const IsCollectionExist= await client.collections(Indexneworexistingcolection).retrieve()
        if(IsCollectionExist){
          console.log("*** Previous SCANNER INDEX Collection Deleted ***");
          console.log('\n')

          //Delete the Collection
          await client.collections(Indexneworexistingcolection).delete()
          //Again Create The Collection
          NSEFOIndex.name=Indexneworexistingcolection
          await client.collections().create(NSEFOIndex)
        }
      }catch(err){
        console.log("***Collection Not Found***");
        console.log('\n')
        if(err.httpStatus=404){
         NSEFOIndex.name=Indexneworexistingcolection
          try{
            console.log(`***${Indexneworexistingcolection} Create a Collection In Typesense***`);
            console.log('\n')
            await client.collections().create(NSEFOIndex)
          }catch(err){
            console.log("***Collection Creation Error For OptionIndex!!!***");
            console.log('\n')
            console.log(err);
            letHasTable=false
          }
        }
      }
      console.log("***Collection Found***");
      console.log('\n')
      try{
        // console.log(IndexName.Name);
        const IndexStocks = [
          {Name:'NIFTY',Id:26000,Segment:1},
          {Name:'BANKNIFTY',Id:26001,Segment:1},
          {Name:'FINNIFTY',Id:26034,Segment:1},
          
        ]
        var FinalArray=[]
        for(let sno =0;sno<IndexStocks.length;sno++){
          const Index = IndexStocks[sno];
          const [GetSearchStringRes,GetSpotPriceRes]=await axios.all([
            axios.get(`${process.env.APIMarketDataURL}/search/instruments?searchString=${Index.Name}`, {
                headers: {
                  "authorization": token
                }
              }),
            axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
                  "instruments": [
                    {
                      "exchangeSegment": Index.Segment,
                      "exchangeInstrumentID": Index.Id
                    }
                  ],
                  "xtsMessageCode": 1502,
                  "publishFormat": "JSON"
                }, {
                  headers: {
                    "authorization": token
                  }
              })
          ])
          let SearchResult=GetSearchStringRes.data.result
          let getjson = JSON.parse(GetSpotPriceRes.data.result.listQuotes[0])
          let SpotPriceValue=getjson.Touchline?getjson.Touchline.LastTradedPrice:0
          console.log(SpotPriceValue);
          let getMkArray1 = []
    
          for(let sno = 0; sno < SearchResult.length; sno++){
            const x = SearchResult[sno];
            if (x.Name ==Index.Name && (x.OptionType==4 || x.OptionType==3)) {
              getMkArray1.push({...{ 
                ExchangeSegment:String(x.ExchangeSegment),
                ExchangeInstrumentID:String(x.ExchangeInstrumentID),
                CompanyName:x.CompanyName,
                DisplayName:x.DisplayName,
                Name:x.Name,
                InstrumentType:String(x.InstrumentType),
                Description:x.Description,
                NameWithSeries:x.NameWithSeries,
                Series:x.Series,
                InstrumentID:String(x.InstrumentID),
                FreezeQty:String(x.FreezeQty),
                TickSize:String(x.TickSize),
                LotSize:String(x.LotSize),
                ContractExpiration:x.ContractExpiration,
                ContractExpirationString:x.ContractExpirationString,
                StrikePrice:parseFloat(Number(x.StrikePrice).toFixed(2)),
                UnderlyingIndexName:x.UnderlyingIndexName,
                OptionType:String(x.OptionType),
              },exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
            } 
          }
          const getDateIndata = getMkArray1.sort((a, b) =>{
            return new Date(a.ContractExpiration) - new Date(b.ContractExpiration)
          }) 
    
          let getMkArray = []
          let getMkArrayCE = []
    
          for(let sno = 0; sno < getDateIndata.length; sno++){
            const x = getDateIndata[sno];
            if(x.ContractExpiration == getDateIndata[0].ContractExpiration){
              if (x.OptionType == 4) {
                getMkArray.push({...x,exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
              } else if(x.OptionType == 3) {
                getMkArrayCE.push({...x,exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
              }
            }
          }
          //Asc & Des with Expiration Date
          const getapidataPE = getMkArray.sort((a, b) => a.ContractExpiration - b.ContractExpiration)
          const getapidataCE = getMkArrayCE.sort((a, b) => a.ContractExpiration - b.ContractExpiration)
    
          //Asc & Des with StrikePrice
          const getapidataStrikePricePE = getapidataPE.sort((a, b) => a.StrikePrice - b.StrikePrice)
          const getapidataStrikePriceCE = getapidataCE.sort((a, b) => a.StrikePrice - b.StrikePrice)
    
          //Greater than Spot Price
          const instrumentsIndexPE = getapidataStrikePricePE.findIndex(x => x.StrikePrice > SpotPriceValue)
          const instrumentsIndexCE = getapidataStrikePriceCE.findIndex(x => x.StrikePrice > SpotPriceValue)
    
          //Get slice the Call & put for Above 3 below 3
          let instrumentsPE = getapidataStrikePricePE.slice(instrumentsIndexPE -2  < 0?0:instrumentsIndexPE - 2, instrumentsIndexPE + 2 )
          let instrumentsCE = getapidataStrikePriceCE.slice(instrumentsIndexCE - 2 < 0?0:instrumentsIndexCE - 2, instrumentsIndexCE + 2)
    
          const [responsePE,responseCE] = await axios.all([
            axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
              instruments:instrumentsPE,
              "xtsMessageCode": 1502,
              "publishFormat": "JSON"
            }, {
              headers: {
                "authorization": token
              }
            }), 
            axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
              instruments:instrumentsCE,
              "xtsMessageCode": 1502,
              "publishFormat": "JSON"
            }, {
              headers: {
                "authorization": token
              }
            })
          ])
          const QuotesForPE = responsePE.data.result.listQuotes
          const QuotesForCE = responseCE.data.result.listQuotes
          instrumentsPE = instrumentsPE.map((x , i) =>{     
            const getPEQuote = QuotesForPE.filter(mk =>  {
              if(mk) {
                const getJsonData = JSON.parse(mk)
                if(getJsonData.ExchangeSegment == x.ExchangeSegment && getJsonData.ExchangeInstrumentID == x.ExchangeInstrumentID) {
                  return true
                }
              }
            })
    
          const Touchline  = JSON.parse(getPEQuote && getPEQuote[0]?getPEQuote[0]:'{}')
            return {Touchline: {LastTradedPrice:Touchline.Touchline?Touchline.Touchline.LastTradedPrice:0,PercentChange:Touchline.Touchline?Touchline.Touchline.PercentChange:0},...x,PriceBand: null}
          })
          instrumentsCE = instrumentsCE.map((x , i) =>{
          const getCEQuote = QuotesForCE.filter(mk =>  {
            if(mk) {
              const getJsonData = JSON.parse(mk)
              if(getJsonData.ExchangeSegment == x.ExchangeSegment && getJsonData.ExchangeInstrumentID == x.ExchangeInstrumentID) {
                return true
              }
            }
          })
    
          const Touchline = JSON.parse(getCEQuote && getCEQuote[0]?getCEQuote[0]:'{}')
    
          return {Touchline: {LastTradedPrice:Touchline.Touchline?Touchline.Touchline.LastTradedPrice:0,PercentChange:Touchline.Touchline?Touchline.Touchline.PercentChange:0},...x, PriceBand: null}
          
          })
          // Extract the data for CE & PE Above 3 Call below 3 put
          const extractedOptionalChainCE = instrumentsCE.filter((data) => data.StrikePrice<SpotPriceValue)
          const extractedOptionalChainPE = instrumentsPE.filter((data) => data.StrikePrice>SpotPriceValue)
    
          FinalArray.push(...extractedOptionalChainCE,...extractedOptionalChainPE)
          // FinalArray.push("t")
        }
        if(FinalArray.length){
          console.log('\n')
          console.log("***Import Doc In Typesense***");
          console.log('\n')
          try{
            const TypesenseImport= await client.collections(Indexneworexistingcolection).documents().import(FinalArray,{action:'create'})
          }catch(err){
            letHasTable=false
            console.log(err);
            console.log("***Import collection Error***");
            console.log('\n')
          }
        }
        if(letHasTable){
          console.log("***Check Collection Name Is Already Exist in Database***");
          console.log('\n')
          checkHasEvent = await AppConfigModel.findOne({where:{eventName:"IndexTypeSenseCollectionName"}})
  
          if(checkHasEvent) {
            console.log("***Update a Collection Name In Database***");
            console.log('\n')
            const updateEventValue = await AppConfigModel.update({eventValue: Indexneworexistingcolection},{
                where: {eventName:"IndexTypeSenseCollectionName"}
            })
            console.log("***New Collection Update to Table Row***")
            console.log('\n')
  
          } else {
            console.log("***Create a Collection Name In Database***");
            console.log('\n')
            const createEventNamewithValue = await AppConfigModel.create({
              eventValue: Indexneworexistingcolection, eventName:"IndexTypeSenseCollectionName"
          })
            console.log("***New Collection Created in the table***")
            console.log('\n')
          }
        }
      }catch(err){
        console.log(err.message);
        console.log("***Api Process Error***");
        console.log('\n')
      }
      console.log("***Scanner OptionIndex End***");
      console.log('\n')
      clearInterval(apiInteravl)
    }catch(err){
      console.log("***Scanner OptionIndex Error***");
      console.log('\n')
      console.log(err.message);
    }
  }
  const OptionStocksCollection = async(token)=>{
    console.log("***Scanner OptionStocksCollection Start***");
    console.log('\n')
    letHasTable=true
    try{
      let fetchingtime = 0
      let apiInteravl = setInterval(function () {
        process.stdout.write(`\r ****** SCANNER OPTION PROCESS TIME : ${fetchingtime++} seconds ******`);
      }, 1000);
      try{
        const IsCollectionExist= await client.collections(Stockneworexistingcolection).retrieve()
        console.log("***Collection found***");
        console.log('\n')
        if(IsCollectionExist){
          console.log("*** Previous SCANNER OPTION Collection Deleted ***");
          console.log('\n')
          //Delete the Previous Collection
          await client.collections(Stockneworexistingcolection).delete()
          //Again Create a new Collection
          NSEFOOption.name=Stockneworexistingcolection
          await client.collections().create(NSEFOOption)
        }
  
      }catch(err){
        console.log("***Collection Not Found***");
        console.log('\n')
        if(err.httpStatus=404){
         NSEFOOption.name=Stockneworexistingcolection
         try{
            console.log("***Collection Created***");
            console.log('\n')
            await client.collections().create(NSEFOOption)
         }catch(err){
            console.log(err.message);
            letHasTable=false
            console.log("*** Collection Creation Error For Scanner Option Stocks!!! ***");
            console.log('\n')
         }
        }
      }
      try{
        // console.log(IndexName.Name);
        const ScannerOptionStocks = [
          {Name:'TCS',Id:11536,Segment:1},
          {Name:'RELIANCE',Id:2885,Segment:1},
          {Name:'SBIN',Id:3045,Segment:1},
          {Name:'HDFCBANK',Id:1333,Segment:1},
          {Name:'INDUSINDBK',Id:5258,Segment:1},
          {Name:'ICICIBANK',Id:4963,Segment:1},
          {Name:'KOTAKBANK',Id:1922,Segment:1},
          {Name:'INFY',Id:1594,Segment:1},
          {Name:'AXISBANK',Id:5900,Segment:1},
          {Name:'TATAMOTORS',Id:3456,Segment:1},
          {Name:'HINDALCO',Id:1363,Segment:1}
        ]
        var FinalArray=[]
        for(let sno =0;sno<ScannerOptionStocks.length;sno++){
          const Index = ScannerOptionStocks[sno];
          const [GetSearchStringRes,GetSpotPriceRes]=await axios.all([
            axios.get(`${process.env.APIMarketDataURL}/search/instruments?searchString=${Index.Name}`, {
                headers: {
                  "authorization": token
                }
              }),
            axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
                  "instruments": [
                    {
                      "exchangeSegment": Index.Segment,
                      "exchangeInstrumentID": Index.Id
                    }
                  ],
                  "xtsMessageCode": 1502,
                  "publishFormat": "JSON"
                }, {
                  headers: {
                    "authorization": token
                  }
              })
          ])
          let SearchResult=GetSearchStringRes.data.result
          let getjson = JSON.parse(GetSpotPriceRes.data.result.listQuotes[0])
          let SpotPriceValue=getjson.Touchline?getjson.Touchline.LastTradedPrice:0
          console.log(SpotPriceValue);
          let getMkArray1 = []
    
          for(let sno = 0; sno < SearchResult.length; sno++){
            const x = SearchResult[sno];
            if (x.Name ==Index.Name && (x.OptionType==4 || x.OptionType==3)) {
              getMkArray1.push({...{ 
                ExchangeSegment:String(x.ExchangeSegment),
                ExchangeInstrumentID:String(x.ExchangeInstrumentID),
                CompanyName:x.CompanyName,
                DisplayName:x.DisplayName,
                Name:x.Name,
                InstrumentType:String(x.InstrumentType),
                Description:x.Description,
                NameWithSeries:x.NameWithSeries,
                Series:x.Series,
                InstrumentID:String(x.InstrumentID),
                FreezeQty:String(x.FreezeQty),
                TickSize:String(x.TickSize),
                LotSize:String(x.LotSize),
                ContractExpiration:x.ContractExpiration,
                ContractExpirationString:x.ContractExpirationString,
                StrikePrice:parseFloat(Number(x.StrikePrice).toFixed(2)),
                UnderlyingIndexName:x.UnderlyingIndexName,
                OptionType:String(x.OptionType),
              },exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
            } 
          }
          const getDateIndata = getMkArray1.sort((a, b) =>{
            return new Date(a.ContractExpiration) - new Date(b.ContractExpiration)
          }) 
    
          let getMkArray = []
          let getMkArrayCE = []
    
          for(let sno = 0; sno < getDateIndata.length; sno++){
            const x = getDateIndata[sno];
            if(x.ContractExpiration == getDateIndata[0].ContractExpiration){
              if (x.OptionType == 4) {
                getMkArray.push({...x,exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
              } else if(x.OptionType == 3) {
                getMkArrayCE.push({...x,exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
              }
            }
          }
          //Asc & Des with Expiration Date
          const getapidataPE = getMkArray.sort((a, b) => a.ContractExpiration - b.ContractExpiration)
          const getapidataCE = getMkArrayCE.sort((a, b) => a.ContractExpiration - b.ContractExpiration)
    
          //Asc & Des with StrikePrice
          const getapidataStrikePricePE = getapidataPE.sort((a, b) => a.StrikePrice - b.StrikePrice)
          const getapidataStrikePriceCE = getapidataCE.sort((a, b) => a.StrikePrice - b.StrikePrice)
    
          //Greater than Spot Price
          const instrumentsIndexPE = getapidataStrikePricePE.findIndex(x => x.StrikePrice > SpotPriceValue)
          const instrumentsIndexCE = getapidataStrikePriceCE.findIndex(x => x.StrikePrice > SpotPriceValue)
    
          //Get slice the Call & put for Above 3 below 3
          let instrumentsPE = getapidataStrikePricePE.slice(instrumentsIndexPE -2  < 0?0:instrumentsIndexPE - 2, instrumentsIndexPE + 2 )
          let instrumentsCE = getapidataStrikePriceCE.slice(instrumentsIndexCE - 2 < 0?0:instrumentsIndexCE - 2, instrumentsIndexCE + 2)
    
          const [responsePE,responseCE] = await axios.all([
            axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
              instruments:instrumentsPE,
              "xtsMessageCode": 1502,
              "publishFormat": "JSON"
            }, {
              headers: {
                "authorization": token
              }
            }), 
            axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
              instruments:instrumentsCE,
              "xtsMessageCode": 1502,
              "publishFormat": "JSON"
            }, {
              headers: {
                "authorization": token
              }
            })
          ])
          const QuotesForPE = responsePE.data.result.listQuotes
          const QuotesForCE = responseCE.data.result.listQuotes
          instrumentsPE = instrumentsPE.map((x , i) =>{     
            const getPEQuote = QuotesForPE.filter(mk =>  {
              if(mk) {
                const getJsonData = JSON.parse(mk)
                if(getJsonData.ExchangeSegment == x.ExchangeSegment && getJsonData.ExchangeInstrumentID == x.ExchangeInstrumentID) {
                  return true
                }
              }
            })
    
          const Touchline  = JSON.parse(getPEQuote && getPEQuote[0]?getPEQuote[0]:'{}')
            return {Touchline: {LastTradedPrice:Touchline.Touchline?Touchline.Touchline.LastTradedPrice:0,PercentChange:Touchline.Touchline?Touchline.Touchline.PercentChange:0},...x,PriceBand: null}
          })
          instrumentsCE = instrumentsCE.map((x , i) =>{
          const getCEQuote = QuotesForCE.filter(mk =>  {
            if(mk) {
              const getJsonData = JSON.parse(mk)
              if(getJsonData.ExchangeSegment == x.ExchangeSegment && getJsonData.ExchangeInstrumentID == x.ExchangeInstrumentID) {
                return true
              }
            }
          })
    
          const Touchline = JSON.parse(getCEQuote && getCEQuote[0]?getCEQuote[0]:'{}')
    
          return {Touchline: {LastTradedPrice:Touchline.Touchline?Touchline.Touchline.LastTradedPrice:0,PercentChange:Touchline.Touchline?Touchline.Touchline.PercentChange:0},...x, PriceBand: null}
          
          })
          // Extract the data for CE & PE Above 3 Call below 3 put
          const extractedOptionalChainCE = instrumentsCE.filter((data) => data.StrikePrice<SpotPriceValue)
          const extractedOptionalChainPE = instrumentsPE.filter((data) => data.StrikePrice>SpotPriceValue)
    
          FinalArray.push(...extractedOptionalChainCE,...extractedOptionalChainPE)
          // FinalArray.push("t")
        }
        if(FinalArray.length){
          console.log('\n')
          console.log("***Import Doc In Typesense***");
          console.log('\n')
          
          try{
            await client.collections(Stockneworexistingcolection).documents().import(FinalArray, { action: 'create' })
          }catch(err){
            letHasTable=false
            console.log(err.message)
            console.log("***Import collection Error***");
            console.log('\n')        
          }
        }
        if(letHasTable){
          console.log("***Check Collection Name Is Already Exist in Database***");
          console.log('\n')
          checkHasEvent = await AppConfigModel.findOne({where:{eventName:"OptionTypeSenseCollectionName"}})
  
          if(checkHasEvent) {
            console.log("***Update a Collection Name In Database***");
            console.log('\n')
            const updateEventValue = await AppConfigModel.update({eventValue: Stockneworexistingcolection},{
                where: {eventName:"OptionTypeSenseCollectionName"}
            })
            console.log("***New Collection Update to Table Row***")
            console.log('\n')          
          } else {
            console.log("***Update a Collection Name In Database***");
            console.log('\n')          
            const createEventNamewithValue = await AppConfigModel.create({
              eventValue: Stockneworexistingcolection, eventName:"OptionTypeSenseCollectionName"
            })
            console.log("***New OptionStocksCollection Created in the table***")
            console.log('\n')
          }
        }
      }catch(err){
        console.log(err.message);
        console.log("***Api Process Error***");
        console.log('\n')
      }
    clearInterval(apiInteravl)
    console.log("***Scanner OptionStocksCollection End***");
    console.log('\n')
    }catch(err){
      console.log("***Scanner OptionStocksCollection Error***");
      console.log(err.message);
    }
}

const CurrenciesFutureCollection = async(token)=>{
  console.log("***Scanner Currencies Future Collection Start***" );
  console.log('\n')
  letHasTable=true
  try{
    //Already Exist Check in Typesense
    try{
      const IsCollectionExist=await client.collections(Currenciesfutneworexistingcolection).retrieve()
      
      if(IsCollectionExist){
        console.log("*** Previous Scanner Currencies Future Collection Deleted ***");
        console.log('\n')
        //Delete The previous Collection
        await client.collections(Currenciesfutneworexistingcolection).delete()
        //Again Create a new Collection
        NSEFOCURFUT_Schema.name=Currenciesfutneworexistingcolection
        await client.collections().create(NSEFOCURFUT_Schema)
      }
    }catch(err){
      if(err.httpStatus=404){
        NSEFOCURFUT_Schema.name=Currenciesfutneworexistingcolection
        try{
          console.log(`***${Currenciesfutneworexistingcolection} Collection Created ***`);
          console.log('\n')
          await client.collections().create(NSEFOCURFUT_Schema)
          
        }catch(err){
          console.log("*** Create Collection Error ***");
          console.log("\n");
          console.log(err.message);
        }
      }
    }
    try{
        // console.log(IndexName.Name);
        const Currencies = ['USDINR','EURINR','GBPINR','JPYINR']

        const FinalArray=[]
        for(let sno=0;sno<Currencies.length;sno++){
          const term = Currencies[sno]
          const GetSearchStringRes=await axios.get(`${process.env.APIMarketDataURL}/search/instruments?searchString=${term}`, {
              headers: {
                "authorization": token
              }
            })
          const FutArray=GetSearchStringRes.data.result.filter((x)=>{
            const SPD_check=x.DisplayName.split(' ')
            let ExistCheck=SPD_check.includes('SPD')
            if(x.Name ==term && x.Series=='FUTCUR' &&false==ExistCheck){
              return x
            }
          })
	  console.log("FUTArray",FutArray)
          const AscendingFutArray = FutArray.sort((a, b) =>{
            return new Date(a.ContractExpiration) - new Date(b.ContractExpiration)
          }) 
          const FilterContractioExpArray =AscendingFutArray.filter((x)=>x.ContractExpiration==AscendingFutArray[0].ContractExpiration)
          const CustomFieldsFutArray=FilterContractioExpArray.map((x)=>{return { 
            ExchangeSegment:String(x.ExchangeSegment),
            ExchangeInstrumentID:String(x.ExchangeInstrumentID),
            CompanyName:x.CompanyName,
            DisplayName:x.DisplayName,
            Name:x.Name,
            InstrumentType:String(x.InstrumentType),
            Description:x.Description,
            NameWithSeries:x.NameWithSeries,
            PriceBand:null,
            Series:x.Series,
            InstrumentID:String(x.InstrumentID),
            FreezeQty:String(x.FreezeQty),
            TickSize:String(x.TickSize),
            LotSize:String(x.LotSize),
            ContractExpiration:x.ContractExpiration,
            ContractExpirationString:x.ContractExpirationString,
            StrikePrice:0,
            UnderlyingIndexName:"null",
            OptionType:"null",
          }})
	 console.log("CustomfiledsFutArray",CustomFieldsFutArray)
          FinalArray.push(...CustomFieldsFutArray)
        }
        //Upload in Typesense and Insert the collection Name in Database
        if(FinalArray.length){
          try{
	    console.log("Check Final Array",FinalArray)
            const TypesenseImport= await client.collections(Currenciesfutneworexistingcolection).documents().import(FinalArray,{action:'create'})
          }catch(err){
            console.log("*** Collection Import Error ***");
            console.log("\n");
            letHasTable=false
            console.log(err.message);
          }
        }
        if(letHasTable){
          checkHasEvent = await AppConfigModel.findOne({where:{eventName:"CURFUTTypeSenseCollectionName"}})
          if(checkHasEvent) {
            const updateEventValue = await AppConfigModel.update({eventValue: Currenciesfutneworexistingcolection},{
                where: {eventName:"CURFUTTypeSenseCollectionName"}
            })
          } else {
            const createEventNamewithValue = await AppConfigModel.create({
              eventValue: Currenciesfutneworexistingcolection, eventName:"CURFUTTypeSenseCollectionName"
            })
          }
        }
    }catch(err){
      console.log("*** Api Process Error ***");
      console.log("\n");
      console.log(err.message);
    }
  console.log("*** Scanner Currencies Future End ***");
  console.log("\n");
  }catch(err){
    console.log("*** Scanner Currencies Future Error ***");
    console.log(err.message);
  }
}

const CurrenciesOptionCollection = async(token)=>{
  console.log("***Scanner Currencies Options Collection Start***");
  console.log('\n')
  letHasTable=true
  try{
    try{
      const IsCollectionExist=await client.collections(Currenciesoptneworexistingcolection).retrieve()
      if(IsCollectionExist){
        console.log("*** Previous Scanner Currencies Options Collection Deleted ***");
        console.log('\n');
        await client.collections(Currenciesoptneworexistingcolection).delete()
        NSEFOCUROPT_Schema.name=Currenciesoptneworexistingcolection
        await client.collections().create(NSEFOCUROPT_Schema)

      }
    }catch(err){
      if(err.httpStatus=404){
        NSEFOCUROPT_Schema.name=Currenciesoptneworexistingcolection
        try{
          console.log(`*** ${Currenciesoptneworexistingcolection} Collection Created ***`);
          console.log('\n')
          await client.collections().create(NSEFOCUROPT_Schema)
        }catch(err){
          letHasTable=false
          console.log("*** Create Collection Error ***");
          console.log("\n");
          console.log(err);
        }
      }
    }
    try{
      const CurrenciesOptions = ['USDINR','EURINR','GBPINR','JPYINR']
      var FinalArray=[]
      for(let sno =0;sno<CurrenciesOptions.length;sno++){
        const Index = CurrenciesOptions[sno];
        // const [GetSearchStringRes,GetSpotPriceRes]
        const GetSearchStringRes= await axios.get(`${process.env.APIMarketDataURL}/search/instruments?searchString=${Index}`, {
              headers: {
                "authorization": token
              }
        })
        const GetSpotPriceOfSymbolApi= await axios.get(`${process.env.APIMarketDataURL}/instruments/instrument/symbol?exchangeSegment=3&series=UNDCUR&symbol=${Index}`,{
          headers: {
            "authorization": token
          }
      })
        const GetSpotPriceRes =await  axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
          "instruments": [
            {
              "exchangeSegment":GetSpotPriceOfSymbolApi.data.result[0].ExchangeSegment,
              "exchangeInstrumentID": GetSpotPriceOfSymbolApi.data.result[0].ExchangeInstrumentID
            }
          ],
          "xtsMessageCode": 1502,
          "publishFormat": "JSON"
        }, {
          headers: {
            "authorization": token
          }
        })
        let SearchResult=GetSearchStringRes.data.result

        let getjson = JSON.parse(GetSpotPriceRes.data.result.listQuotes[0])
        let SpotPriceValue=getjson.Touchline?getjson.Touchline.LastTradedPrice:0
        console.log(SpotPriceValue);
        let getMkArray1 = []

        for(let sno = 0; sno < SearchResult.length; sno++){
          const x = SearchResult[sno];
          if (x.Name ==Index && (x.OptionType==4 || x.OptionType==3)) {
            getMkArray1.push({...{ 
              ExchangeSegment:String(x.ExchangeSegment),
              ExchangeInstrumentID:String(x.ExchangeInstrumentID),
              CompanyName:x.CompanyName,
              DisplayName:x.DisplayName,
              Name:x.Name,
              InstrumentType:String(x.InstrumentType),
              Description:x.Description,
              NameWithSeries:x.NameWithSeries,
              Series:x.Series,
              InstrumentID:String(x.InstrumentID),
              FreezeQty:String(x.FreezeQty),
              TickSize:String(x.TickSize),
              LotSize:String(x.LotSize),
              ContractExpiration:x.ContractExpiration,
              ContractExpirationString:x.ContractExpirationString,
              StrikePrice:parseFloat(Number(x.StrikePrice).toFixed(2)),
              UnderlyingIndexName:x.UnderlyingIndexName,
              OptionType:String(x.OptionType),
            },exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
          } 
        }

        const getDateIndata = getMkArray1.sort((a, b) =>{
          return new Date(a.ContractExpiration) - new Date(b.ContractExpiration)
        }) 
  
        let getMkArray = []
        let getMkArrayCE = []
  
        for(let sno = 0; sno < getDateIndata.length; sno++){
          const x = getDateIndata[sno];
          if(x.ContractExpiration == getDateIndata[0].ContractExpiration){
            if (x.OptionType == 4) {
              getMkArray.push({...x,exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
            } else if(x.OptionType == 3) {
              getMkArrayCE.push({...x,exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
            }
          }
        }
        //Asc & Des with Expiration Date
        const getapidataPE = getMkArray.sort((a, b) => a.ContractExpiration - b.ContractExpiration)
        const getapidataCE = getMkArrayCE.sort((a, b) => a.ContractExpiration - b.ContractExpiration)
  
        //Asc & Des with StrikePrice
        const getapidataStrikePricePE = getapidataPE.sort((a, b) => a.StrikePrice - b.StrikePrice)
        const getapidataStrikePriceCE = getapidataCE.sort((a, b) => a.StrikePrice - b.StrikePrice)
  
        //Greater than Spot Price
        const instrumentsIndexPE = getapidataStrikePricePE.findIndex(x => x.StrikePrice > SpotPriceValue)
        const instrumentsIndexCE = getapidataStrikePriceCE.findIndex(x => x.StrikePrice > SpotPriceValue)
  
        //Get slice the Call & put for Above 3 below 3
        let instrumentsPE = getapidataStrikePricePE.slice(instrumentsIndexPE -2  < 0?0:instrumentsIndexPE - 2, instrumentsIndexPE + 2 )
        let instrumentsCE = getapidataStrikePriceCE.slice(instrumentsIndexCE - 2 < 0?0:instrumentsIndexCE - 2, instrumentsIndexCE + 2)
  
        const [responsePE,responseCE] = await axios.all([
          axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
            instruments:instrumentsPE,
            "xtsMessageCode": 1502,
            "publishFormat": "JSON"
          }, {
            headers: {
              "authorization": token
            }
          }), 
          axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
            instruments:instrumentsCE,
            "xtsMessageCode": 1502,
            "publishFormat": "JSON"
          }, {
            headers: {
              "authorization": token
            }
          })
        ])
        const QuotesForPE = responsePE.data.result.listQuotes
        const QuotesForCE = responseCE.data.result.listQuotes
        instrumentsPE = instrumentsPE.map((x , i) =>{     
          const getPEQuote = QuotesForPE.filter(mk =>  {
            if(mk) {
              const getJsonData = JSON.parse(mk)
              if(getJsonData.ExchangeSegment == x.ExchangeSegment && getJsonData.ExchangeInstrumentID == x.ExchangeInstrumentID) {
                return true
              }
            }
          })
  
        const Touchline  = JSON.parse(getPEQuote && getPEQuote[0]?getPEQuote[0]:'{}')
          return {Touchline: {LastTradedPrice:Touchline.Touchline?Touchline.Touchline.LastTradedPrice:0,PercentChange:Touchline.Touchline?Touchline.Touchline.PercentChange:0},...x,PriceBand: null}
        })
        instrumentsCE = instrumentsCE.map((x , i) =>{
        const getCEQuote = QuotesForCE.filter(mk =>  {
          if(mk) {
            const getJsonData = JSON.parse(mk)
            if(getJsonData.ExchangeSegment == x.ExchangeSegment && getJsonData.ExchangeInstrumentID == x.ExchangeInstrumentID) {
              return true
            }
          }
        })
  
        const Touchline = JSON.parse(getCEQuote && getCEQuote[0]?getCEQuote[0]:'{}')
  
        return {Touchline: {LastTradedPrice:Touchline.Touchline?Touchline.Touchline.LastTradedPrice:0,PercentChange:Touchline.Touchline?Touchline.Touchline.PercentChange:0},...x, PriceBand: null}
        
        })
        // Extract the data for CE & PE Above 3 Call below 3 put
        const extractedOptionalChainCE = instrumentsCE.filter((data) => data.StrikePrice<SpotPriceValue)
        const extractedOptionalChainPE = instrumentsPE.filter((data) => data.StrikePrice>SpotPriceValue)
  
        FinalArray.push(...extractedOptionalChainCE,...extractedOptionalChainPE)
      }

      if(FinalArray.length){
        console.log('\n')
        console.log("***Import Doc In Typesense***");
        console.log('\n')
        try{
          await client.collections(Currenciesoptneworexistingcolection).documents().import(FinalArray, { action: 'create' })
        }catch(err){
          letHasTable=false
          console.log("***Import collection Error***");
          console.log('\n')        
          console.log(err.message)
        }
      }
      if(letHasTable){
        console.log("***Check Collection Name Is Already Exist in Database***");
        console.log('\n')
        checkHasEvent = await AppConfigModel.findOne({where:{eventName:"CUROPTTypeSenseCollectionName"}})
  
        if(checkHasEvent) {
          console.log("***Update a Collection Name In Database***");
          console.log('\n')
          const updateEventValue = await AppConfigModel.update({eventValue: Currenciesoptneworexistingcolection},{
              where: {eventName:"CUROPTTypeSenseCollectionName"}
          })
          console.log("***New Collection Update to Table Row***")
          console.log('\n')          
        } else {
          console.log("***Update a Collection Name In Database***");
          console.log('\n')          
          const createEventNamewithValue = await AppConfigModel.create({
            eventValue: Currenciesoptneworexistingcolection, eventName:"CUROPTTypeSenseCollectionName"
          })
          console.log("***New OptionStocksCollection Created in the table***")
          console.log('\n')
        }
    }
    }catch(err){
      console.log(err.message);
      console.log("***Api Process Error***");
      console.log('\n')
    }
  // clearInterval(apiInteravl)
  console.log("***Scanner Currencies Options End***");
  console.log('\n')
  }catch(err){
    console.log("***Scanner Currencies Options Error***");
    console.log(err.message);
  }
}

const CommodityFutureCollection = async(token)=>{
  console.log("***Scanner Commodity Future Collection Start***" );
  console.log('\n')
  letHasTable=true
  try{
    //Already Exist Check in Typesense
    try{
      const IsCollectionExist=await client.collections(Commodityfuteworexistingcolection).retrieve()
      if(IsCollectionExist){
        console.log("*** Previous Scanner Commodity Future Collection Deleted ***");
        await client.collections(Commodityfuteworexistingcolection).delete()
        NSEFOCMTDYFUT_Schema.name=Commodityfuteworexistingcolection
        await client.collections().create(NSEFOCMTDYFUT_Schema)

      }
    }catch(err){
      if(err.httpStatus=404){
        NSEFOCMTDYFUT_Schema.name=Commodityfuteworexistingcolection
        try{
          console.log(`*** ${Commodityfuteworexistingcolection} Collection Created ***`);
          await client.collections().create(NSEFOCMTDYFUT_Schema)
        }catch(err){
          console.log(err);
        }
      }
    }
    try{
      // console.log(IndexName.Name);
      Commodity = ['GOLD','SILVER','CRUDEOIL','NATURALGAS']
  
      const FinalArray=[]
      for(let sno=0;sno<Commodity.length;sno++){
        const term = Commodity[sno]
        const GetSearchStringRes=await axios.get(`${process.env.APIMarketDataURL}/search/instruments?searchString=${term}`, {
            headers: {
              "authorization": token
            }
          })
        const FutArray=GetSearchStringRes.data.result.filter((x)=>{
          const SPD_check=x.DisplayName.split(' ')
          let ExistCheck=SPD_check.includes('SPD')
          if(x.Name ==term && x.Series=='FUTCOM' &&false==ExistCheck){
            return x
          }
        })
        const AscendingFutArray = FutArray.sort((a, b) =>{
          return new Date(a.ContractExpiration) - new Date(b.ContractExpiration)
        }) 
        const FilterContractioExpArray =AscendingFutArray.filter((x)=>x.ContractExpiration==AscendingFutArray[0].ContractExpiration)
        const CustomFieldsFutArray=FilterContractioExpArray.map((x)=>{return { 
          ExchangeSegment:String(x.ExchangeSegment),
          ExchangeInstrumentID:String(x.ExchangeInstrumentID),
          CompanyName:x.CompanyName,
          DisplayName:x.DisplayName,
          Name:x.Name,
          InstrumentType:String(x.InstrumentType),
          Description:x.Description,
          NameWithSeries:x.NameWithSeries,
          PriceBand:null,
          Series:x.Series,
          InstrumentID:String(x.InstrumentID),
          FreezeQty:String(x.FreezeQty),
          TickSize:String(x.TickSize),
          LotSize:String(x.LotSize),
          ContractExpiration:x.ContractExpiration,
          ContractExpirationString:x.ContractExpirationString,
          StrikePrice:0,
          UnderlyingIndexName:"null",
          OptionType:"null",
        }})
        FinalArray.push(...CustomFieldsFutArray)
      }
      //Upload in Typesense and Inesert the collection Name in Database
      if(FinalArray.length){
        await client.collections(Commodityfuteworexistingcolection).documents().import(FinalArray,{action:'create'})
      }
      if(letHasTable){
        checkHasEvent = await AppConfigModel.findOne({where:{eventName:"COMDTYFUTTypeSenseCollectionName"}})
        if(checkHasEvent) {
          const updateEventValue = await AppConfigModel.update({eventValue: Commodityfuteworexistingcolection},{
              where: {eventName:"COMDTYFUTTypeSenseCollectionName"}
          })
        } else {
          const createEventNamewithValue = await AppConfigModel.create({
            eventValue: Commodityfuteworexistingcolection, eventName:"COMDTYFUTTypeSenseCollectionName"
          })
        }
      }
    }catch(err){
      console.log(err.message)
      console.log("*** Api Process Error ***");
    }
  console.log("***Scanner Commodity Future End***");
  console.log("\n");
  }catch(err){
    console.log("***Scanner Commodity Future Error ***");
    console.log(err.message);
  }
}

const CommodityOptionCollection = async(token)=>{
  console.log("***Scanner Commodity Options Collection Start***");
  console.log('\n')
  letHasTable=true
  try{
    try{
      const IsCollectionExist =await client.collections(Commodityoptneworexistingcolection).retrieve()
      if(IsCollectionExist){
        console.log("*** Previous Scanner Commodity Options Collection Deleted ***");
        await client.collections(Commodityoptneworexistingcolection).delete()
        NSEFOCMTDYOPT_Schema.name=Commodityoptneworexistingcolection
        await client.collections().create(NSEFOCMTDYOPT_Schema)

      }
    }catch(err){
      if(err.httpStatus=404){
        NSEFOCMTDYOPT_Schema.name=Commodityoptneworexistingcolection
        try{
          console.log(`*** ${Commodityoptneworexistingcolection} Collection Created ***`);
          await client.collections().create(NSEFOCMTDYOPT_Schema)
        }catch(err){
          letHasTable=false
          console.log("*** Create Collection Error ***");
          console.log("\n");
          console.log(err);
        }
      }
    }
    try{
      Commodity = ['GOLD','SILVER','CRUDEOIL','NATURALGAS']
      var FinalArray=[]
      for(let sno =0;sno<Commodity.length;sno++){
        const Index = Commodity[sno];
        // const [GetSearchStringRes,GetSpotPriceRes]
        const GetSearchStringRes= await axios.get(`${process.env.APIMarketDataURL}/search/instruments?searchString=${Index}`, {
              headers: {
                "authorization": token
              }
        })
        const GetSpotPriceOfSymbolApi= await axios.get(`${process.env.APIMarketDataURL}/instruments/instrument/symbol?exchangeSegment=51&series=COMDTY&symbol=${Index}`,{
          headers: {
            "authorization": token
          }
      })
        const GetSpotPriceRes =await  axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
          "instruments": [
            {
              "exchangeSegment":GetSpotPriceOfSymbolApi.data.result[0].ExchangeSegment,
              "exchangeInstrumentID": GetSpotPriceOfSymbolApi.data.result[0].ExchangeInstrumentID
            }
          ],
          "xtsMessageCode": 1502,
          "publishFormat": "JSON"
        }, {
          headers: {
            "authorization": token
          }
        })
        let SearchResult=GetSearchStringRes.data.result

        let getjson = JSON.parse(GetSpotPriceRes.data.result.listQuotes[0])
        let SpotPriceValue=getjson.Touchline?getjson.Touchline.LastTradedPrice:0
        console.log(SpotPriceValue);
        let getMkArray1 = []

        for(let sno = 0; sno < SearchResult.length; sno++){
          const x = SearchResult[sno];
          if (x.Name ==Index && (x.OptionType==4 || x.OptionType==3)) {
            getMkArray1.push({...{ 
              ExchangeSegment:String(x.ExchangeSegment),
              ExchangeInstrumentID:String(x.ExchangeInstrumentID),
              CompanyName:x.CompanyName,
              DisplayName:x.DisplayName,
              Name:x.Name,
              InstrumentType:String(x.InstrumentType),
              Description:x.Description,
              NameWithSeries:x.NameWithSeries,
              Series:x.Series,
              InstrumentID:String(x.InstrumentID),
              FreezeQty:String(x.FreezeQty),
              TickSize:String(x.TickSize),
              LotSize:String(x.LotSize),
              ContractExpiration:x.ContractExpiration,
              ContractExpirationString:x.ContractExpirationString,
              StrikePrice:parseFloat(Number(x.StrikePrice).toFixed(2)),
              UnderlyingIndexName:x.UnderlyingIndexName,
              OptionType:String(x.OptionType),
            },exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
          } 
        }
        const getDateIndata = getMkArray1.sort((a, b) =>{
          return new Date(a.ContractExpiration) - new Date(b.ContractExpiration)
        }) 
  
        let getMkArray = []
        let getMkArrayCE = []
  
        for(let sno = 0; sno < getDateIndata.length; sno++){
          const x = getDateIndata[sno];
          if(x.ContractExpiration == getDateIndata[0].ContractExpiration){
            if (x.OptionType == 4) {
              getMkArray.push({...x,exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
            } else if(x.OptionType == 3) {
              getMkArrayCE.push({...x,exchangeSegment: x.ExchangeSegment, exchangeInstrumentID: x.ExchangeInstrumentID})
            }
          }
        }
        //Asc & Des with Expiration Date
        const getapidataPE = getMkArray.sort((a, b) => a.ContractExpiration - b.ContractExpiration)
        const getapidataCE = getMkArrayCE.sort((a, b) => a.ContractExpiration - b.ContractExpiration)
  
        //Asc & Des with StrikePrice
        const getapidataStrikePricePE = getapidataPE.sort((a, b) => a.StrikePrice - b.StrikePrice)
        const getapidataStrikePriceCE = getapidataCE.sort((a, b) => a.StrikePrice - b.StrikePrice)
  
        //Greater than Spot Price
        const instrumentsIndexPE = getapidataStrikePricePE.findIndex(x => x.StrikePrice > SpotPriceValue)
        const instrumentsIndexCE = getapidataStrikePriceCE.findIndex(x => x.StrikePrice > SpotPriceValue)
  
        //Get slice the Call & put for Above 3 below 3
        let instrumentsPE = getapidataStrikePricePE.slice(instrumentsIndexPE -2  < 0?0:instrumentsIndexPE - 2, instrumentsIndexPE + 2 )
        let instrumentsCE = getapidataStrikePriceCE.slice(instrumentsIndexCE - 2 < 0?0:instrumentsIndexCE - 2, instrumentsIndexCE + 2)
  
        const [responsePE,responseCE] = await axios.all([
          axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
            instruments:instrumentsPE,
            "xtsMessageCode": 1502,
            "publishFormat": "JSON"
          }, {
            headers: {
              "authorization": token
            }
          }), 
          axios.post(`${process.env.APIMarketDataURL}/instruments/quotes`,{
            instruments:instrumentsCE,
            "xtsMessageCode": 1502,
            "publishFormat": "JSON"
          }, {
            headers: {
              "authorization": token
            }
          })
        ])
        const QuotesForPE = responsePE.data.result.listQuotes
        const QuotesForCE = responseCE.data.result.listQuotes
        instrumentsPE = instrumentsPE.map((x , i) =>{     
          const getPEQuote = QuotesForPE.filter(mk =>  {
            if(mk) {
              const getJsonData = JSON.parse(mk)
              if(getJsonData.ExchangeSegment == x.ExchangeSegment && getJsonData.ExchangeInstrumentID == x.ExchangeInstrumentID) {
                return true
              }
            }
          })
  
        const Touchline  = JSON.parse(getPEQuote && getPEQuote[0]?getPEQuote[0]:'{}')
          return {Touchline: {LastTradedPrice:Touchline.Touchline?Touchline.Touchline.LastTradedPrice:0,PercentChange:Touchline.Touchline?Touchline.Touchline.PercentChange:0},...x,PriceBand: null}
        })
        instrumentsCE = instrumentsCE.map((x , i) =>{
        const getCEQuote = QuotesForCE.filter(mk =>  {
          if(mk) {
            const getJsonData = JSON.parse(mk)
            if(getJsonData.ExchangeSegment == x.ExchangeSegment && getJsonData.ExchangeInstrumentID == x.ExchangeInstrumentID) {
              return true
            }
          }
        })
  
        const Touchline = JSON.parse(getCEQuote && getCEQuote[0]?getCEQuote[0]:'{}')
  
        return {Touchline: {LastTradedPrice:Touchline.Touchline?Touchline.Touchline.LastTradedPrice:0,PercentChange:Touchline.Touchline?Touchline.Touchline.PercentChange:0},...x, PriceBand: null}
        
        })
        // Extract the data for CE & PE Above 3 Call below 3 put
        const extractedOptionalChainCE = instrumentsCE.filter((data) => data.StrikePrice<SpotPriceValue)
        const extractedOptionalChainPE = instrumentsPE.filter((data) => data.StrikePrice>SpotPriceValue)
  
        FinalArray.push(...extractedOptionalChainCE,...extractedOptionalChainPE)
      }

      if(FinalArray.length){
        console.log('\n')
        console.log("***Import Doc In Typesense***");
        console.log('\n')
        
        try{
          await client.collections(Commodityoptneworexistingcolection).documents().import(FinalArray, { action: 'create' })
        }catch(err){
          letHasTable=false
          console.log("***Import collection Error***");
          console.log('\n')  
          console.log(err.message)
        }
      }
      if(letHasTable){
        console.log("***Check Collection Name Is Already Exist in Database***");
        console.log('\n')
        checkHasEvent = await AppConfigModel.findOne({where:{eventName:"COMDTYOPTTypeSenseCollectionName"}})
  
        if(checkHasEvent) {
          console.log("***Update a Collection Name In Database***");
          console.log('\n')
          const updateEventValue = await AppConfigModel.update({eventValue: Commodityoptneworexistingcolection},{
              where: {eventName:"COMDTYOPTTypeSenseCollectionName"}
          })
          console.log("***New Collection Update to Table Row***")
          console.log('\n')          
        } else {
          console.log("***Update a Collection Name In Database***");
          console.log('\n')          
          const createEventNamewithValue = await AppConfigModel.create({
            eventValue: Commodityoptneworexistingcolection, eventName:"COMDTYOPTTypeSenseCollectionName"
          })
          console.log("***New Option Collection Created in the table***")
          console.log('\n')
        }
      }
    }catch(err){
      console.log(err.message);
      console.log("***Api Process Error***");
      console.log('\n')
    }
  console.log("***Scanner Commodity Options End***");
  console.log('\n')
  }catch(err){
    console.log("***Scanner Commodity Options Error***");
    console.log(err.message);
  }
}
module.exports = {
  OptionIndexCollection,
  OptionStocksCollection,
  CurrenciesFutureCollection,
  CurrenciesOptionCollection,
  CommodityFutureCollection,
  CommodityOptionCollection,
}
