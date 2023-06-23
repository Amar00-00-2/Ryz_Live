var { SendMailClient } = require('zeptomail')
module.exports={
    
    sendMail:async(emailTo,emailCc,emailBcc,emailSubject,emailContent)=> {
        try {
            const token = 'Zoho-enczapikey wSsVR611/0WmDqgvmWf7dbg/nFkEBA+jFksuilr07HT4GPrDosdulEHMAQOvTfdNE2NuEzdEpb8vzBlR2jtbjI4lm1tRXCiF9mqRe1U4J3x17qnvhDzJXG1amxaBLI8OxARvnGNhE80k+g=='
            const url = 'api.zeptomail.com/'
            let client = new SendMailClient({url, token});
            await client.sendMail({'bounce_address': 'bounce@bounce.treeone.co.in',
                'from':
                    { 
                        'address': 'noreply@treeone.in',
                        'name': 'noreply'
                    },
                'to':[{
                        'email_address':
                        {
                            'address': `${emailTo}`,
                            'name': `${emailTo}`
                        }
                    }],
                'cc':[{
                    'email_address':
                    {
                        'address': `${emailCc}`,
                        'name': `${emailCc}`
                    }
                }],
                'bcc':[{
                    'email_address':
                    {
                        'address': `${emailBcc}`,
                        'name': `${emailBcc}`
                    }
                }],
                'subject': `${emailSubject}`,
                'htmlbody': `${emailContent}`,
            })
            // console.log(client)
            console.log("mail send succes")
        } catch(err) {
            console.log(JSON.stringify(err))
        }
    }
    }
// }


