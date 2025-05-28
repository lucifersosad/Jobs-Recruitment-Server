import {
  generateRandomNumber,
  generateRandomString,
} from "../../../../helpers/generateString";
import { Request, Response } from "express";
import md5 from "md5";
import User from "../../../../models/user.model";
import { InfoUser } from "../../interfaces/user.interface";
import ForgotPassword from "../../../../models/forgot-password.model";
import { sendMail } from "../../../../helpers/sendMail";
import Job from "../../../../models/jobs.model";
import Cv from "../../../../models/cvs.model";
import {
  createAndSendNotification,
  ENUM_NOTIFICATION_DETAIL_TYPE,
  ENUM_NOTIFICATION_TYPE,
} from "../../../../helpers/notification";
import { putObject } from "../../../../helpers/uploadToS3Aws";
import { callRapidApi } from "../../../../helpers/parseCV";
import MyCv from "../../../../models/my-cvs.model";

// [POST] /api/v1/clients/ai-review
export const evaluateCV = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const _id: string = req["user"]._id;

    await User.updateOne(
      {
        _id,
      },
      {
        skills: req.body
      }
    );

    res
      .status(200)
      .json({ code: 200, success: `Đã Lưu Kĩ Năng` });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};