const {connection} = require('../config')
const { DataTypes } = require("sequelize");
const Payout = connection.define("payout", {
  userId: DataTypes.TEXT,
  paymentId: DataTypes.TEXT,
  amount: DataTypes.TEXT,
  apiResponse: DataTypes.TEXT
}, {
  freezeTableName: true
});

(async () => {
  await Payout.sync({ force: true });
})()

module.exports = Payout