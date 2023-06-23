const express = require("express");
const router = express.Router();
const axios = require("axios");

router
    .route('/generate_refercode/:mobile_number')
    .get( async (req, res) => {
    // make a request for the smartkyc gill api to get reference code using mobile number
    try {
        const referCodeReponse = await axios.post('https://smartkyc.gillbroking.com/gillbroking/KYC_generate_refercode',{
            "keyword": req.params.mobile_number
        },{
            headers: {
                "Content-Type": "application/json"
            }
        })
        res.send({"status":"success", msg: referCodeReponse.data})

    } catch (error) {
        console.log(error)
        res.send({"status":"error", msg: "something went wrong"})
    }
    })

module.exports = router