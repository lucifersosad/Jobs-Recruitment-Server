import { Request, Response } from "express";
import Admin from "../../../../models/admins.model";
import * as AdminInterface from "../../interfaces/admin.interface";
import { filterQueryStatus } from "../../../../helpers/filterQueryStatus.";
import { filterQuerySearch } from "../../../../helpers/filterQuerySearch";
import { filterQueryPagination } from "../../../../helpers/filterQueryPagination.";
import { encryptedData } from "../../../../helpers/encryptedData";
import md5 from "md5";
import { POPULATE } from "../../interfaces/populate.interface";
import Role from "../../../../models/roles.model";
import { generateRandomString } from "../../../../helpers/generateString";
// [GET] /api/v1/jobs/index/
//VD: //VD: {{BASE_URL}}/api/v1/admin?page=1&limit=7&sortKey=title&sortValue=asc&status=active&featured=true&salaryKey=gt&salaryValue=1000&jobLevel=Intern&occupationKey=software-development
export const index = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const find: AdminInterface.Find = {
      deleted: false,
    };

    //Khai báo các biến query
    let queryStatus: string = "";
    let querySortKey: string = "";
    let querySortValue: string = "";
    let queryPage: number = 1;
    let queryLimit: number = 20;
    let queryKeyword: string = "";

    //Check xem nếu query có status thì gán vào biến checkQueryStatus không thì gán bằng rỗng. (Chức Năng Check Trạng Thái)
    if (req.query.status) {
      queryStatus = req.query.status.toString() || "";
    }

    //Check xem nếu query có sortKey  thì gán vào biến sortKey không thì gán bằng title. (Chức Năng Sắp Xếp)
    if (req.query.sortKey) {
      querySortKey = req.query.sortKey.toString() || "title";
    }

    //Check xem nếu query có sortValue  thì gán vào biến sortValue không thì gán bằng desc. (Chức Năng Sắp Xếp)
    if (req.query.sortValue) {
      querySortValue = req.query.sortValue.toString() || "asc";
    }

    //Check xem nếu query có queryPage thì gán vào biến queryPage không thì gán bằng rỗng. (Chức Năng Phân Trang)
    if (req.query.page) {
      queryPage = parseInt(req.query.page.toString());
    }

    //Check xem nếu query có queryLimit thì gán vào biến queryLimit không thì gán bằng 1. (Chức Năng Phân Trang)
    if (req.query.limit) {
      queryLimit = parseInt(req.query.limit.toString());
    }

    //Check xem nếu query có queryKeyword thì gán vào biến queryKeyword không thì gán bằng rỗng. (Chức Tìm Kiếm)
    if (req.query.keyword) {
      queryKeyword = req.query.keyword.toString() || "";
    }

    if (req.query.findId) {
      find._id = req.query.findId.toString() || "";
    }

    //Trước khi gán status vào find thì kiểm tra query có hợp lệ hoặc tồn tại hay không. (Chức Năng Check Trạng Thái)
    if (queryStatus && filterQueryStatus(queryStatus)) {
      find.status = queryStatus;
    }

    //Trước khi gán title vào find thì kiểm tra query có hợp lệ hoặc tồn tại hay không. (Chức Năng Tìm Kiếm)
    if (queryKeyword && filterQuerySearch(queryKeyword)) {
      find.fullName = filterQuerySearch(queryKeyword);
    }

    //Đếm xem bảng record có bao nhiêu sản phẩm và check phân trang (Chức Năng Phân Trang)
    const countRecord = await Admin.countDocuments(find);

    //Làm phân trang (Chức Năng Phân Trang)
    const objectPagination = filterQueryPagination(
      countRecord,
      queryPage,
      queryLimit
    );

    //Tạo một object gán sortKey , sortValue tìm được vào  (Chức Năng Sắp Xếp)
    let sort = {};
    //Nếu tồn tại thì mới gán vào sort
    if (querySortKey && querySortValue) {
      sort = {
        [querySortKey]: querySortValue,
      };
    }

    const populateRole: POPULATE[] = [
      {
          path: "role_id",
          select: "title",
          model: Role
      },
  ];

    //Tìm tất cả các công việc.
    let records = [];
    if (req.query.findAll) {
      records = await Admin.find(find).sort(sort).select("-password -token").populate(populateRole);
    } else {
      records = await Admin.find(find)
        .sort(sort)
        .limit(objectPagination.limitItem || 4)
        .skip(objectPagination.skip || 0)
        .select("-password -phoneNumber -listApprovedUsers -email -token").populate(populateRole);
    }
    //Trả về công việc đó.
    res.status(200).json({ data: records, code: 200 });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/admin/admins/login
