const {BasketModel} = require('../model')
module.exports = {
    addBasket: async (req, res) => {
        const checkbasketForUserId = await BasketModel.findOne({where:{user_id: req.body.user_id}})
        if(checkbasketForUserId) {
            const updatebasket = await BasketModel.update({basket: req.body.basket},{where: {user_id: req.body.user_id}})
            if(updatebasket) {
                res.send({"status":"success"})
            } else {
                res.send({"status": "error"})
            }
        } else {
            const addbasket = await BasketModel.create(req.body)
            if(addbasket) {
                res.send({"status":"success"})
            } else {
                res.send({"status": "error"})
            }
        }
    },
    getBasket: async (user_id) => {
        const getbasket = await BasketModel.findOne({
            where:{user_id}, raw: true
        })
        if(getbasket) {
            return JSON.parse(getbasket.basket)
        } else {
            return {
                basket_title: ['basket1', 'basket2', 'basket3'],
                basket_data: {},
                basket_segment_data: []
            }
        }
    }
}