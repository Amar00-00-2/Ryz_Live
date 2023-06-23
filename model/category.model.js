const {connection} = require('../config')
const { DataTypes } = require("sequelize");
const category = connection.define("category", {
  category_id:{
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement:true
    },
  category_type:{
    type: DataTypes.INTEGER,
  },
  category_name: {
    type: DataTypes.TEXT
  }, 
  }, {
    freezeTableName: true
  });
(async () => {
  //await category.sync({force:true})
})()

module.exports= category