export const login = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    //Lấy email ,password người dùng gửi lên
    const email: string = req.body.email;
    const password: string = req.body.password;

    //Check xem trong databse có tồn tại email và mật khẩu có đúng hay không!
    const user = await Admin.findOne({
      email: email,
      password: md5(password),
      deleted: false
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
    res
      .status(200)
      .json({ success: "Đăng Nhập Thành Công!", token: token, code: 200 });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/admin/admins/authen
export const authen = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const token = req.body.token;
    //Tạo một mảng POPULATE có định dạng mặc định như dưới
    const populateCheck: POPULATE[] = [
      {
        path: "role_id",
        select: "title description permissions",
        model: Role,
      },
    ];
    //Check xem trong databse có tồn tại token và mật khẩu có đúng hay không!
    const userAdmin = await Admin.findOne({
      token: token,
    })
      .select("-password -token")
      .populate(populateCheck);
    const recordNew = {
      id: userAdmin._id,
      fullName: userAdmin.fullName,
      avatar: userAdmin.avatar,
      email: userAdmin.email,
      role_id: userAdmin.role_id["_id"],
      role_title: userAdmin.role_id["title"],
      role_description: userAdmin.role_id["description"],
      permissions: userAdmin.role_id["permissions"],
    };
    //Nếu không đúng thì return tài khoản mật khẩu ko đúng
    if (!userAdmin) {
      res.status(401).json({ error: "Xác Thực Thất Bại!" });
      return;
    }
    if (userAdmin.status !== "active") {
      res.status(401).json({ error: "Tài Khoản Đã Bị Khóa!" });
      return;
    }
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
// [POST] /api/v1/admin/admins/info
export const info = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    //Tạo một mảng POPULATE có định dạng mặc định như dưới
    const populateCheck: POPULATE[] = [
      {
        path: "role_id",
        select: "title description permissions",
        model: Role,
      },
    ];
    //Tìm kiếm tất cả người dùng
    const record = await Admin.find({
      deleted: false,
      status: "active",
    })
      .select("title email avatar role_id")
      .populate(populateCheck);
    const recordNew = [];
    //Tạo một mảng mới lấy cái title role
    record.forEach((item) => {
      recordNew.push({
        id: item._id,
        fullName: item.fullName,
        avatar: item.avatar,
        email: item.email,
        role_title: item.role_id["title"],
        role_description: item.role_id["description"],
        permissions: item.role_id["permissions"],
      });
    });

    //Mã hóa dữ liệu lại
    const dataEncrypted = encryptedData(recordNew);
    res.status(200).json({ data: dataEncrypted, code: 200 });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [POST] /api/v1/admin/admins/create
export const create = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const permissions = req["userAdmin"].permissions;
    if (!permissions.includes("accounts-create")) {
      res
        .status(401)
        .json({ error: "Bạn Không Có Quyền Thực Hiện Thao Tác Này!" });
      return;
    }
    // Lấy thông tin người dùng từ request và lưu vào object infoUser
    const infoUser: AdminInterface.Find = {
      address: req.body.address,
      fullName: req.body.fullName,
      gender: req.body.gender,
      password: md5(req.body.password),
      token: generateRandomString(30),
      phoneNumber: req.body.phoneNumber,
      email: req.body.email,
      role_id: req.body.role_id,
    };

    // Tạo mới một đối tượng Employer và lưu vào database
    const userEmployer = new Admin(infoUser);
    await userEmployer.save();

    res.status(201).json({
      code: 201,
      success: "Tạo Tài Khoản Quản Trị Viên Thành Công Thành Công!",
    });
  } catch (error) {
    // Log lỗi và trả về response lỗi
    console.error("Error in API:", error);
    res.status(500).json({ code: 500, error: "Internal Server Error" });
  }
};

// [PATCH] /api/v1/admin/admins/edit/:id
export const edit = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const permissions = req["userAdmin"].permissions;
    if (!permissions.includes("accounts-edit")) {
      res
        .status(401)
        .json({ error: "Bạn Không Có Quyền Thực Hiện Thao Tác Này!" });
      return;
    }

    //Lấy ra id công việc muốn chỉnh sửa
    const id: string = req.params.id.toString();

    const account = await Admin.findOne({
      _id: id,
    })
      .select("password")

    // Lấy thông tin người dùng từ request và lưu vào object infoUser
    const infoUser: AdminInterface.Find = {
      address: req.body.address,
      fullName: req.body.fullName,
      gender: req.body.gender,
      password: req.body.password ? md5(req.body.password) : account.password,
      phoneNumber: req.body.phoneNumber,
      role_id: req.body.role_id,
    };

    const updatedBy = {
      account_id: req["userAdmin"].id,
      email: req["userAdmin"].email,
      updatedAt: new Date(),
    };

    //Update công việc đó!
    await Admin.updateOne(
      { _id: id },
      { ...infoUser, $push: { updatedBy } }
    );

    res.status(200).json({
      code: 200,
      success: "Cập Nhật Tài Khoản Quản Trị Viên Thành Công Thành Công!",
    });
  } catch (error) {
    // Log lỗi và trả về response lỗi
    console.error("Error in API:", error);
    res.status(500).json({ code: 500, error: "Internal Server Error" });
  }
};

