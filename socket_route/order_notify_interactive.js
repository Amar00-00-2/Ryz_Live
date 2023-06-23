const { userModel } = require('../model')
const { robotData } = require('./myevents')
const XtsInteractiveDataWS = require('xts-interactive-api').WS
console.log('interactiveSocket', XtsInteractiveDataWS)
module.exports = (io) => {
    const ioconnection = io.of('trade/interactive')
    ioconnection.on('connection', socket => {
        console.log('trade/interactive connected')
        socket.on('connect', function() {
            console.log('interactive socket connected successfully')
        })
    })
}