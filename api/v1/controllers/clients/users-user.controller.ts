import {
  generateRandomNumber,
  generateRandomString,
} from "../../../../helpers/generateString";
import { Request, Response } from "express";
import md5 from "md5";
import User from "../../../../models/user.model";
import { InfoUser } from "../../interfaces/user.interface";
import ForgotPassword from "../../../../models/forgot-password.model";
import { sendMail } from "../../../../helpers/sendMail";
import Job from "../../../../models/jobs.model";
import Cv from "../../../../models/cvs.model";
import {
  createAndSendNotification,
  ENUM_NOTIFICATION_DETAIL_TYPE,
  ENUM_NOTIFICATION_TYPE,
} from "../../../../helpers/notification";
import { putObject } from "../../../../helpers/uploadToS3Aws";
import { callRapidApi } from "../../../../helpers/parseCV";
import MyCv from "../../../../models/my-cvs.model";

// [POST] /api/v1/clients/users/allow-setting-user
export const allowSettingUser = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const keyword: string = req.body.keyword;
    const status: boolean = Boolean(req.body.status);
    const email: string = req["user"]["email"];
    enum keyStatus {
      allowSearch = "allow-search",
      activateJobSearch = "activate-job-search",
    }

    switch (keyword) {
      case keyStatus.allowSearch:
        await User.updateOne(
          { email: email },
          {
            allowSearch: status,
          }
        );
        break;
      case keyStatus.activateJobSearch:
        await User.updateOne(
          { email: email },
          {
            activeJobSearch: status,
          }
        );
        break;
      default:
        break;
    }
    res.status(200).json({ code: 200, success: `Thành Công!` });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/clients/users/upload-avatar
export const uploadAvatar = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const email: string = req["user"]["email"];
    await User.updateOne(
      { email: email },
      {
        avatar: req.body["thumbUrl"],
      }
    );
    res.status(200).json({ code: 200, success: `Thành Công!` });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/clients/users/register
export const register = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    //Lấy info người dùng gửi lên xong lưu vào object infoUser
    const infoUser: InfoUser = {
      fullName: req.body.fullName,
      email: req.body.email,
      password: md5(req.body.password),
      token: generateRandomString(30),
    };
    //Lưu tài khoản vừa tạo vào database
    const user = new User(infoUser);
    await user.save();

    //Lưu token vừa tạo vào cookie
    const token: string = user.token;
    res.cookie("token", token);
    res
      .status(200)
      .json({ code: 200, success: "Tạo Tài Khoản Thành Công!", token: token });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ code: 500, error: "Internal Server Error" });
  }
};

// [POST] /api/v1/clients/users/login
export const login = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    //Lấy email ,password người dùng gửi lên
    const email: string = req.body.email;
    const password: string = req.body.password;
    //Check xem trong databse có tồn tại email và mật khẩu có đúng hay không!
    const user = await User.findOne({
      email: email,
      password: md5(password),
    }).select("-embedding");
    //Nếu không đúng thì return tài khoản mật khẩu ko đúng
    if (!user) {
      res
        .status(401)
        .json({ code: 401, error: "Tài Khoản Hoặc Mật Khẩu Không Đúng!" });
      return;
    }
    //Lấy ra token lưu vào cookie
    const token: string = user.token;
    res.cookie("token", token);
    res
      .status(200)
      .json({ code: 200, success: "Đăng Nhập Thành Công!", token: token });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ code: 500, error: "Internal Server Error" });
  }
};
// [POST] /api/v1/clients/users/password/forgot
export const forgotPassword = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    //Lấy Email khi người dùng gửi lên
    const email: string = req.body.email;
    //Check email này có trong database hay không
    const user = await User.findOne({
      email: email,
      deleted: false,
    }).select("-embedding");
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
    const checkRecord = await ForgotPassword.findOne({
      email: email,
    });
    //Tạo một biến otp để lưu otp
    let tokenReset: string;
    //Nếu bản ghi tồn tại và qua 60s trong validate rồi thì ta cho người dùng một otp mới,điều đơn giản chỉ là updte cái otp cũ
    if (checkRecord) {
      await ForgotPassword.updateOne(
        {
          email: email,
        },
        objectForgotPassword
      );
      tokenReset = objectForgotPassword.tokenReset;
    } //Nếu chưa có bản ghi nào tồn tại ta tạo otp mới cho người dùng
    else {
      //Lưu vào database
      const record = new ForgotPassword(objectForgotPassword);
      await record.save();
      tokenReset = record.tokenReset;
    }

    //Mấy đoạn dưới dài như này là html css cái form gửi otp về
    const subject: string = "Reset mật khẩu";

    //Bắt đầu gửi mail bằng hàm sendMail này
    sendMail(email, subject, tokenReset);
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

