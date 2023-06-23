const {connection} = require('../config')
const { DataTypes } = require("sequelize");
const recent_search = connection.define("recent_search", {
  user_id: DataTypes.TEXT,
  exchangeSegment: DataTypes.TEXT,
  exchangeInstrumentID: DataTypes.TEXT,
  recent_search: {
    type: DataTypes.TEXT
  }
}, {
  freezeTableName: true
});

(async () => {
//   await recent_search.sync({ force: true });
  // Code here
})()

module.exports = recent_search