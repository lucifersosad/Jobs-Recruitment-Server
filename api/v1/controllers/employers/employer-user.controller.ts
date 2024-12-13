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
  getSessionV2,
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

// [POST] /api/v1/clients/employer/password/forgot
export const forgotPassword = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    //Lấy Email khi người dùng gửi lên
    const email: string = req.body.email;
    //Check email này có trong database hay không
    const user = await Employer.findOne({
      email: email,
      deleted: false,
    });
    //Nếu không đúng thì return tài khoản ko đúng
    if (!user) {
      res.status(401).json({ code: 401, error: "Tài Khoản Không Đúng!" });
      return;
    }

    //Set time cho bản ghi "5" phút sẽ tự xóa
    const timeExpire: number = 4;
    const expireAtOk: Date = new Date();
    //Đoạn này setMiniutes là 5 phút cho biên expireAtOk vừa tạo
    expireAtOk.setMinutes(expireAtOk.getMinutes() + timeExpire);
    // Tạo ra một ãm OTP 6 số và Gàn hết thông tin vào objectForgotPassword
    const objectForgotPassword = {
      email: email,
      tokenReset: generateRandomString(30),
      expireAt: expireAtOk,
      timeWait: new Date(new Date().getTime() + 60),
    };

    //Xem email đã tồn tại trong database hay chưa
    const checkRecord = await ForgotPasswordEmployer.findOne({
      email: email,
    });
    //Tạo một biến otp để lưu otp
    let tokenReset: string;
    //Nếu bản ghi tồn tại và qua 60s trong validate rồi thì ta cho người dùng một otp mới,điều đơn giản chỉ là updte cái otp cũ
    if (checkRecord) {
      await ForgotPasswordEmployer.updateOne(
        {
          email: email,
        },
        objectForgotPassword
      );
      tokenReset = objectForgotPassword.tokenReset;
    } //Nếu chưa có bản ghi nào tồn tại ta tạo otp mới cho người dùng
    else {
      //Lưu vào database
      const record = new ForgotPasswordEmployer(objectForgotPassword);
      await record.save();
      tokenReset = record.tokenReset;
    }

    //Mấy đoạn dưới dài như này là html css cái form gửi otp về
    const subject: string = "Reset mật khẩu";

    //Bắt đầu gửi mail bằng hàm sendMail này
    sendMailEmployer(email, subject, tokenReset);
    res.status(200).json({
      code: 200,
      success: `Hãy kiểm tra email ${email} của bạn. Sau đó nhấn vào link trong hộp thư để đổi lại mật khẩu.`,
    });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/clients/employer/password/check-token
export const checkToken = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const tokenReset: string = req.body.tokenReset;
    //Check dữ vào database dữ liệu người dùng gửi lên
    const record = await ForgotPasswordEmployer.findOne({
      tokenReset: tokenReset,
    });

    //nếu check mà record không có trong database là otp không hợp lệ
    if (!record) {
      res.status(401).json({ code: 401, error: "Otp Không Hợp Lệ!" });
      return;
    }

    res.status(200).json({ code: 200, email: record.email });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/employer/users/password/reset
export const resetPassword = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    //Lấy thông tin người dùng gửi lên
    const email: string = req.body.email;
    const password: string = req.body.password;
    const accept: boolean = req.body?.accept;
    //lấy thông tin người dùng bằng token
    const user = await Employer.findOne({
      email: email,
      deleted: false,
    });
    //Nếu user không có thì in ra tài khoản không hợp lệ
    if (!user) {
      res.status(401).json({ error: "Tài Khoản Không Hợp Lệ!" });
      return;
    }
    //Nếu có accpet thì tạo một token mới
    let tokenNew: string;
    if (accept) {
      tokenNew = generateRandomString(30);

      await Employer.updateOne(
        { email: email },
        {
          password: md5(password),
          token: tokenNew,
        }
      );
    } else {
      await Employer.updateOne(
        { email: email },
        {
          password: md5(password),
        }
      );
    }
    //Xóa bản ghi trong database ForgotPassword khi đã đổi mật khẩu thành công
    await ForgotPasswordEmployer.deleteOne({ email: email });
    res.status(200).json({ code: 200, success: `Đổi Mật Khẩu Thành Công!` });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
// [POST] /api/v1/employers/users/upload-avatar
export const uploadAvatar = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const email: string = req["user"]["email"];

    await Employer.updateOne(
      { email: email },
      {
        image: req.body["thumbUrl"],
      }
    );
    res.status(200).json({ code: 200, success: `Thành Công!` });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/employers/users/change-info-employer
