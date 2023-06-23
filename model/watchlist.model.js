const {connection} = require('../config')
const { DataTypes } = require("sequelize");
const watchlist = connection.define("watchlist", {
  user_id: DataTypes.TEXT,
  watchlist: {
    type: DataTypes.TEXT
  }
}, {
  freezeTableName: true
});

(async () => {
//   await watchlist.sync({ force: true });
  // Code here
})()

module.exports = watchlist