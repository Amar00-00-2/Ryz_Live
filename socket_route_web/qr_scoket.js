var XtsMarketDataWS = require("xts-marketdata-api").WS;
const { robotData } = require("../socket_route/myevents");
const { redisclient } = require('../config')
const crypto = require("crypto");


module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log('qr connected')
    socket.on("connect_qr", async (timestamp) => {
      const token = crypto.randomBytes(64).toString("hex");
      let channel_data =
        new Date().getDate() +
        "-" +
        new Date().getMonth() +
        "-" +
        new Date().getMinutes();
      let channel_data_hash = crypto
        .createHash("md5")
        .update(channel_data + "||" + token)
        .digest("hex");
      await redisclient.set(channel_data_hash, socket.id);
      // const timestampToken = await redisclient.get(channel_data_hash);
      // console.log("timestampToken", timestampToken, socket.id);
      console.log({
        success: true,
        msg: "QR DATA Created",
        data: {
          channel: channel_data_hash,
        },
      });
      socket.emit("get_qr", {
        success: true,
        msg: "QR DATA Created",
        data: {
          channel: channel_data_hash,
        },
      });
      var i = 29
      var inter = setInterval(() => {
        socket.emit("get_qr_seconds", {
          seconds: i,
        });
        if (i == 1) {
          clearInterval(inter)
        }
        i--
      }, 1000);
      setInterval(async () => {
        const token = crypto.randomBytes(64).toString("hex");
        let channel_data =
          new Date().getDate() +
          "-" +
          new Date().getMonth() +
          "-" +
          new Date().getMinutes();
        let channel_data_hash = crypto
          .createHash("md5")
          .update(channel_data + "||" + token)
          .digest("hex");
        await redisclient.set(channel_data_hash, socket.id);
        // const timestampToken = await redisclient.get(channel_data_hash);
        // console.log("timestampToken", timestampToken, socket.id);
        console.log({
          success: true,
          msg: "QR DATA Created",
          data: {
            channel: channel_data_hash,
          },
        });
        socket.emit("get_qr", {
          success: true,
          msg: "QR DATA Created",
          data: {
            channel: channel_data_hash,
          },
        });
        var i = 29
        var inter = setInterval(() => {
          socket.emit("get_qr_seconds", {
            seconds: i,
          });
          if (i == 1) {
            clearInterval(inter)
          }
          i--
        }, 1000);
      }, 30000);
    });

    socket.on("verify_qr", async (data) => {
      console.log(data);
      const timestampToken = await redisclient.get(data.token);
      console.log("timestampToken", timestampToken, socket.id);
      if (timestampToken) {
        // console.log(ioconnection)
        // console.log(io.sockets.in(timestampToken), 'sdsd');
        io.sockets.in(timestampToken).emit("verify_status", { status: true, qwert: data.userdata });
      }
    });
    socket.on("disconnect", () => {
      console.log("QR Socket Disconnected")
      socket.disconnect();

      console.log('socket disconnection', socket.connected);
      robotData.remove(socket.id);
    });
  })
};