export const changeInfoEmployer = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const email: string = req["user"]["email"];
    const record: EmployerInterface.Find = {
      level: req.body.level,
      gender: req.body.gender,
      fullName: req.body.fullName,
    };
    if (req.body.linkedin) {
      record.linkedin = req.body.linkedin;
    }
    await Employer.updateOne(
      {
        email: email,
      },
      record
    );
    res.status(200).json({ code: 200, success: `Cập nhật dữ liệu thành công` });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/employers/users/change-info-company
export const changeInfoCompany = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Lấy email từ thông tin người dùng
    const email: string = req["user"]["email"];

    // Tạo một đối tượng chứa thông tin cần cập nhật
    const record = {
      companyName: req.body.companyName,
      emailCompany: req.body.emailCompany,
      addressCompany: req.body.addressCompany,
      phoneCompany: req.body.phoneCompany,
      numberOfWorkers: req.body.numberOfWorkers,
      activityFieldList: req.body.activityFieldList,
      taxCodeCompany: req.body.taxCodeCompany,
      specificAddressCompany: req.body.specificAddressCompany,
    };

    // Kiểm tra và thêm website vào record nếu có
    if (req.body?.website) {
      record["website"] = req.body.website;
    }

    // Kiểm tra và thêm mô tả công ty vào record nếu có
    if (req.body?.descriptionCompany) {
      record["descriptionCompany"] = req.body.descriptionCompany;
    }

    // Kiểm tra và thêm logo công ty vào record nếu có
    if (req.body["thumbUrl"]) {
      record["logoCompany"] = req.body["thumbUrl"];
    }

    // Tạo một đối tượng chứa các trường cần cập nhật
    let updateFields = {};
    // Kiểm tra và cập nhật thông tin công ty cho phòng chat
    if (req.body["thumbUrl"]) {
      // Cập nhật avatar cho phòng chat
      updateFields["avatar"] =
        req.body["thumbUrl"] ||
        "https://www.topcv.vn/v4/image/normal-company/logo_default.png";
    }

    if (req.body["companyName"]) {
      // Cập nhật tên phòng chat
      updateFields["title"] =
        "Công ty " + req.body.companyName || "Công ty chưa cập nhật";
    }

    // Thực hiện cập nhật nếu có trường nào cần cập nhật
    if (Object.keys(updateFields).length > 0) {
      await RoomChat.updateOne(
        {
          "users.employer_id": req["user"]._id,
          typeRoom: "group",
        },
        updateFields
      );
    }

    // Cập nhật thông tin công ty
    await Employer.updateOne(
      {
        email: email,
      },
      record
    );

    // Gửi phản hồi thành công về cho client
    res.status(200).json({ code: 200, success: "Cập nhật dữ liệu thành công" });
  } catch (error) {
    // Ghi log lỗi và gửi phản hồi lỗi về cho client
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/employers/users/send-sms
export const sendEms = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const email: string = req["user"]["email"];
    const phone: string = req.body.phone;
    const tokenSMS: string = process.env.TOKEN_SPEEDSMS;

    const responseSession = await getSessionV2(tokenSMS);

    if (responseSession["data"] && responseSession["data"]["require_2fa"]) {
      const session = responseSession["data"]["data"]["session"];
      const responseSendCode = await sendCode(session, phone);

      if (
        responseSendCode["data"] &&
        responseSendCode["data"]["status"] === "success"
      ) {
        const MSG_ID = responseSendCode["data"]["data"]["msg_id"];
        await saveRecord(email, MSG_ID, session, phone);
        res.status(200).json({
          code: 200,
          success: "Đã gửi tin nhắn thành công tới số điện thoại của bạn",
        });
        return;
      }

      if (
        responseSendCode["data"] &&
        responseSendCode["data"]["status"] === "error"
      ) {
        if (
          responseSendCode["data"]["message"] === "Invalid phone number format"
        ) {
          res
            .status(400)
            .json({ code: 400, error: "Số điện thoại không hợp lệ" });
          return;
        }

        if (
          responseSendCode["data"]["status"] === "error" &&
          responseSendCode["data"]["count_down"] > 0
        ) {
          res.status(400).json({
            code: 400,
            error: `Bạn đã gửi tin nhắn quá nhanh xin vui thử lại sau ${responseSendCode["data"]["count_down"]} giây`,
          });
          return;
        }
      }

      res.status(400).json({
        code: 400,
        error: "Đã có một số lỗi gì đó vui lòng thử lại",
      });
    }
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const verifyPassword = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const password: string = req.body.password;
    const email: string = req["user"]["email"];
    const user = await Employer.findOne({
      email: email,
      password: md5(password),
      status: "active",
    });
    if (!user) {
      res.status(401).json({ code: 401, error: "Mật khẩu không đúng" });
      return;
    }
    if (user["status"] !== "active") {
      res.status(401).json({ code: 401, error: "Tài khoản đã bị khóa" });
      return;
    }
    res.status(200).json({ code: 200, success: "Xác thực thành công" });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const verifyCodeSms = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { code, phone } = req.body;
    const email: string = req["user"]["email"];

    const record = await ActivePhoneEmployer.findOne({ email });
    if (!record) {
      res.status(401).json({ code: 401, error: "Không tìm thấy thông tin!" });
      return;
    }

    const responseVerifyCode = await verifyCode(
      record.phone,
      record.msg_id,
      code,
      record.session
    );
    const responseData = responseVerifyCode?.data?.data;

    if (responseVerifyCode?.data?.status === "success") {
      if (responseData?.verified === 1) {
        await ActivePhoneEmployer.deleteOne({ email });
        await Employer.updateOne(
          { email },
          { activePhone: true, phoneNumber: phone }
        );
        res.status(200).json({ code: 200, success: "Xác thực thành công" });
        return;
      } else if (responseData?.verified === 2) {
        res.status(401).json({
          code: 401,
          error:
            "Tài khoản của bạn đã sai mã xác thực quá nhiều lần vui lòng thử lại sau",
        });
        return;
      }
    } else if (
      responseVerifyCode?.data?.status === "error" &&
      responseVerifyCode?.data?.message === "session not found or expired"
    ) {
      await ActivePhoneEmployer.deleteOne({ email });
      res
        .status(401)
        .json({ code: 401, error: "Mã xác thực đã hết hạn vui lòng thử lại" });
      return;
    }

    res
      .status(401)
      .json({ code: 401, error: "Xác thực thất bại vui lòng thử lại" });
    return;
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

// [POST] /api/v1/employers/users/change-password
export const changePasswordEmployer = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    //Lấy ra mật khẩu mới
    const newPassword = req.body.newPassword;
    const email = req["user"].email;
    const accept: boolean = req.body?.accept;
    //Nếu có accpet thì tạo một token mới
    let tokenNew: string = "";
    if (accept) {
      tokenNew = generateRandomString(30);
      await Employer.updateOne(
        { email: email },
        {
          password: md5(newPassword),
          token: tokenNew,
        }
      );
    } else {
      await Employer.updateOne(
        { email: email },
        {
          password: md5(newPassword),
        }
      );
    }

    res.status(200).json({
      code: 200,
      success: `Đổi mật khẩu thành công!`,
      tokenNew: tokenNew,
    });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/employers/users/statistic-company
export const statisticCompany = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const idEmployer: string = req["user"]["_id"].toString();
    //Công việc đang mở
    const coutCompaignIsOpen = await Job.countDocuments({
      employerId: idEmployer,
      status: "active",
      deleted: false,
    });
    //Công việc đang chờ duyệt
    const coutCompaignIsPending = await Job.countDocuments({
      employerId: idEmployer,
      status: "pending",
      deleted: false,
    });
    //Cv đã duyệt
    const coutCvApproved = await Cv.countDocuments({
      employerId: idEmployer,
      status: "accept",
    });

    //Cv ứng tuyển
    const coutCvApplication = await Cv.countDocuments({
      employerId: idEmployer,
      status: "pending",
    });

    const record = {
      coutCompaignIsOpen,
      coutCompaignIsPending,
      coutCvApproved,
      coutCvApplication,
    };
    //Lấy ra thông tin cv đã duyệt, theo ngày từ đó lấy ra tỉ lệ cv đã duyệt
    const groupedCvs = await Cv.aggregate([
      {
        $match: {
          employerId: idEmployer,
        },
      },
      {
        $project: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          status: 1,
        },
      },
      {
        $group: {
          _id: "$date",
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },
          refuse: {
            $sum: {
              $cond: [{ $eq: ["$status", "refuse"] }, 1, 0],
            },
          },
          accept: {
            $sum: {
              $cond: [{ $eq: ["$status", "accept"] }, 1, 0],
            },
          },
        },
      },
    ]);
    record["groupedCvs"] = groupedCvs.map((item) => {
      return {
        value: item.accept / (item.accept + item.pending + item.refuse),
        type: item._id,
      };
    });
    res.status(200).json({ code: 200, data: record });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
