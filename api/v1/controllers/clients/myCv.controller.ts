import { Request, Response } from "express";

import MyCv from "../../../../models/my-cvs.model";
import mongoose from "mongoose";
import { getCvPdfBuffer } from "../../../../helpers/downloadCV";
import { getFileBase64, getSignedDownloadUrl, putObject } from "../../../../helpers/uploadToS3Aws";
import { convertToSlug } from "../../../../helpers/convertToSlug";
import { callRapidApi } from "../../../../helpers/parseCV";
import axios from "axios";
import { hideDataProfileInCvPdf } from "../../../../helpers/pdfCV";
import { S3_CORE } from "../../../../config/constant";

// [GET] /api/v1/client/my-cvs/
export const getMyCvs = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const idUser = req["user"]._id
    const cvs = await MyCv.find({
      idUser
    }).select("linkFile nameFile")

    if (cvs) {
      res.status(200).json({ code: 200, data: cvs });
    } else {
      res.status(404).json({ code: 404, error: "Không tìm thấy cv" });
    }

  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [GET] /api/v1/client/my-cvs:/id
export const getMyCv = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id: string = req.params.id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ code: 404, error: "Id CV không hợp lệ" });
      return;
    }

    const cv = await MyCv.findById(id).lean()

    if (cv) {
      res.status(200).json({ code: 200, data: cv });
    } else {
      res.status(404).json({ code: 404, error: "Không tìm thấy cv" });
    }

  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/client/my-cvs:/id/file
export const getMyCvFile = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const cv = await MyCv.findById(id);

    if (!cv || !cv.linkFile) {
      res.status(404).json({ message: 'CV not found or missing S3 URL' });
      return;
    }

    const s3Key = cv.linkFile.replace(`${S3_CORE}/`, "")

    const base64Data = await getFileBase64(s3Key)

    // // Tải file từ S3
    // const response = await axios.get(cv.linkFile, {
    //   responseType: 'arraybuffer', // để lấy dạng binary
    // });

    // const cvBuffer = Buffer.from(response.data);
    
    // const newCvBuffer = await hideDataProfileInCvPdf(cvBuffer);

    // const base64Data = cvBuffer.toString("base64");

    res.json({
      code: 200,
      data: base64Data,
      s3Key
    });


    return;

    // Thiết lập header phản hồi là PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${cv.nameFile || 'file-cv.pdf'}"`);

    // const cvBuffer = Buffer.from(response.data)

    // const newCvBuffer = await hideDataProfileInCvPdf(cvBuffer)
    
    // Trả file PDF dưới dạng blob (buffer)
    // res.send(cvBuffer);
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/clients/my-cvs
export const createMyCv = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Lấy thông tin người dùng từ request
    const user = req["user"];

    const newCv = {
      ...req.body,
      isUser: user.id,
    }
    
    const cv = new MyCv(newCv);
    await cv.save()

    res
      .status(200)
      .json({ code: 200, success: `Tạo CV Thành Công`, data: cv });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [GET] /api/v1/client/my-cvs:/id/download
export const downloadMyCv = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id: string = req.params.id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ code: 404, error: "Id CV không hợp lệ" });
      return;
    }

    const cv = await MyCv.findById(id)

    if (!cv) {
      res.status(404).json({ code: 404, error: "Không tìm thấy cv" });
      return;
    }

    const pdfBuffer = await getCvPdfBuffer(id);

    if (!pdfBuffer) {
      res.status(500).json({ code: 500, error: "Không tạo được file PDF" });
      return;
    }

    const s3Key = `my-cvs/cv-${id}.pdf`
    const fileNameDownload = `cv-${convertToSlug(cv.fullName)}-utem.vn-${Date.now().toString()}`

    const result = await putObject(pdfBuffer, s3Key, "file");
    console.log("🚀 ~ result:", result)

    const signedUrl = await getSignedDownloadUrl(s3Key, fileNameDownload);

    if (!signedUrl) {
      res.status(500).json({ error: "Không tạo được signed URL" });
      return;
    }

    res.json({ code: 200, data: signedUrl });

  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [GET] /api/v1/client/my-cvs/extract
export const extractCv = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const url = req.body.url;
    const dataExtract = await callRapidApi(url)
    res.json({ code: 200, data: dataExtract });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};