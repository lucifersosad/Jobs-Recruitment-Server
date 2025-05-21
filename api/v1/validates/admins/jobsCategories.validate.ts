import { Request, Response } from "express";
import { filterQueryStatusJobsCategories } from "../../../../helpers/filterQueryStatus.";
import JobCategories from "../../../../models/jobCategories.model";
import mongoose from "mongoose";
export const editStatus = (req: Request, res: Response, next: any): void => {
  const status: string = req.body.status;
  //Nếu dữ liệu người dùng gửi lên là rỗng thì báo lỗi chưa có dữ liệu
  if (!status) {
    res.status(400).json({ error: "Chưa Có Dữ Liệu!", code: 400 });
    return;
  }
  //Nếu dữ liệu người dùng gửi lên không giống các trạng thái thì báo lỗi dữ liệu không hợp lệ
  if (!filterQueryStatusJobsCategories(status)) {
    res
      .status(400)
      .json({ error: "Dữ Liệu  Trạng Thái Không Hợp Lệ!", code: 400 });
    return;
  }
  next();
};
export const createRecord = async (
  req: Request,
  res: Response,
  next: any
): Promise<void> => {
  const title: string = req.body.title || "";
  const status: string = req.body.status || "";
  const parent_id: string = req.body.parent_id || "";
  //Nếu dữ liệu người dùng gửi lên là rỗng thì báo lỗi chưa có dữ liệu
  if (!title) {
    res.status(400).json({ error: "Chưa Có Tiêu Đề Dữ Liệu!", code: 400 });
    return;
  }

  if (!status) {
    res.status(400).json({ error: "Chưa Có Trạng Thái!", code: 400 });
    return;
  }

  //Nếu dữ liệu người dùng gửi lên không giống các trạng thái thì báo lỗi dữ liệu không hợp lệ
  if (status) {
    if (!filterQueryStatusJobsCategories(status)) {
      res
        .status(400)
        .json({ error: "Dữ Liệu Trạng Thái Không Hợp Lệ!", code: 400 });
      return;
    }
  }

  if (parent_id) {
    if (!mongoose.Types.ObjectId.isValid(parent_id)) {
      res.status(400).json({ error: "Danh Mục Công Việc Không Hợp Lệ!" });
      return;
    }

    const category = await JobCategories.findById(parent_id);

    if (category === null || category?.parent_id) {
      res.status(400).json({ error: "Danh Mục Công Việc Không Hợp Lệ!" });
      return;
    }
  }

  next();
};

export const edit = async (req: Request, res: Response, next: any): Promise<void> => {
  const title: string = req.body.title.toString();
  const status: string = req.body.status || "";
  const parent_id: string = req.body.parent_id || "";
  
  //Nếu người dùng cố tình muốn đổi các trạng thái bên dưới thành rỗng thì in ra lỗi
  if (title === "") {
    res.status(400).json({ error: "Tiêu Đề Chưa Có Dữ Liệu!" });
    return;
  }
  if (!status) {
    res.status(400).json({ error: "Chưa Có Trạng Thái!", code: 400 });
    return;
  }

  //Nếu dữ liệu người dùng gửi lên không giống các trạng thái thì báo lỗi dữ liệu không hợp lệ
  if (status) {
    if (!filterQueryStatusJobsCategories(status)) {
      res
        .status(400)
        .json({ error: "Dữ Liệu Trạng Thái Không Hợp Lệ!", code: 400 });
      return;
    }
  }

  if (parent_id) {
    if (!mongoose.Types.ObjectId.isValid(parent_id)) {
      res.status(400).json({ error: "Danh Mục Công Việc Không Hợp Lệ!" });
      return;
    }

    const category = await JobCategories.findById(parent_id);

    if (category === null || category?.parent_id) {
      res.status(400).json({ error: "Danh Mục Công Việc Không Hợp Lệ!" });
      return;
    }
  }

  next();
};
