import mongoose from "mongoose";
import JobCategories from "../models/jobCategories.model";

const filterJobCategory = async (idCategory) => {
  if (!Array.isArray(idCategory) || idCategory.length !== 2) {
    return false;
  }

  // Validate ObjectId
  for (const id of idCategory) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }
  }

  const [parent, child] = await Promise.all([
    JobCategories.findOne({ _id: idCategory[0], deleted: false, status: "active" }),
    JobCategories.findOne({ _id: idCategory[1], deleted: false, status: "active" }),
  ]);


  if (!parent || !child) {
    return false;
  }

  if (child.parent_id?.toString() !== parent._id.toString()) {
    return false;
  }

  return true;
};


export default filterJobCategory;
