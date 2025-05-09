import mongoose from "mongoose";
import Role from "../models/roles.model";

const filterRole = async (roleId) => {
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    return false;
  }

  const find = {
    _id: roleId,
    deleted: false,
    status: "active",
  };
  const role = await Role.findOne(find);

  if (role === null) {
    return false;
  }

  return true;
};

export default filterRole;
