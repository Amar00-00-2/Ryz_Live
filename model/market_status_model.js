const { connection } = require('../config')
const { DataTypes } = require("sequelize")

const market_status = connection.define("market_status", {
    exchange_segment: {
        type: DataTypes.STRING(20)
    },
    exchange_instrument_id: {
        type: DataTypes.STRING(50)
    },
    market_type: {
        type: DataTypes.STRING(20)
    },
    message: {
        type: DataTypes.TEXT
    },
    trading_session: {
        type: DataTypes.STRING(20)
    },
    status_json: {
        type: DataTypes.TEXT
    },
});

(async () => {
    // await market_status.sync({force: true})
})()

module.exports = market_status