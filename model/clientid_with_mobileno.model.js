const {connection} = require('../config')
const { DataTypes } = require("sequelize");
const clientwithmobileno = connection.define("clientwithmobileno", {
  ClientId: DataTypes.TEXT,
  MobileNumber: DataTypes.TEXT
}, {
  freezeTableName: true
});

// (async () => {
//   await clientwithmobileno.sync({ force: true });
// })()

module.exports = clientwithmobileno