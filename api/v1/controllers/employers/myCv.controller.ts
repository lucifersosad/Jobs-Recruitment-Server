import { Request, Response } from "express";
import MyCv from "../../../../models/my-cvs.model";
import axios from "axios";
import { hideDataProfileInCvPdf } from "../../../../helpers/pdfCV";
import Employer from "../../../../models/employers.model";
import { evaluate } from "../../../../helpers/openAI";

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

// [POST] /api/v1/client/my-cvs/evaluate
export const evaluateMyCv = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId: string = req["user"]?._id;

    const id1 = "68205edf43d3081ba45aa57c"
    const id2 = "68220bdb681c2bdba50d936a"
    const id3 = "68296546ae46c77e88a9fa0b"

    const cv1 = await MyCv.findById(id1);
    const cv2 = await MyCv.findById(id2);
    const cv3 = await MyCv.findById(id3);

    // if (!cv || !cv.linkFile) {
    //   res.status(404).json({ message: 'Không tìm thấy CV' });
    //   return;
    // }

    // Tải file từ S3
    const response1 = await axios.get(cv1.linkFile, {
      responseType: 'arraybuffer', // để lấy dạng binary
    });
    const response2 = await axios.get(cv2.linkFile, {
      responseType: 'arraybuffer', // để lấy dạng binary
    });
    const response3 = await axios.get(cv3.linkFile, {
      responseType: 'arraybuffer', // để lấy dạng binary
    });

    const cvBuffer1 = Buffer.from(response1.data);
    const cvBuffer2 = Buffer.from(response2.data);
    const cvBuffer3 = Buffer.from(response3.data);

    const base64String1 = cvBuffer1.toString("base64");
    const base64String2 = cvBuffer2.toString("base64");
    const base64String3 = cvBuffer3.toString("base64");

    const myCVs = [
      {
        type: "input_text",
        text: `CV ID: ${id1}`
      
      },
      {
        type: "input_file",
        filename: "CV.pdf",
        file_data: `data:application/pdf;base64,${base64String1}`
      },
      {
        type: "input_text",
        text: `CV ID: ${id2}`
      
      },
      {
        type: "input_file",
        filename: "CV.pdf",
        file_data: `data:application/pdf;base64,${base64String2}`
      },
      {
        type: "input_text",
        text: `CV ID: ${id3}`
      
      },
      {
        type: "input_file",
        filename: "CV.pdf",
        file_data: `data:application/pdf;base64,${base64String3}`
      },
    ]

    const evaluatedMyCVs = await evaluate("", myCVs)
    
    res.json({
      code: 200,
      data: evaluatedMyCVs,
    });

  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};