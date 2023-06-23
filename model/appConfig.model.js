const {connection} = require('../config')
const { DataTypes } = require("sequelize");
const appConfig = connection.define("appConfig", {
  eventName: {
    type: DataTypes.TEXT
  },
  eventValue: {
    type: DataTypes.TEXT
  }
}, {
  freezeTableName: true
});

// (async () => {
//   await appConfig.sync({ force: true });
// })()

module.exports = appConfig