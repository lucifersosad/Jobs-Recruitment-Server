require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const slug = require("slug");

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

const School = mongoose.model("School", SchoolSchema);

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

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

seedData();
