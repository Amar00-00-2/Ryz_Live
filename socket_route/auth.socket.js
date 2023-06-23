// const {} = require('../model')
const {redisclient} = require('../config')

module.exports = (io) =>{

    const ioconnection = io.of('/auth')
    ioconnection.on('connection', socket => {
        console.log('socket.auth.handshake',socket.handshake.auth)
        socket.join(socket.handshake.auth.userid)
        socket.on('new_device_logged_in', () =>{
            socket.to(socket.handshake.auth.userid).emit('auto_logout', 'trigger logout')
        })
    })
}