const { connection } = require('../config')
const DataTypes = require("sequelize")

const notification = connection.define("notification", {
    user_id: DataTypes.STRING(50),
    subject: DataTypes.STRING(300),
    content: DataTypes.TEXT,
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    freezeTableName: true
});

(async () => {
    // await notification.sync({ force: true })
})()

module.exports = notification