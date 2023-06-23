var XtsMarketDataWS = require('xts-marketdata-api').WS;

// Socket Testing //
xtsMarketDataWS = new XtsMarketDataWS("https://trd.gillbroking.com:3000/marketdata");
var socketInitRequest = {
  userID: 'TABTREE09',
  publishFormat: 'JSON',
  broadcastMode: 'Full',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJUQUJUUkVFMDkiLCJtZW1iZXJJRCI6IkdJTEwiLCJzb3VyY2UiOiJFTlRFUlBSSVNFTU9CSUxFIiwiaWF0IjoxNjcyMTE2Mzk3LCJleHAiOjE2NzIyMDI3OTd9.ZirDc64pgQcTJ_kArNXCc-0OCAYgTNqIxmWFRFq_OQg', // Token Generated after successful LogIn
};
xtsMarketDataWS.init(socketInitRequest);

console.log(xtsMarketDataWS)
// Socket Testing //
