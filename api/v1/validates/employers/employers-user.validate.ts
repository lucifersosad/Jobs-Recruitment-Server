import { Request, Response } from "express";
import User from "../../../../models/user.model";
import ForgotPassword from "../../../../models/forgot-password.model";
import md5 from "md5";
import Employer from "../../../../models/employers.model";
import ForgotPasswordEmployer from "../../../../models/forgot-password-employer.model";
import ActivePhoneEmployer from "../../../../models/active-phone-employer";
import axios, { Axios } from "axios";
import qs from "qs";
//Cả đoạn này hàm hỗ trợ
//Hàm này kiểm tra Password
function validatePassword(password: string): boolean {
  // Ít nhất 8 ký tự
  if (password.length < 6) {
    return false;
  }
  //nhiều nhất 25 ký tự
  if (password.length > 25) {
    return false;
  }
  // Ít nhất một chữ hoa
  // if (!/[A-Z]/.test(password)) {
  //   return false;
  // }
  // Ít nhất một ký tự đặc biệt
  // if (!/[!@#$%^&*]/.test(password)) {
  //   return false;
  // }
  // Mật khẩu hợp lệ nếu vượt qua tất cả các điều kiện
  return true;
}
function validatePhoneNumber(phone: string): boolean {
  // Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0
  const phoneRegex = /^0\d{9}$/;
  return phoneRegex.test(phone);
}
function validatePhoneNumberInternational(phone: string): boolean {
  // Số điện thoại phải bắt đầu bằng dấu + và theo sau là 2 hoặc 3 số (mã quốc gia), sau đó là 9 hoặc 10 số còn lại
  const phoneRegex = /^\+\d{2,3}\d{9,10}$/;
  return phoneRegex.test(phone);
}
//Hàm này kiểm tra Email
function validateEmail(email: string): boolean {
  // Biểu thức chính quy kiểm tra địa chỉ email
  const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Kiểm tra xem địa chỉ email đáp ứng biểu thức chính quy hay không
  return emailRegex.test(email);
}
//Hàm này kiểm tra số điện thoại nếu có số 0 ở đầu thì cắt đi
function convertPhone(phone: string): string {
  if (phone.startsWith("0")) {
    return phone.substring(1);
  }
  return phone;
}
const checkActivePhone = (activePhone: boolean, res: Response) => {
  if (activePhone) {
    return true;
  }
  return false;
};
const checkExistingPhone = async (
  phone: string,
  currentUserPhone: string,
  res: Response
) => {
  if (phone == currentUserPhone) {
    return false;
  }

  const checkPhone = await Employer.findOne({ phoneNumber: phone }).select(
    "phone"
  );

  if (checkPhone) {
    return true;
  }
  return false;
};

const checkRateLimit = async (email: string, res: Response) => {
  const record = await ActivePhoneEmployer.findOne({ email: email });
  if (record) {
    //Lấy timeWait lưu trong database để tạo một đối tượng date
    const dateObject: Date = new Date(record.timeWait);
    // Thời điểm hiện tại
    const currentDate: Date = new Date();
    // Tính toán khoảng thời gian giữa hai thời điểm
    const timeDifference: number = currentDate.getTime() - dateObject.getTime();
    // Chuyển đổi khoảng thời gian từ milliseconds sang giây
    const minutesDifference: number = Math.ceil(timeDifference / 1000);

    //Check xem nếu người dùng đã gửi phải bắt người dùng đợi
    if (minutesDifference < 180) {
      return {
        status: true,
        minutesDifference: minutesDifference,
      };
    }
  }
  //Nếu không có thì trả về false và xóa hết dữ liệu trong database
  await ActivePhoneEmployer.deleteOne({ email: email });
  return false;
};

