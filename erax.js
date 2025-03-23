const fs = require("fs");
const fetch = require("node-fetch");
const path = require("path");

// API Endpoint
const API_OCR_URL = "https://api.erax.ai/api/v1/extract_image";
const RECALL_URL_TEMPLATE = (unique_id) => `https://api.erax.ai/api/v1/${unique_id}/recall`;

// Thông tin API
const API_KEY = "8587e79aafde59272af3092f18ee5ad75cde3631d06437383009601db6a95e44"; // Thay bằng API key của bạn
const MODEL_NAME = "erax-vl-plus-2b"; // Chọn model phù hợp

// Chuyển file PDF thành base64
const pdfToBase64 = (filePath) => {
  const pdfBuffer = fs.readFileSync(filePath);
  return pdfBuffer.toString("base64");
};

const custom_prompt = `
  Bạn là một hệ thống AI hàng đầu hỗ trợ nhận diện ký tự quang học (Optical Character Recognition - OCR) từ hình ảnh.  
  Bạn được cung cấp một ảnh CV ứng tuyển hợp lệ.  
  Nhiệm vụ của bạn là trích xuất chính xác các thông tin từ CV này và chuyển đổi chúng thành định dạng JSON như yêu cầu dưới đây.  

  ## Yêu cầu:  
  - Phải bảo đảm thông tin đầy đủ, có dấu tiếng Việt chính xác.  
  - Nếu CV có nhiều số điện thoại, email, chỉ chọn thông tin chính.  
  - Nếu có nhiều vị trí ứng tuyển, chỉ chọn vị trí đầu tiên.  
  - Nếu CV có mục tiêu nghề nghiệp, kinh nghiệm, kỹ năng, học vấn, phải trích xuất đầy đủ.  
  - Chỉ trích xuất thông tin từ nội dung CV, không thêm thông tin không có trong ảnh.  

  Trả lại kết quả OCR qua định dạng JSON như sau:  
  \`\`\`json
  {
    "Họ và tên": "Tên đầy đủ của ứng viên",
    "Số điện thoại": "Số điện thoại chính",
    "Email": "Email chính",
    "Địa chỉ": "Địa chỉ của ứng viên",
    "Vị trí ứng tuyển": "Vị trí công việc mà ứng viên ứng tuyển",
    "Mục tiêu nghề nghiệp": "Mô tả ngắn gọn về mục tiêu nghề nghiệp của ứng viên",
    "Kinh nghiệm": [
        {
            "Công ty": "Tên công ty đã làm việc",
            "Vị trí": "Chức danh đã đảm nhiệm",
            "Thời gian": "Thời gian làm việc",
            "Mô tả công việc": "Mô tả chi tiết về công việc đã thực hiện"
        }
    ],
    "Học vấn": [
        {
            "Trường": "Tên trường học",
            "Ngành học": "Ngành học của ứng viên",
            "Thời gian": "Thời gian học tập"
        }
    ],
    "Kỹ năng": ["Danh sách các kỹ năng nổi bật của ứng viên"],
    "Chứng chỉ": ["Danh sách chứng chỉ, văn bằng nếu có"],
    "Dự án": [
        {
            "Tên dự án": "Tên dự án đã tham gia",
            "Mô tả": "Mô tả ngắn gọn về dự án",
            "Vai trò": "Vai trò trong dự án",
            "Công nghệ": ["Danh sách công nghệ sử dụng"]
        }
    ]
  }
`;

// Gọi API EraX
const callEraX = async (pdfFiles, modelName = MODEL_NAME, timeout = 45000) => {
  const uniqueId = crypto.randomUUID();
  console.log("Unique ID:", uniqueId);

  const pdfBase64 = pdfFiles.map(pdfToBase64);

  const payload = {
    unique_id: uniqueId,
    model: modelName,
    prompt_type: "custom",
    prompt: custom_prompt,
    images: pdfBase64,
    // pdf_files: pdfBase64,
    generation_config: {
      temperature: 0.01,
      top_p: 0.2,
      min_p: 0,
      top_k: 10,
      max_tokens: 4096,
      repetition_penalty: 1.1
    }
  };

  try {
    const response = await fetch(API_OCR_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload),
      timeout
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const result = await response.json();
    if (result.status === "SUCCESS") return result.message;

    console.log("API response:", result);
    return null;
  } catch (error) {
    console.error("Initial request failed:", error.message);
    return await recallEraX(uniqueId);
  }
};

// Callback khi bị timeout
const recallEraX = async (uniqueId) => {
  const recallUrl = RECALL_URL_TEMPLATE(uniqueId);
  console.log("Switching to recall mode...");

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const response = await fetch(recallUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${API_KEY}` }
      });

      if (!response.ok) throw new Error(`Recall HTTP Error: ${response.status}`);

      const recallResult = await response.json();
      if (recallResult.status === "SUCCESS") return recallResult.message;

      if (recallResult.status !== "IN_QUEUE") {
        console.log("Callback error:", recallResult);
        return null;
      }
    } catch (error) {
      console.error("Recall request failed:", error.message);
      return null;
    }
  }
};

// Chạy API với file PDF từ local
// const filePath = path.join(__dirname, "static_data", "CV_TEST.jpg");
const filePath1 = path.join(__dirname, "static_data", "page-1.jpg");
const filePath2 = path.join(__dirname, "static_data", "page-2.jpg");
const filePath = [filePath1, filePath2]
callEraX(filePath).then((result) => {
  if (result) {
    console.log("Extracted Data:", result);
  } else {
    console.log("Đã có lỗi xảy ra, bạn sẽ không bị trừ tiền.");
  }
});
