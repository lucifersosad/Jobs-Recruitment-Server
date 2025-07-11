import mongoose from "mongoose";

const cvSchema = new mongoose.Schema(
  {
    email: String,
    fullName: String,
    avatar: String,
    title: String,
    phone: String,
    id_file_cv: String,
    introducing_letter: String,
    dateTime: Date,
    idUser: String,
    status:String,
    idJob: String,
    employerId: String,
    countView:{
        type:Number,
        default:0
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

const Cv = mongoose.model("Cv", cvSchema, "cvs");

export default Cv;
