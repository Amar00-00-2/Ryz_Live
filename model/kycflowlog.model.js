const {connection} = require('../config')
const { DataTypes } = require("sequelize");
const kycflowlog = connection.define("kycflowlog", {
  mobile_number: DataTypes.TEXT,
  current_stage: DataTypes.TEXT
}, {
  freezeTableName: true
});

(async () => {
//   await kycflowlog.sync({ force: true });
})()

module.exports = kycflowlog