const Typesense = require('typesense')
const axios = require("axios")
const moment = require("moment")
const { NSECMSchema,NSEFOSchema } = require('./schema')

var CronJob = require('cron').CronJob;

process.env.TZ = 'Asia/Kolkata'

let client = new Typesense.Client({
  'nodes': [{
    'host': 'localhost',
    'port': '8108',
    'protocol': 'http'
  }],
  'apiKey': 'KLDtWW0jLJ8katOEtIVtfZlcia7d4n8XcHObVGcy4OjP4ztL',
  'connectionTimeoutSeconds': 2
});


// example search data in nsefo

// (async() =>{
//     const getdata = await client.collections('NSEFO08-03-2022').documents().search({
//       q:"tcs",
//       per_page: 250,
//       query_by:"ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Description, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize, LotSize, Multiplier"
//     })

//     console.log(getdata)

//     for(x of getdata.hits) {
//       console.log(x.document.Series, x.document.StrikePrice)
//     }
// })()


// THIS IS THE SCRIPT FOR NSECM WITH CRON
var job = new CronJob(
    '00 02 15 * * *',
    async function() {

    console.log("CRONJOB STARTED FOR NSECM")
      
    // importing schema modules 

      const customSegmentName = 'NSECM'
      const neworexistingCollection = customSegmentName + moment().format("MM-DD-YYYY");
      console.log(neworexistingCollection)
      try {
        await client.collections(neworexistingCollection).retrieve()
        console.log(" ****** COLLECTION FOUND ****** ")
      } catch (error) {
        if (error.httpStatus == 404) {
          console.log(" ****** COLLECTION NOT FOUND ****** ")
          console.log(" ****** CREATING NEW COLLECTION ****** ")
          console.log(` ****** ${neworexistingCollection.toUpperCase()} ****** `)
          NSECMSchema.name = neworexistingCollection
          try {
            await client.collections().create(NSECMSchema);
            console.log(` ****** ${neworexistingCollection} COLLECTION CREATED ****** `)
          } catch (error) {
            console.log(` ****** ${neworexistingCollection.toUpperCase()} COLLECTION CREATION ERROR ****** `)
          }
        }
      }
      console.log(` ****** FETCHING ${customSegmentName} DATA USING API ****** `)
      let getNSEData = []
      let apiInteravl;
      try {
        let fetchingtime = 0
        apiInteravl = setInterval(function () {
          process.stdout.write(`\r ****** API TIME : ${fetchingtime++} seconds ******`);
        }, 1000);

        getNSEData = await axios.post('http://trd.gillbroking.com:3000/marketdata/instruments/master', {
          "exchangeSegmentList": [
            customSegmentName
          ]
        })

        clearInterval(apiInteravl)
        console.log('\n')

        console.log(` ****** FETCHED ${customSegmentName} DATA FROM API  ****** `)

        const totalSegment = getNSEData.data.result.split('\n')

        console.log(` ****** FETCHED ${customSegmentName} DATA : ${totalSegment.length}  ****** `)
        console.log(` ****** START PROCESS FOR ${customSegmentName} DATA ****** `)

        let multipleArray = [];
        console.log('\n')
        // check time taken for process
        let processTime = 0
        const processInterval = setInterval(() => {
          process.stdout.write(`\r ****** Process Time : ${processTime++} seconds ******`)
        }, 1000)

        for (x of totalSegment) {

          const [ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Description, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize, LotSize, Multiplier] = x.split('|')

          let searchParameters = {
            "q": ExchangeInstrumentID,
            'query_by': 'ExchangeInstrumentID'
          }

          const checkData = await client.collections(neworexistingCollection).documents().search(searchParameters)

          if (!checkData.found) {
            multipleArray.push({ ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Description, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize, LotSize, Multiplier })
          }
        }
        console.log('\n')
        // clear process interval
        clearInterval(processInterval)

        console.log(` ****** ${customSegmentName} DATA PROCESS COMPLETED ****** `)

        console.log(` ****** ${multipleArray.length} NEW ${customSegmentName} DATA FOUND AFTER PROCESS ****** `)

        try {

          if (multipleArray.length) {
            console.log(` ****** UPLOADING NEW ${customSegmentName} DATA TO "TYPESENSE" ****** `)
            let uploadTime = 0
            const uploadInterval = setInterval(() => {
              process.stdout.write(`\r ****** upload Time : ${uploadTime++} seconds ******`)
            }, 1000)
            await client.collections(neworexistingCollection).documents().import(multipleArray, { action: 'create' })
            clearInterval(uploadInterval)
            console.log('\n')

            console.log(` ****** UPLOAD COMPLETED ****** `)
          } else {
            console.log(` ****** NO DATA TO UPLOAD ****** `)
          }

        } catch (error) {
          console.log(` ****** ERROR WHILE DOING UPLOAD ****** `)
          console.log(error)
          console.log(` ****** ERROR : ${error.name} ****** `)
        }

      } catch (error) {
        clearInterval(apiInteravl)
        console.log(` ****** ERROR WHILE FETCHING ${customSegmentName} DATA ****** `)
        if (error.response.data.description == 'Bad Request') {
          const getResult = error.response.data.result.errors
          for (key in getResult) {
            console.log(` ****** ERROR ${Number(key) + 1} : ${getResult[key].messages[0]} ****** `)
          }
        } else {
          console.log(` ****** ERROR : ${error.response.data.description} ****** `)
        }
      }
      console.log("CRONJOB COMPLETED FOR NSECM")

  },
  null,
  true,
  'Asia/Kolkata'
);

