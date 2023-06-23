const {connection} = require('../config')
const { DataTypes } = require("sequelize");

const scannerform = connection.define("scannerform", {
  scanner_id:{
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement:true
    },
  category_id: {
    type: DataTypes.INTEGER
  },
  exchangeSegment:DataTypes.STRING,
  exchangeInstrumentID:DataTypes.STRING,
  name:DataTypes.STRING,
}, {
  freezeTableName: true
});

(async () => {
  //await scannerform.sync({force:true})
})()

module.exports= scannerform
