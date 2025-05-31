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
import Evaluation from "../../../../models/evaluation.model";
import { decode } from "html-entities";
import sanitizeHtml from 'sanitize-html';
import { promptJob } from "../../../../helpers/prompt";
import axios from "axios";
import { evaluate } from "../../../../helpers/openAI";
import mongoose from "mongoose";
import { POPULATE } from "../../interfaces/populate.interface";
import Employer from "../../../../models/employers.model";

// [GET] /api/v1/clients/ai-review/:id
export const getEvaluation = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const idUser: string = req["user"]._id;
    const { fullName, avatar = "", email } = req["user"]

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ code: 400, error: "Id không hợp lệ" });
      return;
    }

    const populate: POPULATE[] = [
      {
        path: "idJob",
        select: "title salaryMin salaryMax employerId slug",
        model: Job,
        populate: [
          {
          path: "employerId",
          select: "companyName logoCompany",
          model: Employer,
          }
        ]
      }
    ]

    const evaluation = await Evaluation.findOne({
      _id: id,
      idUser,
      deleted: false
    }).populate(populate).lean()

    if (!evaluation) {
      res.status(400).json({ code: 400, error: "Không tìm thấy đánh giá CV" });
      return;
    }

    const data = {
      ...evaluation,
      fullName,
      avatar,
      email
    }

    res
      .status(200)
      .json({ code: 200, success: `Thành công`, data });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/clients/ai-review
export const evaluateCV = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const _id: string = req["user"]._id;
    const idJob = req.body.idJob
    const linkFile = req.body.url || req.body.linkFile
    const nameFile = req.body.name || req.body.nameFile

    // res
    //   .status(200)
    //   .json({ code: 200, success: `Thành công`, linkFile, nameFile});

    // return

    const job = await Job.findById(idJob).select("title city.name description detailWorkExperience skills listTagName presentationLanguage gender ageMin ageMax workExperience level educationalLevel").lean();

    const jdText = promptJob(job)

    const response = await axios.get(linkFile, {
      responseType: 'arraybuffer',
    });

    const cvBuffer = Buffer.from(response.data);

    const base64String = cvBuffer.toString("base64");

    const fileCv = {
      file_data: `data:application/pdf;base64,${base64String}`,
      filename: nameFile
    }

    const openAiEvaluation = await evaluate(jdText, fileCv)

    const { overview, evaluation } = openAiEvaluation

    const newEvaluation = {
      idUser: _id,
      idJob,
      linkFile,
      nameFile,
      overview,
      ...evaluation
    }

    const record = new Evaluation(newEvaluation)
    await record.save()

    res
      .status(200)
      .json({ code: 200, success: `Thành công`, data: record._id });
  } catch (error) {
    console.error("Error in API:", error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ code: 400, error: error.message });
      return;
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/clients/ai-review
export const checkEvaluateCV = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const idUser: string = req["user"]._id;
    const idJob = req.body.idJob

    const evaluation = await Evaluation.findOne({
      idUser,
      idJob
    })

    const data = {
      status: false,
      id: ""
    }

    if (evaluation) {
      data.status = true,
      data.id = evaluation._id.toString()
    }

    res
      .status(200)
      .json({ code: 200, success: `Thành công`, data });
  } catch (error) {
    console.error("Error in API:", error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ code: 400, error: error.message });
      return;
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

