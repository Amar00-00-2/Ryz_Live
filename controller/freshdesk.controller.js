const axios = require('axios');
axios.defaults.baseURL = 'https://gillbrokingsupport.freshdesk.com/api/v2/'

const UserName = 'O3GvbWhlgxIX0BjmtWI';
const Password = 'X'
const AUTH = {
    username: UserName,
    password: Password
}
module.exports = {
    TicketStatus: (req, res) => {
            res.send([
            {
                id: '1',
                name: 'New'
            },
            {
                id: '2',
                name: 'Open'
            },
            {
                id: '3',
                name: 'Pending'
            },
            {
                id: '4',
                name: 'Resolved'
            },
            {
                id: '5',
                name: 'Closed'
            }
        ])
    },
    TicketPriority: (req, res) => {
            res.send([
            {
                id: '1',
                name: 'Low'
            },
            {
                id: '2',
                name: 'Medium'
            },
            {
                id: '3',
                name: 'High'
            },
            {
                id: '4',
                name: 'Urgent'
            }
        ])
    },
    createTicket: async (req, res) =>{
        try {

            /*
                Sample Body JSON

                {
                    'description': 'Details about the issue...',
                    'subject': 'Support Needed...',
                    'email': 'tom@outerspace.com',
                    'priority': 1,
                    'status': 2,
                    // "custom_fields": { "cf_userid" : "TABTREE03" }, // this is the custom_fields attribute. need to pass the custom filed label has key and in the value position pass the data.
                    'cc_emails': []
                }

            */
            console.log('req.body', req.body)
            const response = await axios.post(
                'tickets',
                req.body
                ,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    auth: AUTH
                }
            );
            res.send({"status":"success","msg": response.data})

        } catch (error) {

            console.log('error', error.response.data)

            res.send({"status":"error","msg": JSON.stringify( error.response.data)})
        }
    },
    getTicket: async (req, res) => {
        try {
            const response = await axios.get(`tickets/${req.params.id}`, {
                params: {
                    'include': 'conversations'
                },
                auth: AUTH
            });
            res.send({"status":"success","msg": response.data})

        } catch (error) {
            res.send({"status":"error","msg": JSON.stringify( error.response.data)})
        }
    },
    Tickets: async (req, res) => {
        try {
            const response = await axios.get('tickets', {
                auth: AUTH
            });
            res.send({"status":"success","msg": response.data})
        } catch (error) {
            res.send({"status":"error","msg": JSON.stringify( error.response.data)})
        }
    },
    TicketsByUserId: async (req, res) => {
        try {
            const response = await axios.get(`search/tickets?query="custom_string:${req.params.cf_client_code}"`, {
                auth: AUTH
            });
            res.send({"status":"success","msg": response.data})
        } catch (error) {
            console.log("error-TicketsByUserId", error.response.data)
            res.send({"status":"error","msg": JSON.stringify( error.response.data)})
        }
    },
    UpdateTicketById: async (req, res) => {
        try {

            /*
                SAMPLE BODY JSON
                {
                    'priority': 2,
                    'status': 3
                }

               // if you want, you can add other fields too
            */ 

            const response = await axios.put(
                `tickets/${req.params.id}`,
                req.body,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    auth: AUTH
                }
            );
            res.send({"status":"success","msg": response.data})
        } catch (error) {

            console.log("error.response", error.response.data)

            res.send({"status":"error","msg": JSON.stringify( error.response.data)})
        }
    },
    UpdateBulkOfTickets: async (req, res) =>{
        try {

            /*
                SAMPLE BODY OF JSON

                {
                    "bulk_action": {
                        "ids": [
                            20,
                            21,
                            22
                        ],
                        "properties": {
                            "from_email": "support@freshdesk.com",
                            "status": 2,
                            "group_id": 1234,
                            "type": "Question",
                            "priority": 4
                        },
                        "reply": {
                            "body": "Please check this ticket"
                        }
                    }
                }

                @bulk_action.ids contains the array of ticket ids that we are going update.

                @bulk_action.properties contains the object that we are going update to the ticket ids

                @bulk_action.reply contains the object data that we are going update to all the tickets
            */ 

            const response = await axios.post(
                'tickets/bulk_update',
                req.body,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    auth: AUTH
                }
            );
            res.send({"status":"success","msg": response.data})
        } catch (error) {
            res.send({"status":"error","msg": JSON.stringify( error.response.data)})
        }
    },
    DeleteTicketById: async (req, res) => {
        try {
            const response = await axios.delete(`tickets/${req.params.id}`, {
                auth: AUTH
            });
            res.send({"status":"success","msg": response.data})
        } catch (error) {
            console.log(error.response)
            if(error.response.status == 404) {
                res.send({"status":"error","msg": "Ticketid not found"})
            } else {
                res.send({"status":"error","msg": JSON.stringify( error.response.data)})
            }
        }
    },
    DeleteBulkofTickets: async (req, res) => {
        try {

            /*
                SAMPLE JSON BODY
                "bulk_action": {
                    "ids": [
                        20,
                        21,
                        22
                    ]
                }

                @bulk_action.ids contains the array of ticket ids
            */

            const response = await axios.post(
                'tickets/bulk_delete',
                req.body,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    auth: AUTH
                }
            );
            res.send({"status":"success","msg": response.data})
        } catch (error) {
            res.send({"status":"error","msg": JSON.stringify( error.response.data)})
        }
    },
    getAgentById: async (req, res) =>{
        try {
            const response = await axios.get(
                `agents/${req.params.id}`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    auth: AUTH
                }
            );
            res.send({"status":"success","msg": response.data})
        } catch(error) {
            if(error.response.status == 404) {
                res.send({"status":"error","msg": "AgentId not found"})
            } else {
                res.send({"status":"error","msg": JSON.stringify( error.response.data)})
            } 
        }
    },
    Categories: async (req, res) => {
        try {
            const response = await axios.get(
                `solutions/categories`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    auth: AUTH
                }
            );
            res.send({"status":"success","msg": response.data})
        } catch(error) {
            res.send({"status":"error","msg": JSON.stringify( error.response.data)})
        }
    },
    FoldersByCategoryId: async (req, res) =>{
        try {
            const response = await axios.get(
                `solutions/categories/${req.params.category_id}/folders`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    auth: AUTH
                }
            );
            res.send({"status":"success","msg": response.data})
        } catch(error) {
            res.send({"status":"error","msg": JSON.stringify( error.response.data)})
        }
    }, 
    ArticlesByFolderId: async (req, res) => {
        try {
            const response = await axios.get(
                `solutions/folders/${req.params.folder_id}/articles`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    auth: AUTH
                }
            );
            res.send({"status":"success","msg": response.data})
        } catch(error) {
            res.send({"status":"error","msg": JSON.stringify( error.response.data)})
        }
    },
    getArticleById: async (req, res) => {
        try {
            const response = await axios.get(
                `solutions/articles/${req.params.article_id}`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    auth: AUTH
                }
            );
            res.send({"status":"success","msg": response.data})
        } catch(error) {
            res.send({"status":"error","msg": JSON.stringify( error.response.data)})
        }
    }

}

