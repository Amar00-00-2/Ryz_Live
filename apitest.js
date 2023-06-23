const axios = require('axios')
let headersList = {
 "Accept": "*/*",
 "User-Agent": "Thunder Client (https://www.thunderclient.com)",
 "Authorization": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJURVNUMTQwX0Y4MEQ1MkIzMTcyRTk5QTAwNDQzMjYiLCJwdWJsaWNLZXkiOiJmODBkNTJiMzE3MmU5OWEwMDQ0MzI2IiwiaWF0IjoxNjUyODg0MzM5LCJleHAiOjE2NTI5NzA3Mzl9.u239s4lqbJq9C2XjAiqV3wTZxUMiQWlcZVPnI8y7xHw",
 "Content-Type": "application/json" 
}

let bodyContent = {
  "exchangeSegment": "NSECM",
  "exchangeInstrumentID": 11536,
  "productType": "NRML",
  "orderType": "LIMIT",
  "timeInForce": "DAY",
  "disclosedQuantity": 6,
  "orderQuantity": 15,
  "limitPrice": 3490,
  "stopPrice": 0,
  "orderUniqueIdentifier": "Gill2022051817i52"
};

let reqOptions = {
  url: "https://developers.symphonyfintech.in/interactive/orders",
  method: "POST",
  headers: headersList,
  body: bodyContent,
}

axios.request(reqOptions).then(function (response) {
  console.log(response.data);
}).catch (error => {
    if(error.response.data.code == 'e-app-001') {
        console.log(error.response.data.result.errors)
    }
    console.log(error.response.data)
})
console.log('jGAJHDGSAKJDGKASJ')