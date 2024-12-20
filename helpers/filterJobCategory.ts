import mongoose from "mongoose";
import JobCategories from "../models/jobCategories.model";

const filterJobCategory = async (idCategory) => {
  // Kiểm tra tính hợp lệ của mỗi id trong idCategory
  for (const item of idCategory) {
    if (!mongoose.Types.ObjectId.isValid(item)) {
      return false; // Trả về false ngay khi có id không hợp lệ
    }
  }

  // Kiểm tra xem tất cả các category có tồn tại và không bị xóa hoặc bị inactive không
  for (const item of idCategory) {
    const find = {
      _id: item,
      deleted: false,
      status: "active",
    };
    const category = await JobCategories.findOne(find);

    if (category === null) {
      return false; // Trả về false ngay khi không tìm thấy category hợp lệ
    }
  }

  return true; // Trả về true khi tất cả đều hợp lệ
};

export default filterJobCategory;
