import { Request, Response } from "express";
import * as NotificationInterface from "../../interfaces/notification.interface";
import Notification from "../../../../models/notifications.model";
import { filterQueryPagination } from "../../../../helpers/filterQueryPagination.";

// [GET] /api/v1/employer/notifications
export const index = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    let queryPage: number = 1;
    let queryLimit: number = 4;

    const find: NotificationInterface.Find = {
      deleted: false,
      employerId: req["user"]._id,
    };

    if (req.query.from_record) {
      find._id = { $lt: req.query.from_record };
    }

    if (req.query.limit) {
      queryLimit = parseInt(req.query.limit.toString());
    }

    const countRecord = await Notification.countDocuments(find);

    const objectPagination = filterQueryPagination(
      countRecord,
      queryPage,
      queryLimit
    );

    let sort: any = {
      createdAt: -1,
      _id: -1,
    };

    let records = [];

    records = await Notification.find(find)
      .limit(objectPagination.limitItem)
      .skip(objectPagination.skip)
      .sort(sort);
  
    const metadata: any = {
      from_record: req.query.from_record,
      limit: queryLimit,
      remaining_items: objectPagination.remainingItem
    }

    res.status(200).json({ code: 200, data: records, metadata});
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/employer/notifications/read/:id
export const read = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id: string = req.params.id.toString();

    const notification = await Notification.findOne({ _id: id });

    await Notification.updateOne({ _id: id }, { is_seen: true });

    res.status(200).json({ success: "Đọc Thông Báo Thành Công!", code: 200 });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/employer/notifications/read-all
export const readAll = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const employerId = req["user"]["_id"];

    await Notification.updateMany({ employerId }, { is_seen: true });

    res
      .status(200)
      .json({ success: "Đọc Tất Cả Thông Báo Thành Công!", code: 200 });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
