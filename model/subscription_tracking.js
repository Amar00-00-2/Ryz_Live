const {connection} = require('../config')
const { DataTypes } = require("sequelize");
const subscription_tracking = connection.define("subscription_tracking", {
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
  await subscription_tracking.sync({ alter: true });
})()

module.exports = subscription_tracking