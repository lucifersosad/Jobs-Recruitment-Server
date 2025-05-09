import { Request, Response } from "express";
import * as SchoolInterface from "../../interfaces/school.interface";
import School from "../../../../models/school.model";
import { convertToSlug } from "../../../../helpers/convertToSlug";

// [GET] /api/v1/schools
export const index = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const find: SchoolInterface.Find = {};

    let queryLimit: number = 20;
    
    if(req.query.keyword){
      const { keyword } = req.query
      const alias = convertToSlug(keyword.toString())
      console.log("🚀 ~ alias:", alias)
      find.$or = [
        { alias: { $regex: alias, $options: "i" } },
        { short_name: { $regex: keyword, $options: "i" } },
        { code: { $regex: keyword, $options: "i" } }
      ];
    }

    const records = await School.find(find).limit(queryLimit);

    res.status(200).json({ success: "Truy Vấn Thành Công", code: 200, data: records });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};