import mongoose from "mongoose";
import JobCategories from "../models/jobCategories.model";

const filterJobCategory = async (idCategory) => {

  if (!mongoose.Types.ObjectId.isValid(idCategory)) {
    return false;
  }

  const find = {
    _id: idCategory,
    deleted: false,
    status: "active",
  };

  const category = await JobCategories.findOne(find);

  if (category === null) {
    return false;
  }
  return true;
};
export default filterJobCategory;
