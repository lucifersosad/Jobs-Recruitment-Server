import { Request, Response } from "express";
import * as EmployerInterface from "../../interfaces/empoloyer.interface";
import Employer from "../../../../models/employers.model";
import md5 from "md5";
import { generateRandomString } from "../../../../helpers/generateString";
import ForgotPasswordEmployer from "../../../../models/forgot-password-employer.model";
import { sendMailEmployer } from "../../../../helpers/sendMail";
import EmployerCounter from "../../../../models/employer-counter";

import ActivePhoneEmployer from "../../../../models/active-phone-employer";
import {
  getSession,
  saveRecord,
  sendCode,
  verifyCode,
} from "../../../../helpers/smsPhoneSend";
import { POPULATE } from "../../interfaces/populate.interface";
import JobCategories from "../../../../models/jobCategories.model";
import RoomChat from "../../../../models/rooms-chat.model";
import Job from "../../../../models/jobs.model";
import Cv from "../../../../models/cvs.model";

// [POST] /api/v1/clients/employer/register
export const register = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Tăng giá trị count trong bảng EmployerCounter lên 1 và lấy giá trị mới
    const counter = await EmployerCounter.findOneAndUpdate(
      {},
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );

    // Lấy thông tin người dùng từ request và lưu vào object infoUser
    const infoUser: EmployerInterface.Find = {
      address: req.body.address,
      companyName: req.body.companyName,
      fullName: req.body.fullName,
      gender: req.body.gender,
      level: req.body.level,
      linkedin: req.body.linkedin || "",
      password: md5(req.body.password),
      token: generateRandomString(30),
      phoneNumber: req.body.phoneNumber,
      email: req.body.email,
      code: counter.count.toString(),
    };

    // Tạo mới một đối tượng Employer và lưu vào database
    const userEmployer = new Employer(infoUser);
    await userEmployer.save();

    // Lấy token từ userEmployer
    const token: string = userEmployer.token;

    // Tìm employer dựa vào email
    const employerRoomChat = await Employer.findOne({
      email: req.body.email,
    }).select("_id");

    // Định nghĩa dữ liệu cho phòng chat mới
    const chatRoomData = {
      title: `Công ty ${req.body.companyName}`,
      typeRoom: "group",
      users: [
        {
          employer_id: employerRoomChat._id,
          id_check: employerRoomChat._id,
          role: "super-admin",
        },
      ],
    };

    // Tạo mới một đối tượng RoomChat và lưu vào database
    const chatRoom = new RoomChat(chatRoomData);
    await chatRoom.save();

    // Trả về response thành công cùng với token
    res
      .status(200)
      .json({ code: 200, success: "Tạo Tài Khoản Thành Công!", token: token });
  } catch (error) {
    // Log lỗi và trả về response lỗi
    console.error("Error in API:", error);
    res.status(500).json({ code: 500, error: "Internal Server Error" });
  }
};

// [POST] /api/v1/clients/employer/login
export const login = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    //Lấy email ,password người dùng gửi lên
    const email: string = req.body.email;
    const password: string = req.body.password;
    //Check xem trong databse có tồn tại email và mật khẩu có đúng hay không!
    const user = await Employer.findOne({
      email: email,
      password: md5(password),
    });
    //Nếu không đúng thì return tài khoản mật khẩu ko đúng
    if (!user) {
      res
        .status(401)
        .json({ code: 401, error: "Tài Khoản Hoặc Mật Khẩu Không Đúng!" });
      return;
    }
    //Lấy ra token lưu vào cookie
    const token: string = user.token;

    res
      .status(200)
      .json({ code: 200, success: "Đăng Nhập Thành Công!", token: token });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ code: 500, error: "Internal Server Error" });
  }
};

// [POST] /api/v1/employers/users/authen
export const authen = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const token: string = req.headers.authorization.split(" ")[1];
    //Tạo một mảng POPULATE có định dạng mặc định như dưới
    const populateCheck: POPULATE[] = [
      {
        path: "activityFieldList",
        select: "title",
        model: JobCategories,
      },
    ];
    //Check xem trong databse có tồn tại token và mật khẩu có đúng hay không!
    const userEmployer = await Employer.findOne({
      token: token,
    })
      .lean()
      .select("-password -token")
      .populate(populateCheck);

    //Nếu không đúng thì return tài khoản mật khẩu ko đúng
    if (!userEmployer) {
      res.status(401).json({ error: "Xác Thực Thất Bại!" });
      return;
    }
    //Nếu tài khoản bị khóa thì trả về thông báo tài khoản bị khóa
    if (userEmployer.status !== "active") {
      res.status(401).json({ error: "Tài Khoản Đã Bị Khóa!" });
      return;
    }
   
    //lấy ra thông tin cần thiết của user
    const recordNew = {
      id: userEmployer._id,
      fullName: userEmployer.fullName,
      email: userEmployer.email,
      phoneNumber: userEmployer.phoneNumber,
      code: userEmployer.code,
      image: userEmployer.image,
      gender: userEmployer.gender,
      level: userEmployer.level,
      cointsGP: userEmployer.cointsGP,
      activePhone: userEmployer.activePhone,
      companyName: userEmployer.companyName,
      emailCompany: userEmployer.emailCompany || "- -",
      addressCompany: userEmployer.addressCompany || "- -",
      descriptionCompany: userEmployer.descriptionCompany || "- -",
      phoneCompany: userEmployer.phoneCompany || "- -",
      website: userEmployer.website || "- -",
      numberOfWorkers: userEmployer.numberOfWorkers || "- -",
      activityFieldList:
        userEmployer?.activityFieldList?.map((item) => item._id) || "- -",
      activityFieldListName:
        userEmployer?.activityFieldList?.map((item) => item.title).join(", ") ||
        "- -",
      taxCodeCompany: userEmployer.taxCodeCompany || "- -",
      specificAddressCompany: userEmployer.specificAddressCompany || "- -",
      logoCompany: userEmployer.logoCompany || "",
      statusOnline: userEmployer.statusOnline,
      countActive: userEmployer.activePhone === true ? 2 : 1,
    };

    res.status(200).json({
      success: "Xác Thự Thành Công!",
      token: token,
      code: 200,
      infoUserEmployer: recordNew,
    });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};