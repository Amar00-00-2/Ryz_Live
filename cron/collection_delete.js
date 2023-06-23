const { AppConfigModel, subscriptionTrackingModel, subscriptionTrackingModel1510 }= require('../model')
const { client } = require('../config')
var CronJob = require('cron').CronJob
var firebase = require('../config/firebase_config')
const sequelize = require('sequelize')

// Remove typsense collection other than current day collection -START //

const delete_collection_fn = async function () {
    try{
        console.log('*******Collection Drop Cron********')
        //Get Database Current Collection Name
        const getCurrentCollection = await AppConfigModel.findAll({})
        const DataBaseArray = getCurrentCollection.map((x)=> x.eventValue)
        
        //Get cTypesense Collection Current Name
        const getCollectionList = await client.collections().retrieve()
        const CollectionArray= getCollectionList.map((x)=>x.name)
        
        //Dlete The Old Collection in Typesense
        const CollectionDeleteArray =CollectionArray.filter((x)=>!DataBaseArray.includes(x))
        CollectionDeleteArray.map(async(x)=>{
            console.log(`Old Collection Deleted ${x}`);
            await client.collections(x).delete()
        })
    }catch(err){
        console.log(err);
    }
}
new CronJob('0 22 * * *', delete_collection_fn, null, true, 'Asia/Kolkata')
// new CronJob('55 17 * * *', delete_collection_fn, null, true, 'Asia/Kolkata')

// Remove typsense collection other than current day collection -END //

// Remove Subscription 1502 Tracking Table datas except current day datas -START //

const remove_subscription_fn = async function () {
    console.log('********Delete Subscripiton Table Data**********')
    const getData = await subscriptionTrackingModel.destroy({
        where: [ sequelize.where(sequelize.literal('DATE(`subscription_tracking`.`createdAt`) != CURRENT_DATE()'), '>', 0)]
    })
    // console.log("getData", getData.length)
}
new CronJob('0 0 * * 0', remove_subscription_fn, null, true, 'Asia/Kolkata')

// Remove Subscription Tracking Table datas except current day datas -END //

// Remove Subscription 1510 Tracking Table datas except current day datas -START //

const remove_subscription1510_fn = async function () {
    console.log('********Delete Subscripiton1510 Table Data**********')
    const getData = await subscriptionTrackingModel1510.destroy({
        where: [ sequelize.where(sequelize.literal('DATE(`subscription_tracking1510`.`createdAt`) != CURRENT_DATE()'), '>', 0)]
    })
    // console.log("getData", getData.length)
}
new CronJob('10 0 * * 0', remove_subscription1510_fn, null, true, 'Asia/Kolkata')

// Remove Subscription 1510 Tracking Table datas except current day datas -END //