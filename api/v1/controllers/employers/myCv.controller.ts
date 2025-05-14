import { Request, Response } from "express";
import MyCv from "../../../../models/my-cvs.model";
import axios from "axios";
import { hideDataProfileInCvPdf } from "../../../../helpers/pdfCV";
import Employer from "../../../../models/employers.model";

// [POST] /api/v1/client/my-cvs:/id/file
export const getMyCvFile = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId: string = req["user"]?._id;
    const { id } = req.params;
    
    console.log("🚀 ~ id:", id)

    const cv = await MyCv.findById(id);

    if (!cv || !cv.linkFile) {
      res.status(404).json({ message: 'CV not found or missing S3 URL' });
      return;
    }

    // Tải file từ S3
    const response = await axios.get(cv.linkFile, {
      responseType: 'arraybuffer', // để lấy dạng binary
    });

    const cvBuffer = Buffer.from(response.data);
    
    const hideProfileCvBuffer = await hideDataProfileInCvPdf(cvBuffer);

    const isOpenedUser = await Employer.exists({_id: userId, "listApprovedUsers.idUser": cv?.idUser})

    const base64Data = cvBuffer.toString("base64");
    const hidebase64Data = hideProfileCvBuffer.toString("base64");

    const cvBase64 = isOpenedUser ? cvBuffer.toString("base64") : hideProfileCvBuffer.toString("base64");

    res.json({
      code: 200,
      data: cvBase64,
    });

  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};