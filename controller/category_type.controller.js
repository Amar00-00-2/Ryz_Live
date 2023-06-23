const { categoryTypeModel } = require('../model');
module.exports={
    CategoryTypeAdd: async (req, res) => {
        try {
            const body = req.body.type_name.split(',')
            const Insertdata = await body.map(async(data)=>{
                const Response = await categoryTypeModel.create({
                    type_name:data
                })
            })
            return res.json({status:"success",message:"Category Inserted.."})
        }
        catch (error) {
          return res.json({status:'error', error:error.message})
        }
    },
    CategoryTypeList: async (req, res) => {
        try {
            const list=await categoryTypeModel.findAll({})
            return res.json({status:"success",message:list})
        }
        catch (error) {
          return res.json({status:'error', error:error.message})
        }
    },
}
