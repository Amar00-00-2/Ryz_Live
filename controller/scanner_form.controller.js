const moment =require('moment');
const { scannerformModel } = require('../model');
module.exports={
    ScannerFormAdd:async(req,res)=>{
        try{
            const {category_id,result}=req.body;
            if(!category_id){
                res.json({status:"error",message:"Category is not found"}) 
            }else{
                var response = []
                const deleteData = await scannerformModel.destroy({where:{category_id}})
                const MappingArray= await Promise.all(result.map(async(data)=>{
                    const scannerformdata=await scannerformModel.create({
                        category_id:category_id,
                        exchangeSegment:data.ExchangeSegment,
                        exchangeInstrumentID:data.ExchangeInstrumentID,
                        name:data.CompanyName,
                    })
                    response.push(scannerformdata)
                }))
                return res.json({status:"success",message:response})
            }
        }catch(error) { 
            console.log(error.message);
            return res.json({ status: "error", message: error.message })
        }
    },
    ScannerFormEditView: async (req, res) => {
        try {
            const instruments = await scannerformModel.findAll({attributes:['exchange_instrumentid','exchange_segment','name'],where:{category_id:scannerCategory.category_id}})
            scannerCategory.dataValues.instruments=instruments
            return res.json({status:"success",message:scannerCategory })
        }catch (error){
            console.log(error);
            return res.json({status:'error', error:error.message})
        }
    },
    ScannerDelete: async (req, res) => {
        try{
            const deletedata = await scannerformModel.destroy({where:{scanner_id:req.params.scannerid}})
            console.log(deletedata)
            if(deletedata){
                return res.json({status:"success",message:"delete successfully"})
            } else{
                return res.json({status:"success",message:"no data found"})
            }
        }
        catch (error) {
          res.json({status:'error', error:error.message})
        }
    },
    ScannerActiveInactive: async (req, res) => {
        try {
            const Activedata=await scannerformModel.findAll({
                    attributes:['scanner_id','exchangeSegment','exchangeInstrumentID', 'name'],
                    where:{category_id:req.params.id},
                    raw:true
                })
            return res.json({status:"success",message:Activedata})
        }
        catch (error) {
          return res.json({status:'error', error:error.message})
        }
    },
}