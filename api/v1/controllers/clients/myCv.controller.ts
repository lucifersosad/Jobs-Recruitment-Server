import { Request, Response } from "express";

import MyCv from "../../../../models/my-cvs.model";
import mongoose from "mongoose";
import { getCvPdfBuffer } from "../../../../helpers/downloadCV";
import { getFileBase64, getSignedDownloadUrl, putObject } from "../../../../helpers/uploadToS3Aws";
import { convertToSlug } from "../../../../helpers/convertToSlug";
import { callRapidApi } from "../../../../helpers/parseCV";
import axios from "axios";
import { getPdfTextContent, hideDataProfileInCvPdf } from "../../../../helpers/pdfCV";
import { S3_CORE } from "../../../../config/constant";
import { getCvSummary, getEmbedding, suggestBuildCv } from "../../../../helpers/openAI";
import User from "../../../../models/user.model";

// [GET] /api/v1/client/my-cvs/
export const getMyCvs = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const idUser = req["user"]._id
    const cvs = await MyCv.find({
      idUser,
      deleted: false,
      linkFile: { $exists: true }
    }).select("linkFile nameFile is_primary")

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

    const cv = await MyCv.findOne({_id: id, deleted: false}).lean()

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

    const cv = await MyCv.findOne({_id: id, deleted: false});

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

// [POST] /api/v1/client/my-cvs/upload
export const uploadMyCv = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const idUser = req["user"]._id
    const url = req.body.url;
    const name = req.body.name;
    const key = req.body.key;

    const myCv = {
      linkFile: url,
      idUser,
      nameFile: name,
    }

    const record = new MyCv(myCv);
    await record.save();

    res.json({ code: 200, success: "Upload thành công", data: record });
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
      idUser: user._id,
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

// [PATCH] /api/v1/clients/my-cvs/edit
export const editMyCv = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = req["user"];
    let id = req.body.idCv
    let newNameCv = req.body.newNameCv;
    let deleted = req.body.is_deleted

    let is_primary = false;

    if (req.body.is_primary === true) {
      is_primary = true
      await MyCv.updateMany(
        {
          _id: { $ne: id },
          idUser: user._id
        },
        {
          $set: { is_primary: false },
        }
      )
      const cv = await MyCv.findById(id)

      const response = await axios.get(cv.linkFile, {
        responseType: 'arraybuffer', // để lấy dạng binary
      });
      const cvBuffer = Buffer.from(response.data);

      const cvText = await getPdfTextContent(cvBuffer)

      const cvSummary = await getCvSummary(cvText)

      const embedding = await getEmbedding(cvSummary)

      await User.updateOne({_id: cv.idUser}, { $set: { embedding, brief_embedding: cvSummary } })
    }

    if (deleted === true) {
      await MyCv.updateOne(
        {
          _id: id,
          idUser: user._id,
        },
        {
          $set: { deleted },
        } 
      );
      res.status(200).json({ code: 200, success: "Xóa CV thành công" })
      return;
    }

    if (!newNameCv.toLowerCase().endsWith('.pdf')) {
      newNameCv = newNameCv + ".pdf"
    }

    await MyCv.updateOne(
      {
        _id: id,
        idUser: user._id,
      },
      {
        $set: { nameFile: newNameCv, is_primary },
      }
    );

    res.status(200).json({ code: 200, success: "Cập nhật CV thành công" });
  } catch (error) {
    // Ghi lỗi vào console nếu có lỗi xảy ra
    console.error("Error in API:", error);

    // Trả về lỗi 500 nếu có lỗi xảy ra
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/clients/my-cvs/suggest-builder
export const suggestBuildMyCv = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = req["user"];
    let description = req.body.description?.trim()

    if (!description) {
      res
        .status(400)
        .json({ error: "Vui Lòng Nhập Mô Tả!", code: 400 });
      return;
    }

    const data = await suggestBuildCv(description)

    res.status(200).json({ code: 200, success: "Thành công", data });
  } catch (error) {
    // Ghi lỗi vào console nếu có lỗi xảy ra
    console.error("Error in API:", error);

    // Trả về lỗi 500 nếu có lỗi xảy ra
    res.status(500).json({ error: "Internal Server Error" });
  }
};