require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const CV = require("./models/my-cvs.model.ts"); // đường dẫn tới model

const generateCVJson = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    const cvs = await CV.find(); // lấy tất cả CV từ DB

    for (const cv of cvs) {
      const fileName = cv._id.toString() + ".json";
      const filePath = path.join(__dirname, "cv-exports", fileName);

      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      fs.writeFileSync(filePath, JSON.stringify(cv.toObject(), null, 2), "utf-8");

      console.log("✅ Đã tạo file:", filePath);
    }

    await mongoose.disconnect();
    console.log("✅ Đã ngắt kết nối MongoDB");
  } catch (err) {
    console.error("❌ Lỗi khi tạo CV JSON:", err);
  }
};

generateCVJson();
