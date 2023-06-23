const { notificationModel } = require("../model")
const { robotData } = require("./myevents")

module.exports = (io) => {
    const ioconnection = io.of('socket_path/notification')
    ioconnection.on('connect', socket => {
        console.log("socket path connected")
        let notifyInterval = null
        socket.on('notify_request', (userId) => {
            notifyInterval = setInterval(async () => {
                socket.emit("connection_status", "Notify socket connected")
                try {
                    const getData = await notificationModel.findAll({
                        where: [{ user_id: userId }]
                    })
                    const getCount = await notificationModel.count({
                        where: [{ user_id: userId }]
                    })
                    socket.emit('notification_socket_data', { notificationData: getData, notificationCount: getCount }) 
                } catch (error) {
                    console.log(error.message)
                    socket.emit('status_error', error)
                    clearInterval(notifyInterval)
                }
            }, 1500)
        })
        socket.on("disconnect", () => {
            clearInterval(notifyInterval)
            console.log("Notify socket disconnected")
            socket.disconnect()
            robotData.remove(socket.id);
        });
    })
}