import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema({
  name: String,
  short_name: String,
  code: String,
  address: String,
});

const School = mongoose.model("School", schoolSchema, "schools");

export default School