var monthNames = [ "January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December" ];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// THIS JS SCRIPT FOR NSEFO WITH CRON
var job = new CronJob(
  '00 54 15 * * *',
  async function() {

  console.log("CRONJOB STARTED FOR NSEFO")
    
  // importing schema modules 

    const customSegmentName = 'NSEFO'
    const neworexistingCollection = customSegmentName + moment().format("MM-DD-YYYY");
    console.log(neworexistingCollection)
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
    try {
      let fetchingtime = 0
      apiInteravl = setInterval(function () {
        process.stdout.write(`\r ****** API TIME : ${fetchingtime++} seconds ******`);
      }, 1000);

      getNSEData = await axios.post('http://trd.gillbroking.com:3000/marketdata/instruments/master', {
        "exchangeSegmentList": [
          customSegmentName
        ]
      })

      clearInterval(apiInteravl)
      console.log('\n')

      console.log(` ****** FETCHED ${customSegmentName} DATA FROM API  ****** `)

      const totalSegment = getNSEData.data.result.split('\n')

      console.log(` ****** FETCHED ${customSegmentName} DATA : ${totalSegment.length}  ****** `)
      console.log(` ****** START PROCESS FOR ${customSegmentName} DATA ****** `)

      let multipleArray = [];
      console.log('\n')
      // check time taken for process
      let processTime = 0
      const processInterval = setInterval(() => {
        process.stdout.write(`\r ****** Process Time : ${processTime++} seconds ******`)
      }, 1000)

      for (x of totalSegment) {

        const [ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Description, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize, LotSize, Multiplier, UnderlyingInstrumentId,UnderlyingIndexName,ContractExpiration,StrikePrice,OptionType] = x.split('|')

        let d = new Date(ContractExpiration)
        const FullData = {value:`${String(d.getDate())+String(months[d.getMonth()])+String(d.getFullYear())}`, label: `${String(d.getDate())} ${String(months[d.getMonth()])}`, dataformat: `${String(d.getDate())+'/'+String(d.getMonth()+1 > 10?d.getMonth()+1:'0'+(d.getMonth()+1))+'/'+String(d.getFullYear())}`, monthname: monthNames[d.getMonth()]}
        let ContractExpirationString = FullData.value
        let DisplayName = ''
        
        if(Series == 'OPTSTK') {
          DisplayName = `${Name} ${FullData.value} ${OptionType == 3?'CE':'PE'} ${StrikePrice}`
        } else {
          DisplayName = `${Name} ${FullData.value}`
        }


        let searchParameters = {
          "q": ExchangeInstrumentID,
          'query_by': 'ExchangeInstrumentID'
        }

        const checkData = await client.collections(neworexistingCollection).documents().search(searchParameters)

        if (!checkData.found) {
          multipleArray.push({ ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Description, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize, LotSize, Multiplier, UnderlyingInstrumentId,UnderlyingIndexName,ContractExpiration,StrikePrice,OptionType,DisplayName,ContractExpirationString })
        }

        // const [ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Description, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize, LotSize, Multiplier, UnderlyingInstrumentId,UnderlyingIndexName,ContractExpiration,StrikePrice,OptionType] = x.split('|')

        // let searchParameters = {
        //   "q": ExchangeInstrumentID,
        //   'query_by': 'ExchangeInstrumentID'
        // }

        // const checkData = await client.collections(neworexistingCollection).documents().search(searchParameters)

        // if (!checkData.found) {
        //   multipleArray.push({ ExchangeSegment, ExchangeInstrumentID, InstrumentType, Name, Description, Series, NameWithSeries, InstrumentID, PriceBandHigh, PriceBandLow, FreezeQty, TickSize, LotSize, Multiplier, UnderlyingInstrumentId,UnderlyingIndexName,ContractExpiration,StrikePrice,OptionType })
        // }
      }
      console.log('\n')
      // clear process interval
      clearInterval(processInterval)

      console.log(` ****** ${customSegmentName} DATA PROCESS COMPLETED ****** `)

      console.log(` ****** ${multipleArray.length} NEW ${customSegmentName} DATA FOUND AFTER PROCESS ****** `)

      try {

        if (multipleArray.length) {
          console.log(` ****** UPLOADING NEW ${customSegmentName} DATA TO "TYPESENSE" ****** `)
          let uploadTime = 0
          const uploadInterval = setInterval(() => {
            process.stdout.write(`\r ****** upload Time : ${uploadTime++} seconds ******`)
          }, 1000)
          await client.collections(neworexistingCollection).documents().import(multipleArray, { action: 'create' })
          clearInterval(uploadInterval)
          console.log('\n')

          console.log(` ****** UPLOAD COMPLETED ****** `)
        } else {
          console.log(` ****** NO DATA TO UPLOAD ****** `)
        }

      } catch (error) {
        console.log(` ****** ERROR WHILE DOING UPLOAD ****** `)
        console.log(error.importResults[0])
        const allerror = error.importResults.filter(x => !x.success)
        console.log(allerror)
        console.log(` ****** ERROR : ${error.name} ****** `)
      }

    } catch (error) {
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
    console.log("CRONJOB COMPLETED FOR NSEFO")

},
null,
true,
'Asia/Kolkata'
);


module.exports = client