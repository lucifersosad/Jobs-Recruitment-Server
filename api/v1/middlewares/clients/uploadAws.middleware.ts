import { Request, Response } from "express";

import { putObject } from "../../../../helpers/uploadToS3Aws";

export const uploadPdf = async (
  req: Request,
  res: Response,
  next: any
): Promise<void> => {
  if (req["files"]) {
    try {
      const objectFile = req["files"]["file"];

      const file = objectFile.data;
      const fileExtentsion = objectFile.mimetype.split("/")[1];

      const fileName = "my-cvs/" + "CV-" + Date.now() + `.${fileExtentsion}`;

      const { url, key } = await putObject(file, fileName, "file");
      req.body["buffer"] = objectFile.data
      req.body["url"] = url;
      req.body["key"] = key;
    } catch (error) {
      console.error("Error in API:", error);
    }
  }
  next();
};
