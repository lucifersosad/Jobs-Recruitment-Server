import { Request, Response } from "express";
import Employer from "../../../../models/employers.model";
import * as EmployerInterface from "../../interfaces/empoloyer.interface";
import { filterQueryStatus } from "../../../../helpers/filterQueryStatus.";
import { filterQuerySearch } from "../../../../helpers/filterQuerySearch";
import { filterQueryPagination } from "../../../../helpers/filterQueryPagination.";
import { encryptedData } from "../../../../helpers/encryptedData";
import { off } from "process";
import Job from "../../../../models/jobs.model";
import { 
  getCachedEmployersCount, 
  setCachedEmployersCount 
} from "../../../../helpers/redisHelper";

// [GET] /api/v1/client/employers/index/
//VD: {{BASE_URL}}/api/v1/client/employers?page=1&limit=7&sortKey=companyName&sortValue=asc&status=active
export const index = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    //Khai báo biến find.
    //Đoạn or là lấy ra các id có trong trường createdBy hoặc nếu không có trong trường createdBy thì lấy ra trong mảng listUsser nếu có
    //Nói chung có nghĩa là lấy các user có quyền tham gia được task này
    const find: EmployerInterface.Find = {
      deleted: false,
    };

    //Khai báo các biến query
    let queryStatus: string = "";
    let querySortKey: string = "";
    let querySortValue: string = "";
    let queryPage: number = 1;
    let queryLimit: number = 6;
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

    //Trước khi gán status vào find thì kiểm tra query có hợp lệ hoặc tồn tại hay không. (Chức Năng Check Trạng Thái)
    if (queryStatus && filterQueryStatus(queryStatus)) {
      find.status = queryStatus;
    }

    //Trước khi gán title vào find thì kiểm tra query có hợp lệ hoặc tồn tại hay không. (Chức Năng Tìm Kiếm)
    if (queryKeyword && filterQuerySearch(queryKeyword)) {
      find.companyName = filterQuerySearch(queryKeyword);
    }

    //Đếm xem bảng record có bao nhiêu sản phẩm và check phân trang (Chức Năng Phân Trang)
    const countRecord = await Employer.countDocuments(find);

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

    //Tìm tất cả các công việc.
    const records = await Employer.find(find)
      .sort(sort)
      .limit(objectPagination.limitItem || 4)
      .skip(objectPagination.skip || 0)
      .select("-password -phoneNumber -listApprovedUsers -email -token");
    //Mã hóa dữ liệu khi gửi đi
    // const dataEncrypted = encryptedData(records);

    //Trả về công việc đó.
    res.status(200).json({ data: records, code: 200 });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const coutJobs = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Check cache first
    const cachedData = await getCachedEmployersCount();
    if (cachedData) {
      console.log("📦 Serving employers count from cache");
      res.status(200).json({ data: cachedData, code: 200 });
      return;
    }

    const find: EmployerInterface.Find = {
      deleted: false,
      status: "active",
    };
    //Lấy ra tất cả các công ty.
    const records = await Employer.find(find)
      .select("companyName image logoCompany slug")
      .sort({ companyName: 1 });

    //Tìm tất cả các công việc.
    const convertDataPromises = records.map(async (record) => {
      const countJob = await Job.countDocuments({ employerId: record._id });
      return {
        ...record.toObject(),
        ["countJobs"]: countJob,
      };
    });
    //Chạy promise all để chờ tất cả các promise chạy xong.Vì ở đây dùng map nên phải chờ tất cả các promise chạy xong.
    const convertData = await Promise.all(convertDataPromises);
    const dataEncrypted = encryptedData(convertData);
    
    // Cache the result
    await setCachedEmployersCount(dataEncrypted);
    console.log("💾 Cached employers count data");

    res.status(200).json({ data: dataEncrypted, code: 200 });
  } catch (error) {
    //Thông báo lỗi 500 đến người dùng server lỗi.
    console.error("Error in API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// [GET] /api/v1/client/employers/get-company/:slug
export const getCompany = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Bắt đầu khối try-catch để xử lý lỗi
    const { slug } = req.params; // Lấy giá trị slug từ params của yêu cầu
    const find: EmployerInterface.Find = {
      // Định nghĩa điều kiện tìm kiếm
      deleted: false, // Chỉ tìm những công ty chưa bị xóa
      slug, // Tìm công ty có slug tương ứng
    };
    // Tìm công ty đầu tiên thỏa mãn điều kiện, loại bỏ một số trường không cần thiết và chuyển kết quả về dạng plain JavaScript object
    const record = await Employer.findOne(find).select("-password -phoneNumber -listApprovedUsers -email -token ").lean();

    if (!record) {
      // Nếu không tìm thấy công ty thì trả về thông báo lỗi cho client với mã trạng thái 404
      res.status(200).json({ data: [], code: 200, employersWithJobCounts: [] });
      return;
    }
    // Lấy danh sách lĩnh vực hoạt động của công ty, nếu không có thì mặc định là mảng rỗng
    const activityFieldList = record?.activityFieldList ?? [];
    // Tìm các công ty khác trong cùng lĩnh vực, giới hạn kết quả là 6 công ty và sắp xếp theo tên công ty
    const findEmployersInIndustry = await Employer.find({
      activityFieldList: { $in: activityFieldList },
      _id: { $ne: record?._id },
    })
      .select("companyName image logoCompany slug")
      .sort({ companyName: 1 })
      .limit(6)
      .lean();

    // Đếm số lượng công việc của mỗi công ty trong danh sách
    const countJobsPromises = findEmployersInIndustry.map(async (item) => {
      const countJob = await Job.countDocuments({ employerId: item._id });
      return {
        ...item,
        countJobs: countJob,
      };
    });

    // Chờ tất cả các Promise hoàn thành và lấy kết quả
    const employersWithJobCounts = await Promise.all(countJobsPromises);

    // Mã hóa dữ liệu trước khi trả về
    const encryptedDataConvert = encryptedData(record);
    // Trả về dữ liệu cho client với mã trạng thái 200
    res
      .status(200)
      .json({ data: encryptedDataConvert, code: 200, employersWithJobCounts });
  } catch (error) {
    // Xử lý lỗi nếu có
    console.error("Error in API:", error); // In lỗi ra console
    // Trả về thông báo lỗi cho client với mã trạng thái 500
    res.status(500).json({ error: "Internal Server Error" });
  }
};
