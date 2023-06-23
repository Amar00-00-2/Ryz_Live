const axios = require('axios')
var socketIoClient = require("socket.io-client");

const url = 'https://developers.symphonyfintech.in'
const LoginData = async () => {
    const res = await axios.post(url+'/marketdata/auth/login', {
        secretKey: "Dfff656$8y",
        appKey: "d79ac40818c562f9872853",
        "source": "WebAPI"
    })
    return res.data
}

(async () =>{
    const logindata = await LoginData()
    var token = logindata.result.token;
    console.log(token)

    var socket = await socketIoClient(url, {
        path: '/marketdata/socket.io',
        query: {
            token: token,
            userID: "TEST140",
            publishFormat: "JSON",
            broadcastMode: "Full"
        }
    });


    console.log(socket)

    socket.on('connect', function () {
        console.log("connected")
    });

    socket.on("1502-json-full",function(data){
    console.log("data is "+data);
    }); 

    socket.on("1105-json-partial",function(data){
        console.log("data is "+data);
       });

})()

