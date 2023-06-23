const {connection} = require('../config')
const { DataTypes } = require("sequelize");
const sip = connection.define("sip", {
  exchange_segment: {
    type: DataTypes.STRING(50)
  },
  exchange_instrument_id: {
    type: DataTypes.STRING(50)
  },
  product_type: {
    type: DataTypes.STRING(50)
  },
  order_type: {
    type: DataTypes.STRING(50)
  },
  time_in_force: {
    type: DataTypes.STRING(50)
  },
  disclose_quantity: {
    type: DataTypes.STRING(50)
  },
  order_quantity: {
    type: DataTypes.STRING(50)
  },
  limit_price: {
    type: DataTypes.STRING(50)
  },
  stop_price: {
    type: DataTypes.STRING(50)
  },
  is_amo: {
    type: DataTypes.STRING(50)
  },
  client_id: {
    type: DataTypes.STRING(50)
  },
  user_id: {
    type: DataTypes.STRING(50)
  },
  source: {
    type: DataTypes.STRING(50)
  },
  expiry_date: {
    type: DataTypes.STRING(100)
  },
  frequency: {
    type: DataTypes.STRING(50)
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  freezeTableName: true
});

(async () => {
  // await sip.sync({ force: true });
})()
module.exports = sip