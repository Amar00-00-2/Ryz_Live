const express = require("express")
const router = express.Router()
const { userController } = require('../controller')
const axios = require('axios')
const {redisclient} = require('../config')


const getDateFormat = (date) =>{
    const currentDate = new Date(date);
    const getDate = currentDate.getDate();
    const getMonth = currentDate.getMonth() + 1;
    const getFullYear = currentDate.getFullYear();
    return `${getFullYear}-${(getMonth > 10?getMonth: "0"+String(getMonth))}-${(getDate > 10?getDate: "0"+String(getDate))}`
}
router
    .route('/profile_pic')
    .post(userController.profile_pic_fn)
    
router
    .route('/get_user_details/:userId')
    .get(userController.get_user_details_fn)

router
    .route('/fingerprint_status')
    .post(userController.fingerprint_status_fn)

router
    .route('/firebase_token')
    .post(userController.firebase_user_fn)

router
    .route('/')
    .get(userController.users)
    .post(userController.userCreate)

router
    .route('/userauth')
    .post(userController.userAuth)
router
    .route('/userlogout/:userId')
    .delete(userController.UserLogout)
router
    .route('/userpin')
    .post(userController.userPinAuth)

router
    .route('/userunblock')
    .post(userController.userUnblock)

router
    .route('/forgotpassword')
    .post(userController.userForgotPassword)

router
    .route('/forgotpin')
    .post(userController.userForgotPin)

router 
    .route('/setpin')
    .post(userController.userSetPin)

router
    .route('/changepin')
    .post(userController.changepin)

router 
    .route('/changepassword')
    .post(userController.changepassword)

router
    .route('/fingerprint')
    .post(userController.fingerprint)

router
    .route('/connectclientwithmobileno')
    .post(userController.CreateClientIdForMobileNumber)

router
    .route('/clientauth')
    .get(async (req, res) => {
        let headersList = {
            "Accept": "*/*",
            "Content-Type": "application/json"
        }
        const response = await axios.post(`${process.env.APIInteractiveURL}/user/session`, {
            "secretKey": "Rpqt871@HL",
            "appKey": "f80d52b3172e99a0044326",
            "source": "WebAPI"
        }, {
            headers: headersList
        })
        // console.log(response.data)
        res.send(response.data)
        // const response = await
    })

router
    .route('/get_client_last_login/:userid')
    .get( async (req, res) =>{
       const uniqueKeyId = `ClientEveryDayToken${req.params.userid}`;

        // step 1: check, is this userid as the key in the rediscache. for that, need to use "exists" object function.
        const checkItHaskey = await redisclient.exists(uniqueKeyId);
        if(checkItHaskey) {
            // step 2: if it has the key, get the value using the key (value here is Date).
            const getDate = await redisclient.get(uniqueKeyId)
            const getKeyDateFormat = await getDateFormat(getDate);
            const getTodayDateFormat = await getDateFormat(new Date())
            console.log('getKeyDateFormat', getDate,getKeyDateFormat, 'getTodayDateFormat', getTodayDateFormat)
            if(getKeyDateFormat == getTodayDateFormat) {
                res.send({"status":"success", "loginStatus": "LoggedIn"})
            } else {    
                res.send({"status":"success", "loginStatus": "LoggedOut"})
            }
            // step 3: check value Data and today Date is same, if it is same, return the response as "LoggedIn" Or send the response "LoggedOut"

        } else {
            // there is no such a key. 
            res.send({"status":"success", "loginStatus": "LoggedOut"})
        }
    })


router
    .route('/set_client_last_login/:userid')
    .get( async (req, res) =>{
        const uniqueKeyId = `ClientEveryDayToken${req.params.userid}`;
        const getTodayDateFormat = await getDateFormat(new Date())
        await redisclient.set(uniqueKeyId, getTodayDateFormat)
        res.send({"status":"success", "loginStatus": "LoggedIn"})
    })

router.route('/profile').get(userController.userProfileData)

router
    .route('/generate_otp/:userId')
    .get( async (req, res) =>{
        try {
            const response = await axios.post(`${process.env.APIInteractiveURL}/enterprise/auth/regenerateotp`,
                {
                    "source":"WEB",
                    "userID": req.params.userId
                }
            )
            res.send({"status":"success", "msg":response.data.description })
        } catch (error) {

            res.send({"status":"error", "msg": error.response.data.description})
        }
    })

module.exports = router