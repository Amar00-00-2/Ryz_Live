const {connection} = require('../config')
const { DataTypes } = require("sequelize");
const kycflow = connection.define("kycflow", {
  mobile_number: DataTypes.TEXT,
  current_stage: DataTypes.TEXT,
  firebase_token: DataTypes.TEXT
}, {
  freezeTableName: true
});

(async () => {
  // await kycflow.sync({ alter: true });
})()

module.exports = kycflow