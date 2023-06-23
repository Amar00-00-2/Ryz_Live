const {recentsearchModel} = require('../model')
module.exports = {
    addrecentsearch: async (req, res) => {
        const checkForUserId = await recentsearchModel.findOne({where:{user_id: req.body.user_id,exchangeSegment: req.body.exchangeSegment, exchangeInstrumentID: req.body.exchangeInstrumentID }})
        if(!checkForUserId) {
            console.log("inserting new log")
            const addrecentsearch = await recentsearchModel.create(req.body)
            if(addrecentsearch) {
                res.send({"status":"success"})
            } else {
                res.send({"status": "error"})
            }
        } else {
            console.log("alreadylog")
        }
    },
    getrecentsearch: async (req, res) => {
        const getrecentsearch = await recentsearchModel.findAll({
            where:{user_id: req.params.user_id}, raw: true
        })
        if(getrecentsearch) {
            res.send(getrecentsearch)
        } else {
            res.send([])
        }
    },
    deleterecentsearch: async (req, res) => {
        const deleterecentsearch = await recentsearchModel.destroy({
            where: req.params
        })
        if(deleterecentsearch) {
            res.send({"status":"success", msg:deleterecentsearch})
        } else {
            res.send({"status":"error", msg:`something wrong while deleting id ${req.params.id}`})
        }
    }
}