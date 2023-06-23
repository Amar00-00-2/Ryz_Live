// const { sipModel } = require("../model")
const axios = require('axios');
module.exports = {
    SipPlaceOrder: async (req, res) => {
        console.log("Innn");
        try {
            if(!req.headers.authorization ){
                return res.send({'status': 'error', 'msg': 'token not found' })
            }else{ 
                const InsertSip = await axios.post(`${process.env.APIInteractiveURL}/enterprise/sip`,req.body,{
                    headers: {
                      "Authorization": req.headers.authorization
                    }
                  })
                return res.json({status:"success",msg:InsertSip.data})
            }
        } catch (error) {
            console.log(error.message)
            res.json({status: "failed", message: error.message })
        }
    },
    SipModifyOrder: async (req, res) => {
        try {
            if(!req.headers.authorization ){
                return res.send({'status': 'error', 'msg': 'token not found' })
            }else{ 
                const ModifySip = await axios.post(`${process.env.APIInteractiveURL}/enterprise/sip`,req.body,{
                    headers: {
                      "authorization": req.headers.authorization
                    }
                  })
                return res.json({status:"success",msg:ModifySip.data})
            }
        } catch (error) {
            res.json({status: "failed", message: error.message })
        }
    },
    SipOrderBook: async (req, res) => {
        try {
            if(!req.headers.authorization ){
                return res.send({'status': 'error', 'msg': 'token not found' })
            }else{ 
                const SipOrders = await axios.post(`${process.env.APIInteractiveURL}/enterprise/sip/orderbook`,req.body,{
                    headers: {
                      "authorization": req.headers.authorization
                    }
                  })
                return res.json({status:"success",msg:SipOrders.data})
            }
        } catch (error) {
	    console.log(error)
            res.json({status: "failed", message: error.message })
        }
    },
    SipOrderCancel: async (req, res) => {
    console.log("Sip Innn...")
        try {
            if(!req.headers.authorization ){
                return res.send({'status': 'error', 'msg': 'token not found' })
            }else{ 
                const Req = req.body
                const body = {...Req,sipStatus:"Cancelled"}
                const SipOrders = await axios.post(`${process.env.APIInteractiveURL}/enterprise/sip`,body,{
                    headers: {
                      "authorization": req.headers.authorization
                    }
                  })
                return res.json({status:"success",msg:SipOrders.data})
            }
        } catch (error) {
	    console.log("Error: ",error)
            res.json({status: "error", message: error.message })
        }
    },
}
