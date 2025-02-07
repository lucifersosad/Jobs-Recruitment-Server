import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    password: String,
    dateOfBirth: Date,
    address: {
      city: String,
      district: String,
    },
    description: {
      type: String,
      default:
        "Kết nối với hàng nghìn cơ hội việc làm và ứng viên tài năng trên UTEM - một nền tảng đổi mới dành cho người tìm kiếm công việc và nhà tuyển dụng. Với UTEM, bạn sẽ khám phá ra một thế giới mới của cơ hội nghề nghiệp và kết nối với cộng đồng chuyên nghiệp. Hãy bắt đầu hành trình của bạn ngay hôm nay và tạo ra một hồ sơ độc đáo để nổi bật giữa đám đông.",
    },

    workAddress: Array,
    phone: String,
    educationalLevel: String,
    schoolName: String,
    foreignLanguage: String,
    yearsOfExperience: String,
    companyName: String,
    desiredSalary: String,
    jobTitle: String,
    avatar: {
      type: String,
      default:
        "https://s3.thegioiyeuthuong.vn/demo/avatar/CdCGQpFfFo_1726590229622.png",
    },
    cv: [
      {
        idFile: String,
        nameFile: String,
      },
    ],
    skill_id: Array,
    job_categorie_id: String,
    job_position: Array,
    gender: Number,
    image: String,
    token: String,
    emailSuggestions: Array,
    listJobSave: [
      {
        idJob: String,
        createdAt:Date,
      },
    ],
    statusOnline: {
      type: Boolean,
      default: false,
    },
    activeJobSearch: {
      type: Boolean,
      default: false,
    },
    allowSearch: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      default: "active",
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      account_id: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    deletedBy: {
      account_id: String,
      deletedAt: Date,
    },
    updatedBy: [
      {
        account_id: String,
        updatedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema, "users");

export default User;
