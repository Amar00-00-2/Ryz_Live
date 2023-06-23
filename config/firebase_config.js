var admin = require('firebase-admin')
var serviceAccount = {
    "type": "service_account",
    "project_id": "ryz-app-53c1b",
    "private_key_id": "89c6ddc6dc2041186d23ff3610f6ec799eafb8e3",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDd6W8wiSRv25TW\n03GkFW+JLV+0zFqd4ZahuAu4VGPTfEYuqYbWu33DxWSqmI8fVqIwWQkKsM3Gbao1\n8bZvPU9JXHR+eCpLk+nc3h/Sb+ttkASPtcQj/m+gyuYILH4WTw1iY4n29HoCuCm+\nJXhGN08Mw2uMXOcVp9t/whXkBeFukXQB4mpUcUsVh9zQkxx1/Z62jeL/yawVWT8+\nrC7IeBym2EfgR0FrNE8w24vsp203s1qB3h/sG+b9XBeYCKj+GlnWTPLiiCyujv56\nEkzxBl8U/gJ4+1FlFyoOjHmaqsAmhzM0dewDuxK4vEQyS2TnGVh04SZcVqi3Wabe\nqLhMLi5pAgMBAAECggEAFQ3y2L4KUPqaco95NsI55OADNpo09snSiuF1azXGiug9\nmGvJOVJsqkhuNqlm2uhTVxb7fqIrw+nfvmKClqdQgHtfKiioiqcsByKkDklEIw8I\n/8GVLH0VhkH59UiTZfZ2JKGhE2c6tEtY2oufj7nrrCBWcejWm/1jHAoEHbBZJS5G\ngUut6dwllFCFhORsQtrAPYDlbLxIeQjcyddGfeyeL0G7VUvLmph4t5fDwvqb6Sd8\nFyCowFADhxlhYmRZJ5XTZb2PGTa4XMGG795fyi4zx4xe4hng1BIugBBTCoBzAkSh\ns95/Y13WFUvtgC2sM9L0Vnh1q3BRvPTCITyGlkpaAQKBgQDyb2WZwDqj2VO3fc1X\np2sHIx0gbJTQpzMb6a248ZUQlf2pAwEPeyrEHUVbZ6o3h0F6VKKckOJ/s8j/jo7U\nhBm97zQpx470Y+6ucPltRyeHXLMAbY7HjBIw5rThGVMlyCyejw+lI9V2Sai7uciI\nJYGvGf7Y5J9RB5PIKgJTaAtoIQKBgQDqVBCmhXjL8MZPGDrks+9DfqTDAHxcvBJN\nDNwxSCSrPL7Y33NyJeK00jAHutNC36bFJLhuJ5CHBoLaSkosQWSyJx6D0wOx2Wk9\nHzFs8Fru3j8M+gS/8sAxy+o95T5YIusCTfHLSRQ9M0u9VGWynjhiusd0FwwwMUab\ng+BzwundSQKBgBMuLwqgA8Os0QvGXzWdIEGbTJWhIZD0eX2u2ji0nEeIpl31x+Ky\nquqDKlaV+AiWod6MzaS3bcQOtEtLuw8jOGonf6gCitPZCCwy8fjsVTtHYT4abN5q\nvZGy3wKkH0jw8l7FEMbO8/d80mWvyCbFWOJCm0ALrnMZt15xvGde5vAhAoGBAMJI\nWtnF9iaZBcLUYxf1+92pJfAr+fBlWoMZs4MEvqpfHhjwA2bT9IhZcMsn4jsi9cGk\ntWlXUmQxSNK2H5Nb0KJI/urrTLfre27a6v7YtXwxNnOK499F5IYk/Jy+8hbfNJxf\nhac3exlW62gZjowu1K8/D1m4NjnK0TDlgXZZV89JAoGBAN/40bt33hUW9xWFj+iq\n0YyIvzX50wnT+0R+4SRgs6LCjGZgJtgWyXKdb4iFFEUGleNPTAgK88LI8bFNvGdq\nfPgsNgm+fb0XCb52G5VLgOHixPB6CSyAs1bnEFmt0Y29N9TcE5arLC3uPv00+Thn\nO/wqWlJs1on616K9eF3xJNVC\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-661y5@ryz-app-53c1b.iam.gserviceaccount.com",
    "client_id": "102031622784135077314",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-661y5%40ryz-app-53c1b.iam.gserviceaccount.com"
}
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

const sendFirebaseNotifcation = async (data) => {
    var payload = {
        notification: {
            title: data.notification_subject,
            body: data.notification_message,
            // image: ""
        }
    }
    var options = { priority: "high", timeToLive: 60*60*24 }
    
    admin.messaging().sendToDevice(data.notification_to_fbid, payload, options)
    .then(function(response) {
        console.log("Message Sent Successfully: ", response)
    })
    .catch(function(error) {
        console.log("Message Sending Failed: ", error)
    })
}
module.exports = {
    sendFirebaseNotifcation
}