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
    level: String,
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
    notification_token: {
      type: Array
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
    yoe: {
      type: Number, 
      default: 0,
    },
    //profile
    educations: [
      {
        school_id: String,
        school_logo: String,
        school_name: String,
        start_month: String,
        start_year: String,
        end_month: String,
        end_year: String,
        title: String,
        description: String,
      }
    ],
    experiences: [
      {
        company_name: String,
        start_month: String,
        start_year: String,
        end_month: String,
        end_year: String,
        position_name: String,
        description: String,
        attachments: []
      }
    ],
    skills: [
      {
        skill_id: String,
        title: String,
        image: String,
        rate: String,
        description: String,
      }
    ],
    embedding: {
      type: [Number],
    },
    brief_embedding: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema, "users");

export default User;