// [POST] /api/v1/clients/users/password/check-token
export const checkToken = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const tokenReset: string = req.body.tokenReset;
    //Check dữ vào database dữ liệu người dùng gửi lên
    const record = await ForgotPassword.findOne({
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

// [POST] /api/v1/clients/users/password/reset
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
    const user = await User.findOne({
      email: email,
      deleted: false,
    }).select("-embedding");
    //Nếu user không có thì in ra tài khoản không hợp lệ
    if (!user) {
      res.status(401).json({ error: "Tài Khoản Không Hợp Lệ!" });
      return;
    }
    //Nếu có accpet thì tạo một token mới
    let tokenNew: string;
    if (accept) {
      tokenNew = generateRandomString(30);
      await User.updateOne(
        { email: email },
        {
          password: md5(password),
          token: tokenNew,
        }
      );
    } else {
      await User.updateOne(
        { email: email },
        {
          password: md5(password),
        }
      );
    }
    //Xóa bản ghi trong database ForgotPassword khi đã đổi mật khẩu thành công
    await ForgotPassword.deleteOne({ email: email });
    res.status(200).json({ code: 200, success: `Đổi Mật Khẩu Thành Công!` });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/clients/users/detail
export const detail = async function (
  req: Request,
  res: Response
): Promise<void> {
  //lấy ra ra req.user được lưu ở middlewares auth
  const user = req["user"];
  //gán dữ liệu user vào info
  res.status(200).json({ success: `Thành Công!`, info: user });
};

// [POST] /api/v1/clients/users/list
export const list = async function (
  req: Request,
  res: Response
): Promise<void> {
  //Lâý danh sách list tất cả user để truyền ra api
  const user = await User.find({
    deleted: false,
  }).select("fullName email");
  res.status(200).json({ success: `Thành Công!`, user: user });
};

// [POST] /api/v1/clients/users/authen
export const authen = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const token = req.body.token;
    //Tạo một mảng POPULATE có định dạng mặc định như dưới

    //Check xem trong databse có tồn tại token và mật khẩu có đúng hay không!
    const userClient = await User.findOne({
      token: token,
    })
      .lean()
      .select("-password -token -embedding");
    //Nếu không đúng thì return tài khoản mật khẩu ko đúng
    if (!userClient) {
      res.status(401).json({ error: "Xác Thực Thất Bại!" });
      return;
    }
    //Nếu tài khoản bị khóa thì trả về thông báo tài khoản bị khóa
    if (userClient.status !== "active") {
      res.status(401).json({ error: "Tài Khoản Đã Bị Khóa!" });
      return;
    }
    //lấy ra thông tin cần thiết của user
    const recordNew = {
      id: userClient._id,
      fullName: userClient.fullName,
      email: userClient.email,
      activeJobSearch: userClient.activeJobSearch,
      allowSearch: userClient.allowSearch,
      avatar: userClient.avatar,
      phone: userClient.phone || "",
      gender: userClient.gender || "",
      job_categorie_id: userClient.job_categorie_id || "",
      skill_id: userClient.skill_id || "",
      yearsOfExperience: userClient.yearsOfExperience || "",
      educationalLevel: userClient.educationalLevel || "",
      level: userClient.level || "",
      desiredSalary: userClient.desiredSalary || "",
      workAddress: userClient.workAddress || "",
      emailSuggestions: userClient.emailSuggestions || [],
      address: userClient.address || "",
      dateOfBirth: userClient.dateOfBirth || "",
      description: userClient.description || "",
      statusOnline: userClient.statusOnline || false,
      listJobSave: userClient.listJobSave || [],
      experiences: userClient.experiences || [],
      educations: userClient.educations || [],
      skills: userClient.skills || [],
    };

    res.status(200).json({
      success: "Xác Thự Thành Công!",
      token: token,
      code: 200,
      infoUser: recordNew,
    });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/clients/users/change-password
export const changePassword = async function (
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
      await User.updateOne(
        { email: email },
        {
          password: md5(newPassword),
          token: tokenNew,
        }
      );
    } else {
      await User.updateOne(
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

// [POST] /api/v1/clients/users/change-info-user
export const changeInfoUser = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const fullName: string = req.body.fullName;
    const phone: string = req.body.phone;
    const address: string = req.body.address;
    const email: string = req["user"].email;
    const description: string =
      req.body.description ||
      "Kết nối với hàng nghìn cơ hội việc làm và ứng viên tài năng trên UTEM - một nền tảng đổi mới dành cho người tìm kiếm công việc và nhà tuyển dụng. Với UTEM, bạn sẽ khám phá ra một thế giới mới của cơ hội nghề nghiệp và kết nối với cộng đồng chuyên nghiệp. Hãy bắt đầu hành trình của bạn ngay hôm nay và tạo ra một hồ sơ độc đáo để nổi bật giữa đám đông.";
    await User.updateOne(
      {
        email: email,
      },
      {
        fullName: fullName,
        phone: phone,
        address: address,
        description: description,
      }
    );

    res
      .status(200)
      .json({ code: 200, success: `Thay đổi thông tin thành công!` });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// [POST] /api/v1/clients/users/change-job-suggestions
export const changeJobSuggestions = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const email = req["user"].email;
    const {
      gender,
      job_categorie_id,
      yearsOfExperience,
      desiredSalary,
      workAddress,
      dateOfBirth,
      educationalLevel,
      level,
    } = req.body;

    await User.updateOne(
      {
        email: email,
      },
      {
        gender,
        job_categorie_id,
        yearsOfExperience,
        desiredSalary,
        workAddress,
        dateOfBirth,
        educationalLevel,
        level,
      }
    );
    res
      .status(200)
      .json({ code: 200, success: `Thay đổi thông tin thành công!` });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/clients/users/change-job-suggestions
export const changeEmailSuggestions = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { emailCheck } = req.body;
    const email = req["user"].email;
    await User.updateOne({ email: email }, { emailSuggestions: emailCheck });
    res
      .status(200)
      .json({ code: 200, success: `Cập nhật thông báo qua email thành công!` });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/clients/users/recruitment-job
export const recruitmentJob = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    //Lấy ra id công việc muốn xin vào
    const idJob: String = req.body.idJob;
    //Tạo ra một comment lưu dữ liệu cần thiết
    const recordNew = {
      email: req["user"].email,
      fullName: req["user"].fullName,
      avatar: req["user"].avatar,
      title: req.body.title,
      phone: req.body.phone,
      id_file_cv: req.body.file,
      ["introducing_letter"]: req.body["introducing_letter"],
      dateTime: new Date(),
      idUser: req["user"]._id,
      status: "pending",
      countView: 0,
      idJob: idJob,
      employerId: req?.body?.employerId,
    };
    const record = new Cv(recordNew);
    await record.save();
    const idCv = record._id;

    //Bắt đầu cập nhật
    await Job.updateOne(
      {
        _id: idJob,
      },
      {
        $push: { listProfileRequirement: idCv },
      }
    );

    await createAndSendNotification({
      employerId: record.employerId,
      type: ENUM_NOTIFICATION_TYPE.CV,
      detail_type: ENUM_NOTIFICATION_DETAIL_TYPE.NEW_CV,
      ref_id: record._id,
      image: record.avatar,
      extra: {
        job_id: record.idJob,
        candidate_name: record.fullName,
        job_title: record.title,
      },
    });

    res.status(200).json({
      code: 201,
      success: `Bạn đã ứng tuyển thành công vui lòng đợi nhà tuyển dụng phản hồi!`,
    });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/clients/users/upload-cv
export const uploadCv = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Lấy thông tin người dùng từ request
    const user = req["user"];

    // Lấy idFile và nameFile từ body của request
    const idFile = req.body.file;
    let nameFile = req.body.fileName;
    if (nameFile.includes(".pdf")) {
      nameFile = nameFile.replace(".pdf", "");
    }
    // Tạo một đối tượng mới với idFile và nameFile
    const objectNew = {
      idFile: idFile,
      nameFile: nameFile,
    };

    // Cập nhật thông tin CV của người dùng trong cơ sở dữ liệu
    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $push: { cv: objectNew },
      }
    );

    // Trả về thông báo thành công
    res.status(200).json({ code: 200, success: "Upload CV thành công!" });
  } catch (error) {
    // Ghi lỗi vào console nếu có lỗi xảy ra
    console.error("Error in API:", error);

    // Trả về lỗi 500 nếu có lỗi xảy ra
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [GET] /api/v1/clients/users/get-cv-user
export const getCvByUser = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = req["user"];

    const listCV = user.cv;
    res.status(200).json({ code: 200, data: listCV });
  } catch (error) {
    // Ghi lỗi vào console nếu có lỗi xảy ra
    console.error("Error in API:", error);

    // Trả về lỗi 500 nếu có lỗi xảy ra
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// [GET] /api/v1/clients/users/edit-cv-user
export const editCvByUser = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = req["user"];
    const idFile = req.body.idFile;
    const newNameCv = req.body.newNameCv;

    await User.updateOne(
      {
        _id: user._id,
        "cv.idFile": idFile,
      },
      {
        $set: { "cv.$.nameFile": newNameCv },
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

// [POST] /api/v1/clients/users/save-job
// Định nghĩa enum Action ngoài hàm
enum Action {
  SAVE = "save",
  DELETE = "delete",
}

export const saveJob = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Sử dụng destructuring để lấy idJob và action từ req.body
    const { idJob, action }: { idJob: string; action: string } = req.body;

    // Lưu req["user"]._id vào biến userId để tránh lặp lại
    const userId: string = req["user"]._id.toString();

    const objectNew: {
      idJob: string;
      createdAt: Date;
    } = {
      idJob: idJob,
      createdAt: new Date(),
    };

    // Sử dụng switch để xử lý các hành động khác nhau
    switch (action) {
      case Action.SAVE:
        // Nếu hành động là SAVE, thêm idJob vào listJobSave của user
        await User.updateOne(
          { _id: userId },
          {
            $push: { listJobSave: objectNew },
          }
        );
        res
          .status(200)
          .json({ code: 200, success: "Lưu công việc thành công" });
        break;
      case Action.DELETE:
        // Nếu hành động là DELETE, xóa idJob khỏi listJobSave của user
        await User.updateOne(
          { _id: userId },
          { $pull: { listJobSave: { idJob: idJob } } }
        );
        res
          .status(200)
          .json({ code: 200, success: "Bỏ lưu công việc thành công" });
        break;
      default:
        res.status(400).json({ code: 400, error: "Hành động không hợp lệ" });
    }
  } catch (error) {
    // Ghi lỗi vào console nếu có lỗi xảy ra
    console.error("Error in API:", error);

    // Trả về lỗi 500 nếu có lỗi xảy ra
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

// [POST] /api/v1/clients/users/upload-image
export const uploadImage = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const objectFile = req["files"]["file"]

    const file = objectFile.data
    const fileExtentsion = objectFile.mimetype.split("/")[1]
    
    const fileName = "profile/" + Date.now() + `.${fileExtentsion}`
    
    const { url, key } = await putObject(file, fileName, "image")

    res
      .status(200)
      .json({ code: 200, success: `Upload Thành Công`, data: {url, key} });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [GET] /api/v1/clients/users/get-profile/:id
export const getProfile = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const _id = req.params.id;

    const profile = await User.findById(_id).select("_id avatar jobTitle jobObjective fullName experiences educations skills")

    res
      .status(200)
      .json({ code: 200, success: `Truy Vấn Thành Công`, data: profile });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// [POST] /api/v1/clients/users/update-education
export const updateEducation = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const _id: string = req["user"]._id;

    await User.updateOne(
      {
        _id,
      },
      {
        educations: req.body
      }
    );

    res
      .status(200)
      .json({ code: 200, success: `Đã Lưu Học Vấn` });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/clients/users/update-education
export const updateExperience = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const _id: string = req["user"]._id;

    await User.updateOne(
      {
        _id,
      },
      {
        experiences: req.body
      }
    );

    res
      .status(200)
      .json({ code: 200, success: `Đã Lưu Kinh Nghiệm` });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// [POST] /api/v1/clients/users/update-education
export const updateSkill = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const _id: string = req["user"]._id;

    await User.updateOne(
      {
        _id,
      },
      {
        skills: req.body
      }
    );

    res
      .status(200)
      .json({ code: 200, success: `Đã Lưu Kĩ Năng` });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/clients/users/update-profile
export const updateProfile = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const _id: string = req["user"]._id;

    const {jobTitle, jobObjective} = req.body

    await User.updateOne(
      {
        _id,
      },
      {
        jobTitle,
        jobObjective
      }
    );

    res
      .status(200)
      .json({ code: 200, success: `Cập nhật thành công` });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/clients/users/upload-cv-2
export const uploadCv2 = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Lấy thông tin người dùng từ request
    const user = req["user"];

    const url = req.body.url;
    const key = req.body.key;
    const buffer = req.body.buffer;

    const result = await callRapidApi(url)

    const cv = new MyCv(result);
    await cv.save()

    res
      .status(200)
      .json({ code: 200, success: `Upload CV Thành Công`, data: {url, key, result} });
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
