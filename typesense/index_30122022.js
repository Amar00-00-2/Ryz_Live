const axios = require("axios")
const moment = require("moment")
const { NSECMSchema, NSEFOSchema } = require('./schema')
const { execSync } = require('child_process');
require('dotenv').config({path:__dirname+"/../.env"})
const { globalexchangesegment, client, neworexistingCollection } = require('../config')
const {AppConfigModel} = require("../model")
var CronJob = require('cron').CronJob;
const {redisclient} = require('../config')
process.env.TZ = 'Asia/Kolkata'

var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SearchEngineLatestUpdater = async function() {
  console.log("CRONJOB STARTED FOR NSECM")
  // before execute the cronjob need auth token for search instrumentbyid api (that api need auth)
  try {
    console.log("CRONJOB STARTED FOR NSEFO")
    // importing schema modules 
    const customSegmentName = 'NSEFO'
    // const neworexistingCollection = customSegmentName + moment().format("MM-DD-YYYY");
    // console.log(neworexistingCollection)
    try {
      await client.collections(neworexistingCollection).retrieve()
      console.log(" ****** COLLECTION FOUND ****** ")
    } catch (error) {
      if (error.httpStatus == 404) {
        console.log(" ****** COLLECTION NOT FOUND ****** ")
        console.log(" ****** CREATING NEW COLLECTION ****** ")
        console.log(` ****** ${neworexistingCollection.toUpperCase()} ****** `)
        NSEFOSchema.name = neworexistingCollection
        try {
          await client.collections().create(NSEFOSchema);
          console.log(` ****** ${neworexistingCollection} COLLECTION CREATED ****** `)
        } catch (error) {
          console.log(` ****** ${neworexistingCollection.toUpperCase()} COLLECTION CREATION ERROR ****** `)
        }
      }
    }
    console.log(` ****** FETCHING ${customSegmentName} DATA USING API ****** `)
    let getNSEData = []
    let apiInteravl;
    let LetTableHasTheData = true;
    try {
      let fetchingtime = 0
      apiInteravl = setInterval(function () {
        process.stdout.write(`\r ****** API TIME : ${fetchingtime++} seconds ******`);
      }, 1000);

      getNSEData = await axios.post(`${process.env.APIInteractiveURL}/enterprise/instruments/master`, {
        "exchangeSegmentList": [
          'MCXFO',
          'NSEFO',
          'NSECM',
          'NSECD'
        ]
      })
      clearInterval(apiInteravl)
      console.log('\n')
      console.log(` ****** FETCHED ${customSegmentName} DATA FROM API  ****** `)
      const totalSegment = getNSEData.data.result.split('\n')
      console.log(` ****** FETCHED ${customSegmentName} DATA : ${totalSegment.length}  ****** `)
      console.log(` ****** START PROCESS FOR ${customSegmentName} DATA ****** `)

      let multipleArray = [];
      let firstloop = true
      let InstrumentIds = []
      console.log('\n')
      // check time taken for process
      let processTime = 0
      const processInterval = setInterval(() => {
        process.stdout.write(`\r ****** Process Time : ${processTime++} seconds ******`)
      }, 1000)
      console.log('\n')

      for (let mk = 0; mk < totalSegment.length; mk++) {
        const x = totalSegment[mk];
        const separtePipeValues =  x.split('|')
        let ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Description, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize, LotSize, Multiplier, VarDisplayName, ISIN, PriceNumerator, PriceDenominotor, UnderlyingInstrumentId, UnderlyingIndexName, ContractExpiration, StrikePrice, OptionType, CompanyName;

        ExchangeSegment = ExchangeInstrumentID = InstrumentType = Name = Description = Series = NameWithSeries = InstrumentID = PriceBandHigh = PriceBandLow = FreezeQty = TickSize = LotSize = Multiplier = VarDisplayName = ISIN = PriceNumerator = PriceDenominotor  = UnderlyingInstrumentId = UnderlyingIndexName = ContractExpiration = StrikePrice = OptionType = CompanyName = null

        let fullname = ''
        // console.log('separtePipeValues[5]',separtePipeValues[0], separtePipeValues[5])
        if(separtePipeValues[0] != 'NSECD' && separtePipeValues[0] != 'MCXFO') {
          if(separtePipeValues[5] == 'OPTSTK') {
            [ ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Description, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize, LotSize, Multiplier, UnderlyingInstrumentId, UnderlyingIndexName, ContractExpiration, StrikePrice, OptionType, VarDisplayName, PriceNumerator, PriceDenominotor ] = separtePipeValues

            fullname = `${Name} ${Series} ${StrikePrice} ${OptionType == 3?'CE':'PE'}`

          } else if(separtePipeValues[5] == 'OPTIDX') {
            [ ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Description, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize, LotSize, Multiplier, UnderlyingInstrumentId, UnderlyingIndexName, ContractExpiration, StrikePrice, OptionType, VarDisplayName, PriceNumerator, PriceDenominotor ] = separtePipeValues

            fullname = `${Name} ${Series} ${StrikePrice} ${OptionType == 3?'CE':'PE'}`

          } else if(separtePipeValues[5] == 'FUTSTK' || separtePipeValues[5] == 'FUTIDX') {
            [ ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Description, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize, LotSize, Multiplier, UnderlyingInstrumentId, UnderlyingIndexName, ContractExpiration, StrikePrice, OptionType, VarDisplayName, PriceNumerator, PriceDenominotor ] = separtePipeValues

            fullname = `${Name} ${Series} ${StrikePrice} ${OptionType == 3?'CE':'PE'}`

          } else {
            [ ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Description, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize, LotSize, Multiplier, UnderlyingInstrumentId, UnderlyingIndexName, ContractExpiration, StrikePrice, OptionType, VarDisplayName, PriceNumerator, PriceDenominotor ] = separtePipeValues

            fullname = `${Name} ${Series} ${StrikePrice} ${OptionType == 3?'CE':'PE'}`
          }
        } else if(separtePipeValues[0] == 'MCXFO') {
            if(separtePipeValues[5] == 'OPTFUT') {
              [ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize,  Multiplier, LotSize, UnderlyingInstrumentId, UnderlyingIndexName, ContractExpiration, StrikePrice, OptionType, VarDisplayName, PriceNumerator, pricedenominotor, Description] = separtePipeValues
              fullname = `${Name} ${Series} ${StrikePrice} ${OptionType == 3?'CE':'PE'}`

            } else if(separtePipeValues[5] == 'FUTCOM') {
              [ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize,  Multiplier, LotSize, UnderlyingInstrumentId, UnderlyingIndexName, ContractExpiration, StrikePrice, OptionType, VarDisplayName, PriceNumerator, pricedenominotor, Description] = separtePipeValues
              fullname = `${Name} ${Series}`
            }
            // } else if(separtePipeValues[5] == 'INDEX') {
            //   [ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize,  Multiplier, LotSize, VarDisplayName, PriceNumerator, pricedenominotor, Description] = separtePipeValues
            //   fullname = `${Name} ${Series}`
            else if(separtePipeValues[5] == 'AUCSO' || separtePipeValues[5] == 'FUTIDX') {
              [ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Series,  NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize,  Multiplier, LotSize, UnderlyingInstrumentId,ContractExpiration, StrikePrice, OptionType, VarDisplayName, PriceNumerator, pricedenominotor, Description] = separtePipeValues
              fullname = `${Name} ${Series}`
            } 
            // else if(separtePipeValues[5] == 'COMDTY') {
            //   [ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Series,  NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize,  Multiplier, LotSize, VarDisplayName, PriceNumerator, pricedenominotor, Description] = separtePipeValues
            //   Description = FullDescription
            //   fullname = `${Name} ${Series}`
            // }
        } else {
          if(separtePipeValues[5] == 'OPTCUR') {
            [ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize,  Multiplier, LotSize, UnderlyingInstrumentId, UnderlyingIndexName, ContractExpiration, StrikePrice, OptionType, VarDisplayName, PriceNumerator, PriceDenominator, Description ] = separtePipeValues
            fullname = `${Name} ${Series}`
          }  else if(separtePipeValues[5] == 'FUTCUR') {
            [ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize,  Multiplier, LotSize, UnderlyingInstrumentId, UnderlyingIndexName, ContractExpiration, StrikePrice, OptionType, VarDisplayName, PriceNumerator, PriceDenominator, Description] = separtePipeValues
            fullname = `${Name} ${Series}`
          }
        }
        CompanyName = Description

        let ExchangeSegmentInNumber = globalexchangesegment[ExchangeSegment]
        let d = new Date(ContractExpiration)
        const FullData = { value: `${String(d.getDate()) + String(months[d.getMonth()]) + String(d.getFullYear())}`, label: `${String(d.getDate())} ${String(months[d.getMonth()])}`, dataformat: `${String(d.getDate()) + '/' + String(d.getMonth() + 1 > 10 ? d.getMonth() + 1 : '0' + (d.getMonth() + 1)) + '/' + String(d.getFullYear())}`, monthname: monthNames[d.getMonth()] }

        // console.log('FullData', FullData)
        let ContractExpirationString = FullData.value
        let DisplayName = ''
        let month = monthNames[d.getMonth()]

        if (Series == 'OPTSTK') {
          DisplayName = `${Name} ${FullData.value} ${OptionType == 3 ? 'CE' : 'PE'} ${StrikePrice}`
        } else if(Series == 'OPTFUT') {
          DisplayName = `${Name} ${FullData.value} ${OptionType == 3 ? 'CE' : 'PE'} ${StrikePrice}`
        } else if(Series == 'OPTCUR') {
          DisplayName = `${Name} ${FullData.value} ${OptionType == 3 ? 'CE' : 'PE'} ${StrikePrice}`
        } else if(Series == 'OPTIDX') {
          DisplayName = `${Name} ${FullData.value} ${OptionType == 3 ? 'CE' : 'PE'} ${StrikePrice}`
        } else {
          DisplayName = VarDisplayName
        }
        
        if (DisplayName) {
          var monthField = DisplayName.split(' ');
          if (monthField[1]) {
            var monthColumn = DisplayName + " " + monthField[1].replace(/[0-9]/g, '')
          } else {
            var monthColumn =  DisplayName + " " + 'JAN'
          }
        } else {
          var monthColumn = DisplayName + " " + 'JAN'
        }
        // To get Week day Friday for NSECD -START //
        // Saravanan - 14.12.2022 //
        let dayType
        if(ExchangeSegment == 'NSECD') {
          var day = d.getDay()
          if(day == 5) {
            dayType = 'W'
          } else {
            dayType = ''
          }
        } else {
          dayType = ''
        }
        // To get Week day Friday for NSECD -END //
        if(ExchangeInstrumentID) {
          let searchParameters = {
            "q": ExchangeInstrumentID,
            'query_by': 'ExchangeInstrumentID'
          }
          const checkData = await client.collections(neworexistingCollection).documents().search(searchParameters)

          if (!checkData.found) {
            // here extract all instrumentid from dump then pass those values to another api called instrumentbyid (reason to use this to get display name aka full form for segment)
            var splitNameSeries = NameWithSeries.split("-").pop();
            InstrumentIds.push({ ExchangeSegment: String(ExchangeSegmentInNumber), ExchangeInstrumentID })
            // console.log('monthcol', splitNameSeries)
            multipleArray.push({ ExchangeSegment: String(ExchangeSegmentInNumber), ExchangeInstrumentID, InstrumentType, Name, Description, Series,Series_Key:splitNameSeries, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize, LotSize, Multiplier, UnderlyingInstrumentId, UnderlyingIndexName, ContractExpiration, StrikePrice: parseFloat(Number(StrikePrice).toFixed(2)), OptionType, DisplayName, ContractExpirationString, ISIN,PriceNumerator, PriceDenominotor, CompanyName, FullName: fullname, Month:monthColumn, DayType: dayType })
          }
          if (!firstloop) {
            console.log('multipleArray.length', multipleArray.length)
          }
        }
      }
      console.log(` ****** ${customSegmentName} DATA PROCESS COMPLETED ****** `)
      if (!multipleArray.length) {
        console.log(` ****** NO DATA TO UPLOAD ****** `)
        clearInterval(processInterval)
      } else {
        const getvalues = Math.ceil(multipleArray.length / 10000)
        let lastvalue = 10000
        for (let vk = 0; vk < getvalues; vk++) {
          const slicevalues = multipleArray.slice(vk * lastvalue, (vk + 1) * lastvalue)
          console.log('\n')
          console.log(vk, slicevalues.length)
          console.log('\n')
          // clear process interval
          clearInterval(processInterval)
          console.log(` ****** ${slicevalues.length} NEW ${customSegmentName} DATA FOUND AFTER PROCESS ****** `)
          let uploadTime = 0
          const uploadInterval = setInterval(() => {
            process.stdout.write(`\r ****** upload Time : ${uploadTime++} seconds ******`)
          }, 1000)
          try {
            if (slicevalues.length) {
              console.log(` ****** UPLOADING NEW ${customSegmentName} DATA TO "TYPESENSE" ****** `)
              await client.collections(neworexistingCollection).documents().import(slicevalues, { action: 'create' })
              clearInterval(uploadInterval)
              console.log('\n')
              console.log(` ****** UPLOAD COMPLETED FOR ${slicevalues.length} ****** `)
            } else {
              console.log(` ****** NO DATA TO UPLOAD ****** `)
            }
          } catch (error) {
            LetTableHasTheData = false
            console.log(` ****** ERROR WHILE DOING UPLOAD ****** `)
            console.log(error.importResults[0])
            clearInterval(uploadInterval)
            const allerror = error.importResults.filter(x => !x.success)
            console.log(allerror)
            console.log(` ****** ERROR : ${error.name} ****** `)
          }
        }
      }
    } catch (error) {
      LetTableHasTheData = false
      clearInterval(apiInteravl)
      console.log(` ****** ERROR WHILE FETCHING ${customSegmentName} DATA ****** `)
      console.log(error)
      if (error.response.data.description == 'Bad Request') {
        const getResult = error.response.data.result.errors
        for (key in getResult) {
          console.log(` ****** ERROR ${Number(key) + 1} : ${getResult[key].messages[0]} ****** `)
        }
      } else {
        console.log(` ****** ERROR : ${error.response.data.description} ****** `)
      }
    }
    // checking the event exists in table
    // adding to the tabe if not.
    // need to update the row if table rows has the data.
    if(LetTableHasTheData) {
      global.TYPESENSECOLLECTIONNAME = neworexistingCollection
      checkHasEvent = await AppConfigModel.findOne({where:{
      eventName:"TypeSenseCollectionName"
      }})
      if(checkHasEvent) {
        const updateEventValue = await AppConfigModel.update({eventValue: neworexistingCollection},{
            where: {eventName:"TypeSenseCollectionName"}
        })
        console.log("New Collection Update to Table Row")
      } else {
      const createEventNamewithValue = await AppConfigModel.create({
          eventValue: neworexistingCollection, eventName:"TypeSenseCollectionName"
      })
        console.log("New Collection Created in the table")
      }
    }
    console.log("CRONJOB COMPLETED FOR NSEFO")
  } catch (error) {
    console.log(error.response)
    if (error.response.data.code) {
      if (error.response.data.code == 'e-login-0006') {
        console.log("Access Denied. User is Blocked.")
      } else {
        console.log(error.response.data.description)
      }
    } else {
      console.log("invalid pin")
    }
  }
};

// THIS JS SCRIPT FOR NSEFO WITH CRON
(async () => {
    // update collection name after server restarted
    const getName = await AppConfigModel.findOne({where: {eventName:"TypeSenseCollectionName"}});
    if(getName) {
      try {
          client.collections(getName.eventValue).retrieve()
          redisclient.set('CollectionNameTypeSense', getName.eventValue)
          global.TYPESENSECOLLECTIONNAME = getName.eventValue
          if(neworexistingCollection != getName.eventValue) {
            SearchEngineLatestUpdater()
          }
      } catch (error) {
        SearchEngineLatestUpdater()
      }
    } else {
      SearchEngineLatestUpdater()
    }
})()

new CronJob('45 11 * * *', SearchEngineLatestUpdater, null, true,'Asia/Kolkata');


// const checkCronJob = async function () {
//   console.log('**********Cron Job Checking************')
// }

// new CronJob('*/1 * * * *', checkCronJob, null, true, 'Asia/Kolkata')