// [DELETE] /api/v1/admin/admins/delete/:id
export const deleteAdmin = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const permissions = req["userAdmin"].permissions;
    if (!permissions.includes("accounts-delete")) {
      res
        .status(401)
        .json({ error: "Bạn Không Có Quyền Thực Hiện Thao Tác Này!" });
      return;
    }
    //Lấy ra id công việc muốn xóa
    const id: string = req.params.id.toString();
    //Bắt đầu xóa mềm dữ liệu,nghĩa là không xóa hẳn dữ liệu ra khỏi database mà chỉ chỉnh trường deteled thành true thôi
    await Admin.updateOne(
      { _id: id },
      {
        deleted: true,
        deletedBy: {
          account_id: req["userAdmin"].id,
          deletedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      code: 200,
      success: "Xóa Tài Khoản Quản Trị Viên Thành Công Thành Công!",
    });
  } catch (error) {
    // Log lỗi và trả về response lỗi
    console.error("Error in API:", error);
    res.status(500).json({ code: 500, error: "Internal Server Error" });
  }
};

// [PATCH] /api/v1/admin/admins/change-status/:id
export const changeStatus = async function (req: Request, res: Response): Promise<void> {

  try {
      const permissions = req['userAdmin'].permissions
      if (!permissions.includes("accounts-edit")) {
          res.status(401).json({ error: "Bạn Không Có Quyền Thực Hiện Thao Tác Này!" });
          return;
      }
      //Lấy id của thông tin trên params
      const id: string = req.params.id.toString();
      const status: string = req.body.status.toString();

      const updatedBy = {
        account_id: req["userAdmin"].id,
        email: req["userAdmin"].email,
        updatedAt: new Date(),
      };

      //Nếu qua được validate sẽ vào đây rồi update dữ liệu
      await Admin.updateOne({
          _id: id
      }, {
          status: status,
          $push: { updatedBy } 
      })

      //Trả về cập nhật trạng thánh thành công
      res.status(200).json({ success: "Cập Nhật Trạng Thái Thành Công!", code: 200 });

  } catch (error) {
      //Thông báo lỗi 500 đến người dùng server lỗi.
      console.error("Error in API:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
}

// [PATCH] /api/v1/admin/admins/change-multi
export const changeMulti = async function (req: Request, res: Response): Promise<void> {

  try {
      const permissions = req['userAdmin'].permissions
      if (!permissions.includes("accounts-edit")) {
          res.status(401).json({ error: "Bạn Không Có Quyền Thực Hiện Thao Tác Này!" });
          return;
      }
      enum KEY {
          STATUS = "status",
          DELETED = "deleted",
      }

      let ids: string[];
      let key: string;
      let value: string;
      //Mình sẽ lấy các phần tử người dùng gửi lên
      if (!req.body.ids || !req.body.key) {
          res.status(400).json({ error: "Dữ Liệu Không Hợp Lệ!" });
          return;
      }
      if (req.body.ids) {
          ids = req.body.ids;
      }
      if (req.body.key) {
          key = req.body.key.toString();
      }
      if (req.body.value) {
          value = req.body.value.toString();
      }

      switch (key) {
          //Trường hợp này key bằng status
          case KEY.STATUS:
              //Nếu dữ liệu người dùng gửi lên không giống các trạng thái thì báo lỗi dữ liệu không hợp lệ
              if (!filterQueryStatus(value)) {
                  res.status(400).json({ error: "Dữ Liệu Không Hợp Lệ!", code: 400 });
                  return;
              }
              //Update dữ liệu người dùng
              await Admin.updateMany({ _id: { $in: ids } }, {
                  status: value
              });
              //Trả về cập nhật trạng thánh thành công
              res.status(200).json({ success: "Cập Nhật Trạng Thái Thành Công!", code: 200 });
              break;
          case KEY.DELETED:
              //Xóa mềm dữ liệu của cảng mảng ids người dùng gửi lên,ghĩa là không xóa hẳn dữ liệu ra khỏi database mà chỉ chỉnh trường deteled thành true thôi
              await Admin.updateMany({ _id: ids }, {
                  deleted: true,
                  deletedAt: new Date()
              })
              res.status(200).json({ success: "Xóa Dữ Liệu Thành Công!", code: 200 });
              break;
          default:
              //Trả về lỗi nếu không tồn tại key hợp lệ nào
              res.status(400).json({ error: "Yêu Cầu Không Hợp Lệ Hoặc Không Được Hỗ Trợ Vui Lòng Thử Lại!", code: 400 });
              break;
      }

  } catch (error) {
      //Thông báo lỗi 500 đến người dùng server lỗi.
      console.error("Error in API:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
}
