import { Request, Response } from "express";
import Admin from "../../../../models/admins.model";
import filterRole from "../../../../helpers/filterRole";
import { filterQueryStatusAdmins } from "../../../../helpers/filterQueryStatus.";
//Hàm này kiểm tra Password
function validatePassword(password: string): boolean {
  // Ít nhất 6 ký tự
  if (password.length < 6) {
    return false;
  }
  // Mật khẩu hợp lệ nếu vượt qua tất cả các điều kiện
  return true;
}
//Hàm này kiểm tra Email
function validateEmail(email: string): boolean {
  // Biểu thức chính quy kiểm tra địa chỉ email
  const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Kiểm tra xem địa chỉ email đáp ứng biểu thức chính quy hay không
  return emailRegex.test(email);
}
function validatePhoneNumber(phone: string): boolean {
  // Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0
  const phoneRegex = /^0\d{9}$/;
  return phoneRegex.test(phone);
}

export const login = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  //Kiểm tra xem người dùng nhập email đúng hay không
  if (!validateEmail(req.body.email)) {
    res.status(401).json({ error: "Email Không Hợp Lệ" });
    return;
  }

  //Kiểm tra xem người dùng nhập email hay chưa
  if (!req.body.password) {
    res.status(401).json({ error: "Vui Lòng Nhập Mật Khẩu!" });
    return;
  }
  //Nếu thỏa mãn hết điều kiện thì cho next
  next();
};

export const authen = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  //Kiểm tra xem người dùng nhập email hay chưa
  if (!req.body.token) {
    res.status(401).json({ error: "Vui Lòng Nhập Token!" });
    return;
  }
  //Nếu thỏa mãn hết điều kiện thì cho next
  next();
};

export const create = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  //Check xem email có rỗng không
  if (!req.body.email) {
    res.status(401).json({ code: 401, error: "Vui Lòng Nhập Email!" });
    return;
  }
  //Kiểm tra xem người dùng nhập email đúng hay không
  if (!validateEmail(req.body.email)) {
    res.status(401).json({ code: 401, error: "Email Không Hợp Lệ" });
    return;
  }
  //Lọc email trong database
  const checkEmail = await Admin.findOne({
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
  //Check xem fullName có rỗng không
  if (!req.body.fullName) {
    res.status(401).json({ code: 401, error: "Vui Lòng Nhập Tên!" });
    return;
  }
  //Check xem role_id có rỗng không
  if (!req.body.role_id) {
    res.status(401).json({ code: 401, error: "Vui Lòng Nhập Vai Trò!" });
    return;
  }

  const validRole = await filterRole(req.body.role_id);
  //Check xem role_id có hợp lệ không
  if (!validRole) {
    res.status(401).json({ code: 401, error: "Vai Trò Không Hợp Lệ!" });
    return;
  }
  //Nếu thỏa mãn hết điều kiện thì cho next
  next();
};

export const edit = async function (
  req: Request,
  res: Response,
  next: any
): Promise<void> {
  //Kiểm tra xem fullName có hợp lệ không
  if (!req.body.fullName) {
    res.status(401).json({
      code: 401,
      error: "Họ tên không được để trống!",
    });
    return;
  }
  //Kiểm tra xem gender có hợp lệ không
  if (!req.body.gender) {
    res.status(401).json({
      code: 401,
      error: "Giới tính không được để trống!",
    });
    return;
  }
  //Kiểm tra xem password có hợp lệ không
  if (req.body.password && !validatePassword(req.body.password)) {
    res.status(401).json({
      code: 401,
      error: "Mật khẩu phải có độ dài từ 6 đến 25 ký tự!",
    });
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

  if (!req.body.role_id) {
    res.status(401).json({
      code: 401,
      error: "Vai trò không được để trống!",
    });
    return;
  }

  const validRole = await filterRole(req.body.role_id);
  if (!validRole) {
    res.status(401).json({ code: 401, error: "Vai Trò Không Hợp Lệ!" });
    return;
  }

  //Nếu thỏa mãn hết điều kiện thì cho next
  next();
};

export const editStatus = (req: Request, res: Response, next: any): void => {
  const status: string = req.body.status;
  //Nếu dữ liệu người dùng gửi lên là rỗng thì báo lỗi chưa có dữ liệu
  if (!status) {
    res
      .status(400)
      .json({ error: "Trạng Thái Không Được Để Trống!", code: 400 });
    return;
  }
  //Nếu dữ liệu người dùng gửi lên không giống các trạng thái thì báo lỗi dữ liệu không hợp lệ
  if (!filterQueryStatusAdmins(status)) {
    res.status(400).json({ error: "Trạng Thái Không Hợp Lệ!", code: 400 });
    return;
  }
  next();
};
