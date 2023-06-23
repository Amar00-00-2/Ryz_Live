const { notificationModel } = require("../model")

module.exports = {
    get_notification_fn: async (req, res) => {
        try {
            const getData = await notificationModel.findAll({
                where: [{ user_id: req.params.userId }]
            })
            return res.json({ status: 'success', result: getData })
        } catch (error) {
            return res.json({ status: "falied", message: error.message })
        }
    },
    get_count_fn: async (req, res) => {
        try {
            const getCount = await notificationModel.count({
                where: [{ user_id: req.params.userId }]
            })
            return res.json({ status: 'success', result: getCount })
        } catch (error) {
            return res.json({ status: 'failed', message: error.message })
        }
    },
    update_read_fn: async (req, res) => {
        try {   
            const updateData = await notificationModel.update({
                status: true
            }, {
                where: [{ id: req.params.id }]
            })
            return res.json({status: 'success', result: updateData })
        } catch (error) {
            return res.json({ status: 'failed', message: error.message })
        }
    },
    update_readall_fn: async (req, res) => {
        try {   
            const updateAllData = await notificationModel.update({
                status: true
            }, {
                where: [{ user_id: req.params.userId }]
            })
            return res.json({status: 'success', result: updateAllData })
        } catch (error) {
            return res.json({ status: 'failed', message: error.message })
        }
    }
}