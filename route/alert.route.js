const express = require("express")
const router = express.Router()
const axios = require('axios')

/**
 * Alert Module
 * 1. Set Alert
 * 2. Get Alert List
 * 3. Modify Alert
 * 4. Delete Alert
 */
router
     .route('/set_alert')
     .post(async(req,res)=>{
         if (!req.headers.tradingauthorization) {
             res.send({ 'status': 'error', 'msg': 'token not found' })
             return
         }
         
         let headersList = {
             "Authorization": req.headers.tradingauthorization,
             "Content-Type": "application/json; charset=utf-8"
         }
         console.log(req.body)
         /**
          * symphony api call to set alert.
          */
         try {
             const setAlert = await axios.post(`${process.env.APIInteractiveURL}/enterprise/alert`, JSON.stringify(req.body), {
                 headers: headersList
             })
             res.send({ 'status': 'success', 'msg': setAlert.data })
         } catch (e) {
             console.log(e.response.data)
             res.send({ 'status': 'error', 'msg': e.response.data.description })
         }
     })
 
 router
     .route('/get_alert_list')
     .get(async(req,res)=>{
         if (!req.headers.tradingauthorization) {
             res.send({ 'status': 'error', 'msg': 'token not found' })
             return
         }
         
         let headersList = {
             "Authorization": req.headers.tradingauthorization,
             "Content-Type": "application/json; charset=utf-8"
         }
         try{
             const alertList = await axios.get(`${process.env.APIInteractiveURL}/enterprise/alert?userID=${req.headers.userid}`, {
                 headers: headersList
             });
             res.send({'status': 'success', 'alert_list': alertList.data})
         }catch (e) {
             console.log(e.response.data)
             res.send({ 'status': 'error', 'msg': e.response.data.description })
         }
     })
 
 router
     .route('/modify_alert')
     .post(async(req,res)=>{
         if (!req.headers.tradingauthorization) {
             res.send({ 'status': 'error', 'msg': 'token not found' })
             return
         }
         let headersList = {
             "Authorization": req.headers.tradingauthorization,
             "Content-Type": "application/json; charset=utf-8"
         }
         // Modify alert api call
         try{
             const modifyAlert = await axios.put(`${process.env.APIInteractiveURL}/enterprise/alert`,JSON.stringify(req.body), {
                 headers: headersList
             })
             res.send({'status': 'success', 'msg': modifyAlert.data})
         }catch (e) {
             console.log(e.response.data)
             res.send({ 'status': 'error', 'msg': e.response.data.description })
         }
     })
 

router
    .route('/delete_alert')
    .delete(async(req,res)=>{
        // console.log(req.headers)
        if (!req.headers.tradingauthorization) {
            res.send({ 'status': 'error', 'msg': 'token not found' })
            return
        }
        // console.log(req.headers)
        let headersList = {
            "Authorization": req.headers.tradingauthorization,
            "Content-Type": "application/json; charset=utf-8"
        }
        try{
            const deleteAlert = await axios.delete(`${process.env.APIInteractiveURL}/enterprise/alert?alertID=${req.headers.alertid}`, {
                headers: headersList
            });
            res.send({'status': 'success', 'msg': deleteAlert.data})
        }catch (e) {
            console.log(e.response.data)
            res.send({ 'status': 'error', 'msg': e.response.data.description })
        }
    })

module.exports = router