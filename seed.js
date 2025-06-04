require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const slug = require("slug");
const axios = require("axios")

slug.charmap['+'] = '+';
slug.charmap['#'] = '#';

const jobCategoriesResponse = require("./job-categories.json");

const jobCategoriesSchema = new mongoose.Schema(
  {
    title: String,
    parent_id: String,
    position: { type: Number, default: -1 },
    thumbnail: {
      type: String,
      default:
        "https://res.cloudinary.com/dmmz10szo/image/upload/v1703728915/vgmvvcn0te8lhdrbued1.webp",
    },
    description: String,
    deletedAt: Date,
    deleted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: "active",
    },
    slug: {
      type: String,
      slug: "title",
      unique: true,
    },
    keyword: {
      type: String,
      slug: "title",
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);


const SchoolSchema = new mongoose.Schema({
  name: String,
  short_name: String,
  code: String,
  address: String,
  alias: {
    type: String,
    slug: "name",
    unique: true,
  },
});

const SkillSchema = new mongoose.Schema({
  title: String,
  alias: {
    type: String,
  },
});

const School = mongoose.model("School", SchoolSchema);
const Skill = mongoose.model("Skill", SkillSchema, "skills");

const seedSchool = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    const filePath = path.join(__dirname, "static_data", "universities.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Chuyển đổi dữ liệu trước khi insert
    const schools = data.map((school) => ({
      ...school,
      alias: slug(school.name, { lower: true }), // Tạo slug từ name
    }));

    await School.deleteMany(); // Xóa dữ liệu cũ
    await School.insertMany(schools); // Thêm dữ liệu mới

    console.log("Seed dữ liệu thành công!");
    process.exit();
  } catch (error) {
    console.error("Lỗi khi seed dữ liệu:", error);
    process.exit(1);
  }
};

const seedSkill = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    // Gọi API bên thứ ba để lấy dữ liệu
    const response = await axios.get("https://ms.vietnamworks.com/skill-tags/api/v1/skills/suggestion?query=%20&limit=100000"); // thay bằng URL thật
    const data = response.data.data;

    // Chuyển đổi dữ liệu trước khi insert
    const skills = data.map((skill) => ({
      title: skill.name,
      alias: slug(skill.name, { lower: true, remove: null }), // Tạo slug từ name
    }));

    // await School.deleteMany();
    await Skill.insertMany(skills); // Thêm dữ liệu mới

    console.log("Seed dữ liệu thành công!");
    process.exit();
  } catch (error) {
    console.error("Lỗi khi seed dữ liệu:", error);
    process.exit(1);
  }
};

const seedDataJobCategory = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    const { data, included } = jobCategoriesResponse;

    // 1. Insert parent categories
    const parentDocs = await JobCategory.insertMany(
      data.map((item) => ({
        title: item.attributes?.nameVi,
        parent_id: "", // Cha không có parent
        slug: slug(item.attributes?.nameVi.replaceAll("/", " "), {
          lower: true,
        }),
        keyword: slug(item.attributes?.nameVi.replaceAll("/", " "), {
          lower: true,
        }),
      }))
    );

    // Tạo map id để tra cứu
    const parentIdMap = {};
    data.forEach((item, index) => {
      parentIdMap[item.id] = parentDocs[index]._id;
    });

    // 2. Chuẩn bị và insert child categories
    const childDocs = included.map((child, index) => {
      let matchedParentId = "";

      // Tìm parent từ data
      for (const parent of data) {
        const children = parent.relationships?.jobFunction?.data || [];
        if (children.find((c) => c.id === child.id)) {
          matchedParentId = parentIdMap[parent.id]; // Dùng _id thực
          break;
        }
      }

      const title = child.attributes?.nameVi;
      const slugified = slug(title.replaceAll("/", " "), { lower: true });

      return {
        title,
        parent_id: matchedParentId,
        position: index + 18,
        slug: slugified,
        keyword: slugified,
      };
    });

    await JobCategory.insertMany(childDocs);

    console.log("Seed dữ liệu thành công!");
    process.exit();
  } catch (error) {
    console.error("Lỗi khi seed dữ liệu:", error);
    process.exit(1);
  }
};

seedSkill();
