const { hdfcUPIModel } = require('../model')
const { robotData } = require('./myevents')

module.exports = (io) => {
    const ioconnection = io.of('/hdfc/callbackdata')
    ioconnection.on('connection', socket => {
        console.log('/hdfc/callbackdata connected')
        let hdfcInterval = null
        socket.on('status_request', (transactionId) => {
	    console.log("HDFC Response",transactionId)
            hdfcInterval = setInterval(async () => {
                socket.emit("connection_status", "HDFC Socket Connected Successfully")
                try {
                    const getCallBackResponse = await hdfcUPIModel.findOne({
                        where: [{transaction_id: transactionId}],
                        attributes: ['callback_response']
                    })
                    var callBackResponse = getCallBackResponse.dataValues.callback_response
		    console.log(getCallBackResponse)
		    console.log("Socket_Emit",callBackResponse)
                    socket.emit('status_response', callBackResponse)
                } catch (error) {
                    console.log(error)
                    socket.emit('status_error', error)
                    clearInterval(hdfcInterval)
                }
            }, 1500)
        })
        socket.on("disconnect", () => {
            clearInterval(hdfcInterval)
            console.log("HDFC Socket disconnected")
            socket.disconnect()
            robotData.remove(socket.id);
        });
    })
}
