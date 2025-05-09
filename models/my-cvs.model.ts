import mongoose from "mongoose";
var slug = require("mongoose-slug-updater");

mongoose.plugin(slug);

const myCvSchema = new mongoose.Schema(
  {
    idUser: String,
    idFile: String,
    nameFile: String,
    s3Key: String,
    fullName: String,
    email: String,
    phone: String,
    address: String,
    position: String,
    objective: String,
    experiences: [
      {
        position_name: String,
        company_name: String,
        start_date: String,
        end_date: String,
        description: String,
      }
    ],
    educations: [
      {
          title: String,
          school_name: String,
          start_date: String,
          end_date: String,
          description: String,
      }
    ],
    skills: [
      {
        skill_name: String,
        description: String,
      },
    ],
    awards: [
      {
        date: String,
        title: String,
      },
    ],
    certifications: [
      {
        date: String,
        title: String,
      },
    ],
    activities: [
      {
        position_name: String,
        group_name: String,
        start_date: String,
        end_date: String,
        description: String,
      }
    ],
    status: {
      type: String,
      default: "active",
    },
    deleted: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

const MyCv = mongoose.model("MyCv", myCvSchema, "my-cvs");

export default MyCv;
