
import { Request, Response } from "express";
import Admin from "../../../../models/admins.model";
import md5 from "md5"
import { encryptedData } from "../../../../helpers/encryptedData";
import { POPULATE } from "../../interfaces/populate.interface";
import Role from "../../../../models/roles.model";
// [GET] /api/v1/jobs/index/
//VD: //VD: {{BASE_URL}}/api/v1/admin?page=1&limit=7&sortKey=title&sortValue=asc&status=active&featured=true&salaryKey=gt&salaryValue=1000&jobLevel=Intern&occupationKey=software-development
export const index = async function (req: Request, res: Response): Promise<void> {
    try {
        //Khai báo biến find.

        res.status(200).json({ data: "ok", code: 200 });
    } catch (error) {
        //Thông báo lỗi 500 đến người dùng server lỗi.
        console.error("Error in API:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// [POST] /api/v1/admin/admins/login
export const login = async function (req: Request, res: Response): Promise<void> {
    try {
        //Lấy email ,password người dùng gửi lên
        const email: string = req.body.email;
        console.log("🚀 ~ login ~ email:", email)
        const password: string = req.body.password;

        //Check xem trong databse có tồn tại email và mật khẩu có đúng hay không!
        const user = await Admin.findOne({
            email: email,
            password: md5(password),
        }).select("-password");

        //Nếu không đúng thì return tài khoản mật khẩu ko đúng
        if (!user) {
            res.status(401).json({ error: "Tài Khoản Hoặc Mật Khẩu Không Đúng!" });
            return;
        }
        if (user.status !== "active") {
            res.status(401).json({ error: "Tài Khoản Đã Bị Khóa!!" });
            return;
        }
        //Lấy ra token lưu vào cookie
        const token: string = user.token;
        res.status(200).json({ success: "Đăng Nhập Thành Công!", token: token, code: 200 });
    } catch (error) {
        //Thông báo lỗi 500 đến người dùng server lỗi.
        console.error("Error in API:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }

}

// [POST] /api/v1/admin/admins/authen
export const authen = async function (req: Request, res: Response): Promise<void> {
    try {
        const token = req.body.token;
        //Tạo một mảng POPULATE có định dạng mặc định như dưới 
        const populateCheck: POPULATE[] = [
            {
                path: "role_id",
                select: "title description permissions",
                model: Role
            },
        ];
        //Check xem trong databse có tồn tại token và mật khẩu có đúng hay không!
        const userAdmin = await Admin.findOne({
            token: token,
        }).select("-password -token").populate(populateCheck);
        const recordNew = {
            id: userAdmin._id,
            title: userAdmin.title,
            avatar: userAdmin.avatar,
            email: userAdmin.email,
            role_id: userAdmin.role_id["_id"],
            role_title: userAdmin.role_id["title"],
            role_description: userAdmin.role_id["description"],
            permissions: userAdmin.role_id["permissions"],
        }
        //Nếu không đúng thì return tài khoản mật khẩu ko đúng
        if (!userAdmin) {
            res.status(401).json({ error: "Xác Thực Thất Bại!" });
            return;
        }
        if (userAdmin.status !== "active") {
            res.status(401).json({ error: "Tài Khoản Đã Bị Khóa!" });
            return;
        }
        res.status(200).json({ success: "Xác Thự Thành Công!", token: token, code: 200, infoUser: recordNew });
    } catch (error) {
        //Thông báo lỗi 500 đến người dùng server lỗi.
        console.error("Error in API:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }

}
// [POST] /api/v1/admin/admins/info
export const info = async function (req: Request, res: Response): Promise<void> {
    try {
        //Tạo một mảng POPULATE có định dạng mặc định như dưới 
        const populateCheck: POPULATE[] = [
            {
                path: "role_id",
                select: "title description permissions",
                model: Role
            },

        ];
        //Tìm kiếm tất cả người dùng
        const record = await Admin.find({
            deleted: false,
            status: "active"
        }).select("title email avatar role_id").populate(populateCheck);
        const recordNew = []
        //Tạo một mảng mới lấy cái title role
        record.forEach((item) => {
            recordNew.push({
                id: item._id,
                title: item.title,
                avatar: item.avatar,
                email: item.email,
                role_title: item.role_id["title"],
                role_description: item.role_id["description"],
                permissions: item.role_id["permissions"],
            })
        })

        //Mã hóa dữ liệu lại
        const dataEncrypted = encryptedData(recordNew)
        res.status(200).json({ data: dataEncrypted, code: 200 });
    } catch (error) {
        //Thông báo lỗi 500 đến người dùng server lỗi.
        console.error("Error in API:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}