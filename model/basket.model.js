const {connection} = require('../config')
const { DataTypes } = require("sequelize");
const basket = connection.define("basket", {
  user_id: DataTypes.TEXT,
  basket: {
    type: DataTypes.TEXT
  }
}, {
  freezeTableName: true
});

(async () => {
//   await basket.sync({ force: true });
})()

module.exports = basket