const fs = require("fs");
const fetch = require("node-fetch");
const path = require("path");

const filePath = path.join(__dirname, "static_data", "cv33-1D1B21.png");

// Chuyển file PDF thành base64
const pdfToBase64 = (filePath) => {
  const pdfBuffer = fs.readFileSync(filePath);
  return pdfBuffer.toString("base64");
};

const fileBase64 = pdfToBase64(filePath);

const url = "https://resume-parsing-api2.p.rapidapi.com/processDocument";
const options = {
  method: "POST",
  headers: {
    "x-rapidapi-key": "2031a72107mshc740500a08bcc2cp1c20dfjsnbd1e2caba741",
    "x-rapidapi-host": "resume-parsing-api2.p.rapidapi.com",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    extractionDetails: {
      name: "Resume - Extraction",
      language: "English",
      fields: [
        { key: "fullName", description: "name of the person", type: "string" },
        { key: "email", description: "email of the person", type: "string" },
        { key: "phone", description: "phone of the person", type: "string" },
        { key: "address", description: "address of the person", type: "string" },
        {
          key: "position",
          description: "job position of the person",
          type: "string",
        },
        {
          key: "experiences",
          description: "work experience of the person",
          type: "array",
          items: {
            type: "object",
            properties: [
              { key: "position_name", type: "string" },
              { key: "start_date", type: "string" },
              { key: "end_date", type: "string" },
              { key: "company_name", type: "string" },
              { key: "description", type: "string" },
            ],
          },
        },
        
        {
          key: "educations",
          description: "school education of the person",
          type: "array",
          items: {
            type: "object",
            properties: [
              { key: "title", description: "study major of the people", type: "string" },
              { key: "start_date", type: "string" },
              { key: "end_date", type: "string" },
              { key: "school_name", type: "string" },
              { key: "description", type: "string" },
            ],
          },
        },
        {
          key: "languages",
          description: "languages spoken by the person",
          type: "array",
          items: { type: "string" },
        },
        {
          key: "skills",
          description: "skills of the person",
          type: "array",
          items: { type: "string" },
        },
        {
          key: "certificates",
          description: "certificates of the person",
          type: "array",
          items: { type: "string" },
        },
      ],
    },
    file: fileBase64, // Gửi file dưới dạng base64
  }),
};

const callRapidApi = async () => {
  try {
    const response = await fetch(url, options);
    const result = await response.json();
    console.log("Kết quả:", result);
  } catch (error) {
    console.error("Lỗi:", error);
  }
};

callRapidApi();
