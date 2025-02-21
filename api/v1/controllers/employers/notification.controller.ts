import { Request, Response } from "express";
import * as NotificationInterface from "../../interfaces/notification.interface";
import Notification from "../../../../models/notifications.model";

// [GET] /api/v1/employers/notifications
export const index = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const find: NotificationInterface.Find = {
      deleted: false,
      employerId: req["user"]._id,
    };

    let records = [];

    records = await Notification.find(find);

    //Trả về công việc đó.
    res.status(200).json({ data: records, code: 200 });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