//--------------------------------------------------------------------------------
export const register = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  //Kiểm tra xem người dùng nhập email đúng hay không
  if (!validateEmail(req.body.email)) {
    res.status(401).json({ code: 401, error: "Email Không Hợp Lệ" });
    return;
  }
  //Lọc email trong database
  const checkEmail = await Employer.findOne({
    email: req.body.email,
    deleted: false,
  });

  //Nếu email đã có trong database trả về lỗi
  if (checkEmail) {
    res.status(401).json({ code: 401, error: "Email đã tồn tại!" });
    return;
  }
  //Kiểm tra xem password có đúng định dạng không
  if (!validatePassword(req.body.password)) {
    res.status(401).json({
      code: 401,
      error: "Mật khẩu phải có độ dài từ 6 đến 25 ký tự!",
    });
    return;
  }
  //Kiểm tra xem password có đúng định dạng không
  if (req.body.password !== req.body.reEnterPassword) {
    res.status(401).json({ code: 401, error: "Mật khẩu xác nhận chưa đúng!" });
    return;
  }
  //Check xem address có rỗng không
  if (!req.body?.address?.city) {
    res.status(401).json({ code: 401, error: "Vui lòng chọn thành phố!" });
    return;
  }
  //Check xem address có rỗng không
  if (!req.body?.address?.district) {
    res.status(401).json({ code: 401, error: "Vui lòng chọn quận/huyện!" });
    return;
  }
  //Check xem tên công ty có rỗng không
  if (!req.body.companyName) {
    res.status(401).json({ code: 401, error: "Vui lòng nhập tên công ty!" });
    return;
  }
  //Check xem giới tính có rỗng không
  if (!req.body.gender) {
    res.status(401).json({ code: 401, error: "Vui lòng chọn giới tính!" });
    return;
  }
  //Check xem số điện thoại có rỗng không
  if (!req.body.phoneNumber) {
    res.status(401).json({ code: 401, error: "Vui lòng nhập số điện thoại!" });
    return;
  }
  //Check xem số điện thoại có hợp lệ không
  if (!validatePhoneNumber(req.body.phoneNumber)) {
    res.status(401).json({ code: 401, error: "Số điện thoại không hợp lệ!" });
    return;
  }
  //Check xem level có rỗng không
  if (!req.body.level) {
    res
      .status(401)
      .json({ code: 401, error: "Vui lòng nhập vị trí công tác!" });
    return;
  }
  //Check xem fullName có rỗng không
  if (!req.body.fullName) {
    res.status(401).json({ code: 401, error: "Vui Lòng Nhập Tên!" });
    return;
  }
  //Nếu thỏa mãn hết điều kiện thì cho next
  next();
};

export const login = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  //Kiểm tra xem người dùng nhập email đúng hay không
  if (!validateEmail(req.body.email)) {
    res.status(401).json({ code: 401, error: "Email Không Hợp Lệ" });
    return;
  }

  //Kiểm tra xem người dùng nhập email hay chưa
  if (!req.body.password) {
    res.status(401).json({ code: 401, error: "Vui Lòng Nhập Mật Khẩu!" });
    return;
  }
  //Nếu thỏa mãn hết điều kiện thì cho next
  next();
};

export const forgotPassword = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  const email: string = req.body.email;
  //Kiểm tra xem người dùng nhập email đúng hay không
  if (!validateEmail(email)) {
    res.status(401).json({ code: 401, error: "Email Không Hợp Lệ" });
    return;
  }
  const record = await ForgotPasswordEmployer.findOne({
    email: email,
  });
  //Check xem nếu người dùng đã gửi phải bắt người dùng đợi
  if (record) {
    //Lấy timeWait lưu trong database để tạo một đối tượng date
    const dateObject: Date = new Date(record.timeWait);
    // Thời điểm hiện tại
    const currentDate: Date = new Date();
    // Tính toán khoảng thời gian giữa hai thời điểm
    const timeDifference: number = currentDate.getTime() - dateObject.getTime();
    // Chuyển đổi khoảng thời gian từ milliseconds sang giây
    const minutesDifference: number = Math.ceil(timeDifference / 1000);

    if (minutesDifference < 60) {
      res.status(401).json({
        code: 401,
        error: `Bạn không được gửi quá nhanh hãy thử Lại sau ${
          60 - minutesDifference
        } giây!`,
      });
      return;
    }
  }
  next();
};

export const checkToken = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  if (!req.body.tokenReset) {
    res.status(401).json({ error: "Vui lòng nhập token!" });
    return;
  }
  const record = await ForgotPasswordEmployer.findOne({
    tokenReset: req.body.tokenReset,
  });
  if (!record) {
    res.status(401).json({
      code: 401,
      error: "Email này chưa được gửi otp vui lòng gửi otp và thử lại!",
    });
    return;
  }

  next();
};

export const resetPassword = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  if (!req.body.email) {
    res.status(401).json({ error: "Vui lòng nhập email!" });
    return;
  }
  const record = await ForgotPasswordEmployer.findOne({
    email: req.body.email,
  });
  if (!record) {
    res.status(401).json({
      code: 401,
      error: "Email này chưa được gửi otp vui lòng gửi otp và thử lại!",
    });
    return;
  }

  if (!req.body.password) {
    res
      .status(401)
      .json({ code: 401, error: "Vui lòng không để trống mật khẩu!" });
    return;
  }
  //Kiểm tra xem password có đúng định dạng không
  if (!validatePassword(req.body.password)) {
    res.status(401).json({
      code: 401,
      error: "Mật khẩu phải có độ dài từ 6 đến 25 ký tự!",
    });
    return;
  }
  if (req.body.password !== req.body.reEnterPassword) {
    res.status(401).json({
      code: 401,
      error: "Mật khẩu xác nhận chưa đúng!",
    });
    return;
  }
  next();
};

