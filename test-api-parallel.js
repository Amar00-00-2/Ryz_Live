const axios = require("axios");
const async = require('async');


async function getResponse() {
    // console.log('api 1 start', new Date())
    // const requestApi1 = await axios.get('https://jsonplaceholder.typicode.com/todos');
    // console.log('requestApi1', requestApi1.data.length);
    // console.log('api 1 end', new Date())
    // console.log('api 2 start', new Date())
    // const requestApi2 = await axios.get('https://jsonplaceholder.typicode.com/todos');
    // console.log('requestApi2', requestApi2.data.length);
    // console.log('api 2 end', new Date())
    // return [, await axios.get('https://jsonplaceholder.typicode.com/todos')]
}

( async () => {

    console.log('api 1 start', new Date())
    const requestApi1 = await axios.get('https://jsonplaceholder.typicode.com/todos');
    console.log('requestApi1', requestApi1.data.length);
    console.log('api 1 end', new Date())
    console.log('api 2 start', new Date())
    const requestApi2 = await axios.get('https://jsonplaceholder.typicode.com/todos');
    console.log('requestApi2', requestApi2.data.length);
    console.log('api 2 end', new Date())

    console.log('parallel api 1 start', new Date())
    async.parallel({
        one: function(callback) {
            const response = axios.get('https://jsonplaceholder.typicode.com/todos').then(results => {
                callback(null, results.data.length);
            })
        },
        two: function(callback) {
            const response = axios.get('https://jsonplaceholder.typicode.com/todos').then(results => {
                callback(null, results.data.length);
            })
        }
    }, function(err, results){
        console.log('results', results)
        console.log('parallel api 1 end', new Date())
    } )

})()