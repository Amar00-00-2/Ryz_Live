const {KycFlowModel, KycFlowLogModel, userModel} = require("../model")
const firebase = require('../config/firebase_config')
module.exports = {
    updateFireBaseToken: async (req, res) => {
        try {
            const {mobilenumber,firebasetoken}=req.body
            const updateFireBaseToken = await KycFlowModel.update({firebase_token:firebasetoken},{where: {mobile_number:mobilenumber}});
            if(updateFireBaseToken) {
                res.send({"status":"success", message: `firebase token updated`})
            } else {
                res.send({"status":"error", message: "Mobile Number isn't found"})
            }
        } catch (error) {
            console.log(error)
            res.send({ "status":"error", message: error.message })
        }
    },
    notificationMessage: async (req, res) => {
        try {
            const {mobilenumber, clientcode, status, message }=req.body
            if(!mobilenumber) {
                return res.send({"status":"error", message: "Mobile Number is required"})
            } else {
                const data ={ mobilenumber, clientcode, status, message }
                const getUserFirebaseToken = await KycFlowModel.findOne({
                    where: [{mobile_number: mobilenumber}],
                    attributes: ['firebase_token']
                })
                var fbToken = getUserFirebaseToken.dataValues.firebase_token
                const fbData = {
                    notification_to_fbid: `${fbToken}`, 
                    notification_subject: 'KYC Activation', 
                    notification_message: `Hi ${clientcode}, Your kyc status: ${status}, ${message}`
                }
                await firebase.sendFirebaseNotifcation(fbData)
                
                return res.json({status:"success",message:data})
            }
            } catch (error) {
                res.send({"status":"error", message: error.message })
            }
        },
    notificationREKYC: async (req, res) => {
        try {
            const {mobilenumber, clientcode, status, message }=req.body
            if(!clientcode) {
                return res.send({"status":"error", message: "Client Code is required"})
            } else {
                const data ={ mobilenumber, clientcode, status, message }
                const getUserFirebaseToken = await userModel.findOne({
                    where: [{name: clientcode}],
                    attributes: ['firebase_token']
                })
                var fbToken = getUserFirebaseToken.dataValues.firebase_token
                const fbData = {
                    notification_to_fbid: `${fbToken}`, 
                    notification_subject: 'KYC ReActivation', 
                    notification_message: `Hi ${clientcode}, Your rekyc status: ${status}, ${message}`
                }
                await firebase.sendFirebaseNotifcation(fbData)
                
                return res.json({status:"success",message:data})
            }
            } catch (error) {
                res.send({"status":"error", message: error.message })
            }
        },
    
    getKycStage: async (req, res) => {
        try {
            const getLastKycStage = await KycFlowModel.findOne({where: req.params, order: [
                ['id', 'DESC']
            ]});
            if(getLastKycStage) {
                res.send({"status":"success", msg: getLastKycStage})
            } else {
                res.send({"status":"error", msg: "mobile number isn't found"})
            }
        } catch (error) {
            console.log(error)
            res.send({"status":"error", msg: "something went wrong. ask your developer"})
        }
    },
    createKycStage: async (req, res) => {
        try {
            if(!req.body.mobile_number) {
                return res.send({"status":"error", msg: "mobile_number key is required"})
            }
            if(!req.body.current_stage) {
                return res.send({"status":"error", msg: "current_stage key is required"})
            }
            const createKycStage = await KycFlowModel.create(req.body);
            if(createKycStage) {
                const createKycStageLog = await KycFlowLogModel.create(req.body);
                res.send({"status":"success", msg: createKycStage})
            }
        } catch (error) {
            res.send({"status":"error", msg: "something went wrong. ask your developer"})
        }
    }
}