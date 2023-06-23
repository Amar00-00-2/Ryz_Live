const axios= require('axios')
module.exports = {
    BasketOrderPlace: async (req, res) => {
        try{
            if(!req.headers.authorization ){
                return res.send({'status': 'error', 'msg': 'token not found' })
            }else{ 
                const BasketOrderResponse = await axios.post(`${process.env.APIInteractiveURL}/enterprise/orders/basket`,req.body,{
                    headers: {
                    "authorization": req.headers.authorization
                    }
              })
              return res.json({status:"success",msg:BasketOrderResponse.data})
            }
        }catch(error){
            console.log(error);
            res.json({status:"success",msg:error.message})
        }
    },
}