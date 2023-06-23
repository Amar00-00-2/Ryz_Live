const { categoryModel, scannerformModel } = require('../model')

module.exports={
    CategoryAdd:async(req,res)=>{
        try{
            const {category_name,Userid, category_type}=req.body
            const validateCategory = await categoryModel.count({where:{category_name,category_type}})
            if(validateCategory){
                return res.json({ status: "success", message: "already exist" })
            }else{
                const date = new Date()
                const addcategorydata = await categoryModel.create({
                    category_type,
                    category_name,
                });
                return res.json({ status: "success", message: addcategorydata })
            }
        }catch(error) {
            console.log(error);
            return res.json({ status: "error", message: "something went wrong!" })
        }
    },
    CategoryEditUpdate:async(req,res)=>{
        try{
            const {category_name, category_type}=req.body
            const {category_id} = req.params
            const validateCategory = await categoryModel.count({where:{category_name,category_type}})
            if(validateCategory){
                return res.json({ status: "success", message: "already exist" })
            }else{
                const count = await categoryModel.count({where:{category_id}})
                if(count){
                    const updatecategorydata = await categoryModel.update({
                        category_name,
                    },
                    {
                        where:{
                            category_id
                        }
                    });
                    return res.json({ status: "success", Message: "Updated Successfully" })
                }else{
                    return res.json({ status: "error", Message: "No data found!!" })  
                }
            }
        }catch(error) {
            console.log(error);
            return res.json({ status: "error", Message: "something went wrong!" })
        }
    },
    CategoryList:async(req,res)=>{
        try{
            const activelistcategory = await categoryModel.findAll({attributes:['category_id','category_name'],where:{category_type:req.params.id}})
            if(activelistcategory){
                return res.json({ status:"success",Message: activelistcategory })
            }else{
                return res.json({ status:"success",Message: "no data found" })
            }
        }catch(error) {
            console.log(error);
            return res.json({ status: "error", Message: "something went wrong!" })
        }
    },
    CategoryDelete:async(req,res)=>{
        try{
            const Deletecategory = await categoryModel.destroy({
                where:{
                    category_id:req.params.id
                }
            })
            if(Deletecategory){
                const deletedata = await scannerformModel.destroy({where:{category_id:req.params.id}})
                return res.json({ status:"success",Message: "category deleted successfully" })
            } else{
                return res.json({ status:"success",Message: "no data found" })
            }
        }catch(error) {
            console.log(error);
            return res.json({ status:"error", Message: "something went wrong!" })
        }
    },
}