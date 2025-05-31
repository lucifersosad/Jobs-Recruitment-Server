import { Request, Response } from "express";

import { putObject } from "../../../../helpers/uploadToS3Aws";
import { format } from "date-fns";
import { convertToSlug } from "../../../../helpers/convertToSlug";
import { S3KeyFolder } from "../../../../config/constant";

export const uploadPdf = async (
  req: Request,
  res: Response,
  next: any
): Promise<void> => {
  if (req["files"]) {
    try {
      const user = req["user"]
      const objectFile = req["files"]["file"];

      const file = objectFile.data;
      const name = objectFile.name
      const fileExtentsion = objectFile.mimetype.split("/")[1];

      const slugFullname = convertToSlug(user?.fullName || "User")
      const timeFormat = format(new Date(), 'dd-MM-yyyy-HHmmss');

      const s3KeyFile = `cv-${slugFullname}-${timeFormat}.${fileExtentsion}`
      
      const s3Key = S3KeyFolder.RESUME + "/" + s3KeyFile;

      const { url, key } = await putObject(file, s3Key, "file");

      req.body["name"] = name
      req.body["url"] = url;
      req.body["key"] = key;
    } catch (error) {
      console.error("Error in API:", error);
    }
  }
  next();
};

export const uploadPdfReviewAi = async (
  req: Request,
  res: Response,
  next: any
): Promise<void> => {
  if (req["files"]) {
    try {
      const user = req["user"]
      const objectFile = req["files"]["file"];

      const file = objectFile.data;
      const name = objectFile.name
      const fileExtentsion = objectFile.mimetype.split("/")[1];

      const slugFullname = convertToSlug(user?.fullName || "User")
      const timeFormat = format(new Date(), 'dd-MM-yyyy-HHmmss');

      const s3KeyFile = `cv-${slugFullname}-${timeFormat}.${fileExtentsion}`
      
      const s3Key = S3KeyFolder.RESUME + "/" + s3KeyFile;

      const { url, key } = await putObject(file, s3Key, "file");
      req.body["url"] = url;
      req.body["key"] = key;
      req.body["name"] = name
    } catch (error) {
      console.error("Error in API:", error);
    }
  }
  next();
};
