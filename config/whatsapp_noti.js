module.exports={
    WhatsApp: async (data) => {
            console.log('whatsstart')
            console.log(data.mobile);
            // const Access = await checkNotify(data.AppCode)
            // const adminOption=await userNotification({AppCode:data.AppCode,UserId:data.SendTo})
           
            // if (Access.Whatsappps == 'yes' && adminOption.WhatsApp=='Yes') {
                const now = new Date();
                var request = require("request");
                var options = {
                    method: 'POST',
                    url: 'https://live-server-11486.wati.io/api/v1/sendTemplateMessage',
                    qs: { whatsappNumber: '+91' + data.mobile },
                    headers:
                    {
                        'postman-token': '6f46ade8-fbb8-48af-f13f-ae3426ab6e26',
                        'cache-control': 'no-cache',
                        'content-type': 'application/json',
                        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2NDUwMDcyNy04NjU3LTQ0NGItYjU1ZS1hNmFjOTAyZWUzMmEiLCJ1bmlxdWVfbmFtZSI6InNhbXVlbC55QHRhYnRyZWUuaW4iLCJuYW1laWQiOiJzYW11ZWwueUB0YWJ0cmVlLmluIiwiZW1haWwiOiJzYW11ZWwueUB0YWJ0cmVlLmluIiwiYXV0aF90aW1lIjoiMTAvMTcvMjAyMiAwNzowMzozMSIsImRiX25hbWUiOiIxMTQ4NiIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6WyJCUk9BRENBU1RfTUFOQUdFUiIsIlRFTVBMQVRFX01BTkFHRVIiLCJERVZFTE9QRVIiXSwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.npxqckM9a_N7npp085Rugj6DH-XyoBuWELOvrXUASxU'
                    },
                    body:
                    {
                        template_name: data.template_name,
                        broadcast_name: data.template_name,
                        parameters: data.template,
                    },
                    json: true
        
               }
                request(options, async function (error, response, body) {
                    console.log(error)
                    if (error) throw new Error(error);
                    //console.log
                    // await db.Whats_Log.create({
                    //     AppCode: data.AppCode, ToType: "Mobile", ToMobileNumber: data.mobile, whatappsContent: JSON.stringify(body), whatsDateTime: now, UserId: data.UserId
                    // })
                    return body
                })
            // }
        },
    }