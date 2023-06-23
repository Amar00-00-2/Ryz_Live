const {connection} = require('../config')
const { DataTypes } = require("sequelize");
const User = connection.define("user", {
  name: DataTypes.TEXT,
  email: {
    type: DataTypes.TEXT
  },
  mobile: DataTypes.TEXT,
  password: DataTypes.TEXT,
  firebase_token: DataTypes.TEXT,
  fingerprint: DataTypes.STRING(20),
  profile_pic: DataTypes.TEXT
}, {
  freezeTableName: true
});

(async () => {
  // await User.sync({ alter: true });
})()

module.exports = User