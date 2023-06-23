// // const checkArray = process.argv.slice(2).map(x => x.toLowerCase())
// // const getArgv = process.argv.slice(2)
// // console.log(checkArray.indexOf('all'))
// // return;

// const {userModel, subscriptionTrackingModel,subscriptionTrackingModel1510, watchlistModel, recentsearchModel } = require('./model');

const modelObjects = require("./model")

const ArrayOfModel = []
for (x in modelObjects) {
    // console.log(x)
    ArrayOfModel.push(x)
}

console.log(ArrayOfModel)




// // if(checkArray.includes('all')) {

//     ( async () =>{
//         await userModel.sync({ force: true });
//         console.log('userModel Empty')

//         await subscriptionTrackingModel.sync({ force: true });
//         console.log('subscriptionTrackingModel Empty')

//         await subscriptionTrackingModel1510.sync({ force: true });
//         console.log('subscriptionTrackingModel1510 Empty')

//         await watchlistModel.sync({ force: true });
//         console.log('watchlistModel Empty')

//         await recentsearchModel.sync({ force: true });
//         console.log('recentsearchModel Empty')
//         process.exit();
//     })()

// // }
