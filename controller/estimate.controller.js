const axios  = require("axios")

const Sebi_Stamp_Calc =(BuyingAmount,StartPrice)=>{
    const Buying_value = Math.round(BuyingAmount)
    const Divident_value =10000000/StartPrice
    if (Buying_value <=999){
        return Buying_value/Divident_value 
    }
    else if( Buying_value>999 && Buying_value<=9999){
        return Buying_value /Divident_value 
    }
    else if(Buying_value>9999 && Buying_value <=999999){
        return Buying_value /Divident_value 
    }
    else if(Buying_value>999999 && Buying_value<=9999999){
        return Buying_value /Divident_value 
    }
    else if(Buying_value>9999999 && Buying_value<999999999){
        return Buying_value /Divident_value 
    }
}

module.exports = {
    EquitySeries:async (req,res)=>{
        try{
            if(!req.headers.authorization || !req.headers.userid){
                const Msg = req.headers.userid ? res.send({'status': 'error', 'msg': 'token not found' }):res.send({'status': 'error', 'msg': 'userid not found' })
                return Msg
            }
            else{
                //seperate the conditions based on given type
                if (req.params.type==="delivery"){
                    const Amount=req.params.value
                    const Brokerage = Amount *0.10/100
                    const STT = Amount *0.10 /100
                    const Transaction_charges = Amount *0.00345/100
                    const Clearing_charges = Amount *0.002/100
                    const SEBI_charges = Sebi_Stamp_Calc(Amount,10) 
                    const Stamp_charges = req.params.stock==='buy' ? Sebi_Stamp_Calc(Amount,1500) : 0
                    const All_charges = Brokerage+STT+Transaction_charges+Clearing_charges+SEBI_charges+Stamp_charges
                    const GST = All_charges*18/100
                    const total = All_charges+GST
                    const data={
                        Brokerage,
                        STT,
                        Transaction_charges,
                        Clearing_charges,
                        SEBI_charges,
                        Stamp_charges,
                        All_charges,
                        GST,
                        total
                    }
                    return  res.json({status:"success",Message:data})
                }
                if (req.params.type==="intraday"){
                    const Amount=req.params.value
                    const Brokerage = Amount *0.01/100
                    const STT = req.params.stock==='buy' ? 0 : Amount *0.025 /100
                    const Transaction_charges = Amount *0.00345/100
                    const Clearing_charges = Amount *0.002/100
                    const SEBI_charges = Sebi_Stamp_Calc(Amount,10)
                    const Stamp_charges = req.params.stock==='buy' ? Sebi_Stamp_Calc(Amount,300) : 0
                    const All_charges = Brokerage+STT+Transaction_charges+Clearing_charges+SEBI_charges+Stamp_charges
                    const GST = All_charges*18/100
                    const total = All_charges+GST
                    const data={
                        Brokerage,
                        STT,
                        Transaction_charges,
                        Clearing_charges,
                        SEBI_charges,
                        Stamp_charges,
                        All_charges,
                        GST,
                        total
                    }
                    return res.json({status:"success",Message:data})
                }
                if (req.params.type==="futures"){
                    const Amount=req.params.value
                    const Brokerage = 0
                    const STT = req.params.stock==='buy' ? 0 :Amount *0.10 /100
                    const Transaction_charges = Amount *0.002/100
                    const Clearing_charges = Amount *0.003/100
                    const SEBI_charges = Sebi_Stamp_Calc(Amount,10) 
                    const Stamp_charges = req.params.stock==='buy' ? Sebi_Stamp_Calc(Amount,200) : 0
                    const All_charges = Brokerage+STT+Transaction_charges+Clearing_charges+SEBI_charges+Stamp_charges
                    const GST = All_charges*18/100
                    const total = All_charges+GST
                    const data={
                        Brokerage,
                        STT,
                        Transaction_charges,
                        Clearing_charges,
                        SEBI_charges,
                        Stamp_charges,
                        All_charges,
                        GST,
                        total
                    }
                    return res.json({status:"success",Message:data})
                }
                if (req.params.type==="options"){
                    const Amount=req.params.value
                    const Brokerage = 0
                    const STT = req.params.stock==='buy' ? 0 : Amount *0.05 /100
                    const Transaction_charges = Amount *0.053/100
                    const Clearing_charges = Amount *0.10/100
                    const SEBI_charges = Sebi_Stamp_Calc(Amount,10)
                    const Stamp_charges = req.params.stock==='buy' ? Sebi_Stamp_Calc(Amount,300) : 0
                    const All_charges = Brokerage+STT+Transaction_charges+Clearing_charges+SEBI_charges+Stamp_charges
                    const GST = All_charges*18/100
                    const total = All_charges+GST
                    const data={
                        Brokerage,
                        STT,
                        Transaction_charges,
                        Clearing_charges,
                        SEBI_charges,
                        Stamp_charges,
                        All_charges,
                        GST,
                        total
                    }
                    return res.json({status:"success",Message:data})
                }
        }
        }catch(error){
            return res.json({status:"400",Message:error})
        }
    },
    CurrencySeries:async (req,res)=>{
        try{
            if(!req.headers.authorization || !req.headers.userid){
                const Msg = req.headers.userid ? res.send({'status': 'error', 'msg': 'token not found' }):res.send({'status': 'error', 'msg': 'userid not found' })
                return Msg
            }else{
                if(req.params.type==="futures"){
                    const Amount=req.params.value
                    const Brokerage = 0
                    const STT = 0
                    const Transaction_charges = Amount *0.0009/100
                    const Clearing_charges = Amount *0.01/100
                    const SEBI_charges = Sebi_Stamp_Calc(Amount,10)
                    const Stamp_charges = req.params.stock==='buy' ? Sebi_Stamp_Calc(Amount,10) : 0
                    const All_charges = Brokerage+STT+Transaction_charges+Clearing_charges+SEBI_charges+Stamp_charges
                    const GST = All_charges*18/100
                    const total = All_charges+GST
                    const data={
                        Brokerage,
                        STT,
                        Transaction_charges,
                        Clearing_charges,
                        SEBI_charges,
                        Stamp_charges,
                        All_charges,
                        GST,
                        total
                    }
                    return res.json({status:"success",Message:data})
                }
                if(req.params.type==="options"){
                    const Amount=req.params.value
                    const Brokerage = 0
                    const STT = 0
                    const Transaction_charges = Amount *0.035/100
                    const Clearing_charges = Amount *0.1/100
                    const SEBI_charges = Sebi_Stamp_Calc(Amount,10)
                    const Stamp_charges = req.params.stock==='buy' ? Sebi_Stamp_Calc(Amount,10) : 0
                    const All_charges = Brokerage+STT+Transaction_charges+Clearing_charges+SEBI_charges+Stamp_charges
                    const GST = All_charges*18/100
                    const total = All_charges+GST

                    const data={
                        Brokerage,
                        STT,
                        Transaction_charges,
                        Clearing_charges,
                        SEBI_charges,
                        Stamp_charges,
                        All_charges,
                        GST,
                        total
                    }
                    return res.json({status:"success",Message:data})
                }
            }
        }catch(error){
            res.json({status:"400",Message:error})
        }
    },
    CommoditySeries:async (req,res)=>{
        try{
            if(!req.headers.authorization || !req.headers.userid){
                const Msg = req.headers.userid ? res.send({'status': 'error', 'msg': 'token not found' }):res.send({'status': 'error', 'msg': 'userid not found' })
                return Msg
            }else{
                if(req.params.type==="futures"){
                    const Amount=req.params.value
                    const Brokerage = 0
                    const STT = req.params.stock==='buy' ? 0 : Amount *0.01 /100
                    const Transaction_charges = Amount *0.0026/100
                    const Clearing_charges = Amount *0.0045/100
                    const SEBI_charges = Sebi_Stamp_Calc(Amount,10)
                    const Stamp_charges = req.params.stock==='buy' ? Sebi_Stamp_Calc(Amount,200) : 0
                    const All_charges = Brokerage+STT+Transaction_charges+Clearing_charges+SEBI_charges+Stamp_charges
                    const GST = All_charges*18/100
                    const total = All_charges+GST
                    const data={
                        Brokerage,
                        STT,
                        Transaction_charges,
                        Clearing_charges,
                        SEBI_charges,
                        Stamp_charges,
                        All_charges,
                        GST,
                        total
                    }
                    return res.json({status:"success",Message:data})
                }
                if(req.params.type==="options"){
                    const Amount=req.params.value
                    const Brokerage = 0
                    const STT = req.params.stock==='buy' ? 0 : Amount *0.05 /100
                    const Transaction_charges = Amount *0.05/100
                    const Clearing_charges = Amount *0.1/100
                    const SEBI_charges = Sebi_Stamp_Calc(Amount,10)
                    const Stamp_charges = req.params.stock==='buy' ? Sebi_Stamp_Calc(Amount,300) : 0
                    const All_charges = Brokerage+STT+Transaction_charges+Clearing_charges+SEBI_charges+Stamp_charges
                    const GST = All_charges*18/100
                    const total = All_charges+GST
                    const data={
                        Brokerage,
                        STT,
                        Transaction_charges,
                        Clearing_charges,
                        SEBI_charges,
                        Stamp_charges,
                        All_charges,
                        GST,
                        total
                    }
                    return res.json({status:"success",Message:data})
                }
            }
        }catch(error){
            res.json({status:"400",Message:error})
        }
    },
    CalculateBrokerage:async (req,res)=>{
        try{
            if(!req.headers.authorization ){
                return res.send({'status': 'error', 'msg': 'token not found' })
            }else{ 
                const BrokerageResponse = await axios.post(`${process.env.APIInteractiveURL}/enterprise/user/calculatebrokerage`,req.body,{
                    headers: {
                      "authorization": req.headers.authorization
                    }
                  })
                return res.json({status:"success",Message:BrokerageResponse.data})
            }
        }
        catch(error){
            console.log("error",error);
            return res.status(500).json({status:"error",Message:error})
        }
    },
}
