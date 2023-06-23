const {connection} = require('../config')
const { DataTypes } = require("sequelize");
const subscription_tracking1510 = connection.define("subscription_tracking1510", {
  user_id: DataTypes.TEXT,
  subsscription: {
    type: DataTypes.TEXT
  },
  source: {
    type: DataTypes.STRING(20)
  }
}, {
  freezeTableName: true
});

(async () => {
  await subscription_tracking1510.sync({ alter: true });
})()

module.exports = subscription_tracking1510