export const authen = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  //Kiểm tra xem người dùng nhập email hay chưa
  if (!req.headers.authorization) {
    res.status(401).json({ code: 401, error: "Vui Lòng Nhập Token!" });
    return;
  }
  //Nếu thỏa mãn hết điều kiện thì cho next
  next();
};

export const allowSettingUser = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  const keywordCheck = ["allow-search", "activate-job-search"];
  const keyword: string = req.body.keyword;
  const status = req.body.status;
  if (!keywordCheck.includes(keyword)) {
    res.status(401).json({ code: 401, error: "Keyword không hợp lệ!" });
    return;
  }

  if (typeof status !== "boolean") {
    res.status(401).json({ code: 401, error: "Status không hợp lệ!" });
    return;
  }
  next();
};

export const changePassword = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  try {
    //Lấy ra mật khẩu cũ
    const password = req.body.password;
    //Lấy ra mật khẩu mới
    const newPassword = req.body.newPassword;
    //Lấy ra mật khẩu nhập lại
    const reEnterPassword = req.body.reEnterPassword;
    //Kiểm tra xem có nhập đúng mật khẩu mới không xem khớp không
    //Lấy ra email
    const email = req["user"].email;
    if (newPassword !== reEnterPassword) {
      res.status(401).json({ code: 401, error: "Mật khẩu mới không khớp!" });
      return;
    }
    if (newPassword === password) {
      res.status(401).json({
        code: 401,
        error: "Mật khẩu mới không được trùng mật khẩu cũ!",
      });
      return;
    }
    //Lấy ra user từ database
    const user = await Employer.findOne({
      email: email,
      password: md5(password),
    });
    //Nếu không đúng thì return tài khoản mật khẩu ko đúng
    if (!user) {
      res.status(401).json({ code: 401, error: "Sai mật khẩu hiện tại!" });
      return;
    }
    //Nếu tài khoản không hoạt động thì trả về lỗi
    if (user.status !== "active") {
      res.status(401).json({ code: 401, error: "Tài khoản đã bị khóa!" });
      return;
    }

    //Kiểm tra xem password có đúng định dạng không
    if (!validatePassword(newPassword)) {
      res.status(401).json({
        code: 401,
        error: "Mật khẩu phải có độ dài từ 6 đến 25 ký tự!",
      });
      return;
    }
    next();
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const changeInfoUser = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  try {
    const fullName = req.body.fullName;
    const gender = req.body.gender;
    const level = req.body.level;
    if (!fullName) {
      res.status(401).json({ code: 401, error: "Vui lòng nhập tên!" });
      return;
    }
    if (!gender) {
      res.status(401).json({ code: 401, error: "Vui lòng chọn giới tính!" });
      return;
    }
    if (!level) {
      res
        .status(401)
        .json({ code: 401, error: "Vui lòng nhập vị trí công tác!" });
      return;
    }
    next();
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const changeInfoCompany = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  try {
    if (!req.body.taxCodeCompany) {
      res.status(401).json({ code: 401, error: "Vui lòng nhập mã số thuế" });
      return;
    }
  
    if (!req.body.addressCompany) {
      res
        .status(401)
        .json({
          code: 401,
          error: "Vui lòng chọn Tỉnh/thành phố, Quận/huyện, Phường/xã",
        });
      return;
    }
    if (!req.body.specificAddressCompany) {
      res
        .status(401)
        .json({ code: 401, error: "Vui lòng chọn địa chỉ chi tiết" });
      return;
    }
    if (!req.body.numberOfWorkers) {
      res
        .status(401)
        .json({ code: 401, error: "Vui lòng chọn quy mô công ty" });
      return;
    }

    if (!req.body.emailCompany) {
      res.status(401).json({ code: 401, error: "Vui lòng nhập email công ty" });
      return;
    }
    if (req.body["activityFieldList"].length < 1) {
      res
        .status(401)
        .json({
          code: 401,
          error: "Vui lòng chọn ít nhất một lĩnh vực hoạt động",
        });
      return;
    }
    if (!req.body["phoneCompany"]) {
      res
        .status(401)
        .json({ code: 401, error: "Vui lòng nhập số điện thoại công ty" });
      return;
    }
    if (req.body.phoneCompany) {
      if (!validatePhoneNumber(req.body.phoneCompany)) {
        res
          .status(401)
          .json({ code: 401, error: "Số điện thoại không hợp lệ" });
        return;
      }
    }

    next();
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const changeJobSuggestions = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  try {
    const {
      gender,
      job_categorie_id,
      skill_id,
      yearsOfExperience,
      desiredSalary,
      workAddress,
    } = req.body;

    if (!gender) {
      res.status(401).json({ code: 401, error: "Vui lòng chọn giới tính!" });
      return;
    }
    if (!job_categorie_id) {
      res.status(401).json({ code: 401, error: "Vui lòng chọn ngành nghề!" });
      return;
    }
    if (!skill_id) {
      res.status(401).json({ code: 401, error: "Vui lòng chọn kỹ năng!" });
      return;
    }
    if (!yearsOfExperience) {
      res
        .status(401)
        .json({ code: 401, error: "Vui lòng chọn số năm kinh nghiệm!" });
      return;
    }
    if (!desiredSalary) {
      res
        .status(401)
        .json({ code: 401, error: "Vui lòng chọn mức lương mong muốn!" });
      return;
    }
    if (!workAddress) {
      res
        .status(401)
        .json({ code: 401, error: "Vui lòng chọn địa chỉ làm việc!" });
      return;
    }
    if (skill_id.length < 1) {
      res
        .status(401)
        .json({ code: 401, error: "Vui lòng chọn ít nhất một kĩ năng!" });
      return;
    }
    if (workAddress.length < 1) {
      res
        .status(401)
        .json({ code: 401, error: "Vui lòng chọn ít nhất một địa chỉ!" });
      return;
    }
    if (skill_id.length > 5) {
      res.status(401).json({
        code: 401,
        error: "Bạn chỉ được phép chọn 5 kĩ năng nếu là thành viên thường!",
      });
      return;
    }
    if (workAddress.length > 5) {
      res.status(401).json({
        code: 401,
        error:
          "Bạn chỉ được phép chọn 5 địa chỉ làm việc nếu là thành viên thường!",
      });
      return;
    }
    next();
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const changeEmailSuggestions = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  try {
    const checkEmailValidate = [
      "thong-bao-cap-nhat-quan-trong",
      "thong-bao-ntd-da-xem",
      "thong-bao-tinh-nang",
      "thong-bao-khac",
      "thong-bao-viec-lam-phu-hop",
      "thong-bao-ntd-moi-phong-van",
    ];
    const { emailCheck } = req.body;
    if (emailCheck.length > 0) {
      //Kiểm tra xem có phần tử nào không hợp lệ không bằng hàm every hàm này trả về true nếu tất cả phần tử đều hợp lệ
      const hasInvalidChoice = emailCheck.every((element: string) =>
        checkEmailValidate.includes(element)
      );
      if (!hasInvalidChoice) {
        res.status(401).json({
          code: 401,
          error: "Các lựa chọn của bạn có lựa chọn không hợp lệ!",
        });
        return;
      }
    }
    next();
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const sendEms = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  try {
    const { activePhone, email, phoneNumber } = req["user"];
    let { phone } = req.body;

    if (checkActivePhone(activePhone, res)) {
      res
        .status(401)
        .json({ code: 401, error: "Số điện thoại đã được xác nhận!" });
      return;
    }

    const checkExistingPhoneOk = await checkExistingPhone(
      phone,
      phoneNumber,
      res
    );
    if (checkExistingPhoneOk) {
      res
        .status(401)
        .json({ code: 401, error: "Số điện thoại đã được đăng ký!" });
      return;
    }

    const checkRateLimitOk = await checkRateLimit(email, res);
    if (checkRateLimitOk["status"]) {
      res.status(401).json({
        code: 401,
        error: `Bạn không được gửi quá nhanh vui lòng thử Lại sau ${
          180 - checkRateLimitOk["minutesDifference"]
        } giây!`,
      });
      return;
    }

    if (!phone) {
      res
        .status(401)
        .json({ code: 401, error: "Vui lòng nhập số điện thoại!" });
      return;
    }

    phone = "+84" + convertPhone(phone);

    if (!validatePhoneNumberInternational(phone)) {
      res.status(401).json({ code: 401, error: "Số điện thoại không hợp lệ!" });
      return;
    }

    req.body.phone = phone;
    next();
  } catch (error) {
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const verifyPassword = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  try {
    if (!req.body.password) {
      res.status(401).json({ code: 401, error: "Vui lòng nhập mật khẩu!" });
      return;
    }
    next();
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const verifyCodeSms = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  try {
    const code = req.body.code;

    const activePhone = req["user"]["activePhone"];
    if (activePhone) {
      res
        .status(401)
        .json({ code: 401, error: "Số điện thoại đã được xác nhận!" });
      return;
    }

    if (!code) {
      res.status(401).json({ code: 401, error: "Vui lòng nhập mã xác nhận!" });
      return;
    }

    if (code.length !== 6) {
      res
        .status(401)
        .json({ code: 401, error: "Mã xác nhận phải có 6 ký tự!" });
      return;
    }

    if (!req.body.phone) {
      res
        .status(401)
        .json({ code: 401, error: "Vui lòng nhập số điện thoại!" });
      return;
    }

    if (!validatePhoneNumber(req.body.phone)) {
      res.status(401).json({ code: 401, error: "Số điện thoại không hợp lệ!" });
      return;
    }

    next();
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
