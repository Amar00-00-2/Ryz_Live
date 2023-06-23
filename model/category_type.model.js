const {connection} = require('../config')
const { DataTypes } = require("sequelize");
const category_type = connection.define("category_type", {
  type_id:{
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement:true
    },
  type_name: {
    type: DataTypes.TEXT
  }, 
  },{
    freezeTableName: true
  });
(async () => {
  //await category_type.sync({force:true})
})()

module.exports= category_type
