const user_model = require('../model/user.model')
const wahtchList_model = require('../model/watchlist.model')
const {BasketModel} = require('../model')
var CronJob = require('cron').CronJob;
const checkData = async function() {
   // {where: {user_id: 'TABTREE05'}}
   const watchListData = await wahtchList_model.findAll();
   for(let i=0;i<watchListData.length;i++) {
      console.log('******************midnight run cron**************')
      // console.log('hi given', watchListData[i].watchlist)
      const totlalData = JSON.parse(watchListData[i].watchlist)
         var d = new Date();
         var date = `${String(d.getFullYear())+'-'+String(d.getMonth()+1 > 10?d.getMonth()+1:'0'+(d.getMonth()+1))+'-'+d.getDate()}`;
         const jsonData = totlalData.watchlist_title;
         var jsonData_watch1 = totlalData.watchlist_data;
         var segment = totlalData.watchlist_segment_data;
         var jsonData_watch = [totlalData.watchlist_data];
         var obj = []
         var objectKeyWatchName = Object.keys(jsonData_watch1);
         const filter = jsonData_watch.filter(object => {
            for (var i=0;i<objectKeyWatchName.length;i++) {
               const keyName = objectKeyWatchName[i];
               obj[keyName] = object[objectKeyWatchName[i]].filter(function(item){
               if (item.Series !== 'EQ') {
                  if(new Date(date) < new Date(item.ContractExpiration.split('T')[0]) )  {
                     return item
                  }
               } else {
                  return item
               }
               });
            }
         });
      const formatData = Object.assign({}, obj);
      const finalData = {watchlist_title:jsonData,watchlist_data:formatData,watchlist_segment_data:segment}
      const stringifyData = JSON.stringify(finalData)
      const userId = watchListData[i].user_id
      // console.log('hi retify', JSON.stringify(finalData))
      // update watch list data
      await wahtchList_model.update({watchlist: stringifyData},{where: {user_id: userId}})}
      }
//var job = new CronJob('20 0 * * *', checkData, null, true, 'Asia/Kolkata');
new CronJob('20 0 * * *',checkData , null , true , 'Asia/Kolkata')

//(async()=>{
  // checkData();
//})()


const removeBasketExpiry = async function () {
   const getBasketData = await BasketModel.findAll()
   for(let j=0; j < getBasketData.length; j++) {
      console.log('*****************Basket Cron Job*********************')
      // console.log('getBasketData', getBasketData[j])
      var d = new Date();
      var date = `${String(d.getFullYear())+'-'+String(d.getMonth()+1 > 10?d.getMonth()+1:'0'+(d.getMonth()+1))+'-'+d.getDate()}`;
      var userId = getBasketData[j].user_id
      var basketJsonData = JSON.parse(getBasketData[j].basket)
      var basketTitle = basketJsonData.basket_title
      var basketData = basketJsonData.basket_data
      var basketDataArray = [basketJsonData.basket_data]
      var obj = []
      var objectKeyBasketName = Object.keys(basketData);
      const filter = basketDataArray.filter(object => {
         for (var j=0;j<objectKeyBasketName.length;j++) {
            const keyName = objectKeyBasketName[j];
            obj[keyName] = object[objectKeyBasketName[j]].filter(function(item){
//	    console.log("sss",item)
	    console.log("sss",item.exchangeSegment)
            if (item.exchangeSegment !== 'NSECM') {
               if(new Date(date) < new Date(item.ContractExpiration.split('T')[0]) )  {
                  return item
               }
            } else {
                  return item
               }
            });
         }
      });
      const formatData = Object.assign({}, obj);
      const finalData = {basket_title:basketTitle,basket_data:formatData}
      const stringifyData = JSON.stringify(finalData)
      await BasketModel.update({basket: stringifyData},{where: {user_id: userId}})
   }
}
new CronJob('30 0 * * *', removeBasketExpiry, null, true, 'Asia/Kolkata')
//new CronJob('*/1 * * * *', removeBasketExpiry, null, true, 'Asia/Kolkata')
