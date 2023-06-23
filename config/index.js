// Sequelize config start
const { Sequelize } = require('sequelize');
const Typesense = require('typesense')
const Redis = require("ioredis");
const client = new Redis();
const moment = require("moment")
const axios = require('axios')

// const client = redis.createClient(6379);
const database = process.env.DB_DATABASE;
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const host = process.env.DB_HOST;

const sequelize = new Sequelize(database, username, password, {
    host,
    dialect: 'mysql',
    logging: false
});

// Sequelize config end
globalexchangesegment = { "NSECM": 1, "NSEFO": 2, "NSECD": 3, "BSECM": 11, "BSEFO": 12, "MCXFO": 51 }


let clientTypeSense = new Typesense.Client({
    'nodes': [{
      'host': 'localhost',
      'port': '8108',
      'protocol': 'http'
    }],
    'apiKey': 'mpXxyAwbS6bsifkkRIpabtSKSkLLotlkVFDtnovRlW1J24LP',
    'connectionTimeoutSeconds': 5
});
// old collection remove
// async function typesense() {
//   const typesenseOldCollectionList = await clientTypeSense.collections().retrieve();
//   for(i=0;i<typesenseOldCollectionList.length;i++) {
// console.log('oldssssssss', typesenseOldCollectionList[i].name)
//       if (typesenseOldCollectionList[i].name !== "NSEFO-" + moment().format("MM-DD-YYYY")+20) {
//       clientTypeSense.collections(typesenseOldCollectionList[i].name).delete()
//       console.log('oldssssssss', typesenseOldCollectionList[i].name)
//       } else {
//         console.log("todaytypesensecollection", typesenseOldCollectionList[i].name)
//       }
//     }
//   }
// typesense();

// export collection Data //
// async function typesense1() {
//     const typesenseOldCollectionList = await clientTypeSense.collections(`NSEFO-01-10-202321`).retrieve();
//     console.log('collection doc', typesenseOldCollectionList)
// }
// typesense1();

// master API //
// async function masterapi() {
//     getNSEData = await axios.post(`${process.env.APIInteractiveURL}/enterprise/instruments/master`, {
//         "exchangeSegmentList": [
//           'MCXFO',
//           'NSEFO',
//           'NSECM',
//           'NSECD'
//         ]
//       })
//       const totalSegment = getNSEData.data.result
//       const arraySegement = totalSegment.split('\n')
//       console.log('arrayData', arraySegement.length)
// }
// masterapi();
const neworexistingCollection = "NSEFO-" + moment().format("MM-DD-YYYY");
const Indexneworexistingcolection ="NSEFO-INDEX-" + moment().format("MM-DD-YYYY")
const Stockneworexistingcolection ="NSEFO-STOCKS-" + moment().format("MM-DD-YYYY")
const Currenciesfutneworexistingcolection ="NSEFO-CUR-FUT-" + moment().format("MM-DD-YYYY")
const Currenciesoptneworexistingcolection ="NSEFO-CUR-OPT-" + moment().format("MM-DD-YYYY")
const Commodityfuteworexistingcolection ="NSEFO-COMDTY-FUT-" + moment().format("MM-DD-YYYY")
const Commodityoptneworexistingcolection ="NSEFO-COMDTY-OPT-" + moment().format("MM-DD-YYYY")
module.exports = {
    connection: sequelize,
    globalexchangesegment,
    redisclient: client,
    client: clientTypeSense,
    neworexistingCollection,
    Indexneworexistingcolection,
    Stockneworexistingcolection,
    Currenciesfutneworexistingcolection,
    Currenciesoptneworexistingcolection,
    Commodityfuteworexistingcolection,
    Commodityoptneworexistingcolection
}
