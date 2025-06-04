import { Request, Response } from "express";
import * as SkillInterface from "../../interfaces/skill.interface";
import Skill from "../../../../models/skills.model";
import { encryptedData } from "../../../../helpers/encryptedData";
import skills from '../../../../static_data/skill.json';
import { convertToSlug } from "../../../../helpers/convertToSlug";

// [GET] /api/v1/client/skill/index/
export const index = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const find: SkillInterface.Find = {};
    const limit = 20

    const keyword = req.query.keyword?.toString();

    if (!keyword || keyword.trim() === '') {
      res.status(400).json({ error: "Thiếu keyword", code: 400 });
      return;
    }

    const alias = convertToSlug(keyword)

    const aggregate: any = [
  {
    $match: {
      alias: { $regex: alias, $options: 'i' }
    }
  },
  {
    $addFields: {
      priority: {
        $cond: [
          { $eq: ["$alias", alias] }, 0
          ,
          {
            $cond: [
              { $regexMatch: { input: "$alias", regex: `^${alias}`, options: "i" } }, 1,
              2
            ]
          }
          // { $regexMatch: { input: "$title", regex: new RegExp("^" + alias, "i") } }, 0, 1
        ]
      }
    }
  },
  {
    $sort: {
      priority: 1,      // Ưu tiên alias bắt đầu bằng keyword
      title: 1          // Sắp xếp tiếp theo theo title (A-Z)
    }
  },
  {
    $limit: limit
  }
]
    find.alias = { $regex: alias, $options: "i" };

    const skills = await Skill.aggregate(aggregate).limit(limit);

    res.status(200).json({ data: skills, code: 200 });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
