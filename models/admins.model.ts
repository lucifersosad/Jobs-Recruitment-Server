import mongoose from "mongoose";


const employerSchema = new mongoose.Schema(
    {
        fullName: String,
        email:String,
        password:String,
        token:String,
        phoneNumber:String,
        address: String,
        gender:String,
        avatar:{
            type:String,
            default:"https://cdn-icons-png.flaticon.com/512/9703/9703596.png"
        },
        role_id:String,
        status: {
            type:String,
            default:"active"
        },
        createdBy: {
            account_id: String,
            createdAt: {
                type: Date,
                default: Date.now
            }
        },
        deleted: {
            type:Boolean,
            default: false
        },
        deletedBy: {
            account_id: String,
            deletedAt: Date
        },
        updatedBy: [
            {
              account_id: String,
              email: String,
              updatedAt: Date
            }
          ],
    },
    {
        timestamps:true
    }
);


const Admin = mongoose.model("Admin", employerSchema, "admins");

export default Admin