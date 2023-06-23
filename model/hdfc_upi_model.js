const {connection} = require('../config')
const { DataTypes } = require("sequelize");
const hdfcBank = connection.define("hdfcBank", {
  user_id: DataTypes.STRING(50),
  ref_number: DataTypes.STRING(50),
  transaction_id: DataTypes.STRING(50),
  api_request: DataTypes.TEXT,
  api_response: DataTypes.TEXT,
  callback_response: DataTypes.TEXT,
  created_at: DataTypes.TEXT,
  updated_at: DataTypes.TEXT
}, {
  freezeTableName: true
});

(async () => {
  // await hdfcBank.sync({ force: true });
})()
module.exports = hdfcBank