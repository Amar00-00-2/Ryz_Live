const {connection} = require('../config')
const { DataTypes } = require("sequelize");
const Payin = connection.define("payin", {
  userId: DataTypes.TEXT,
  paymentId: DataTypes.TEXT,
  amount: DataTypes.TEXT,
  apiResponse: DataTypes.TEXT
}, {
  freezeTableName: true
});

(async () => {
  await Payin.sync({ force: true });
})()


module.exports = Payin