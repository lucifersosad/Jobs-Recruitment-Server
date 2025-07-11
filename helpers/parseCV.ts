import fetch from 'node-fetch'

export const callRapidApi = async (fileBuffer) => {

  // const fileBase64 = fileBuffer.toString("base64");

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
            description: "job title of the person",
            type: "string",
          },
          {
            key: "objective",
            description: "job objective of the person",
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
            key: "certifications",
            description: "certificates of the person",
            type: "array",
            items: {
              type: "object",
              properties: [
                { key: "date", type: "string" },
                { key: "title", description: "certification name", type: "string" },
              ],
            },
          },
          {
            key: "awards",
            description: "awards of the person",
            type: "array",
            items: {
              type: "object",
              properties: [
                { key: "date", type: "string" },
                { key: "title", description: "award name", type: "string" },
              ],
            },
          },
          {
            key: "activities",
            description: "activities that the person took part in",
            type: "array",
            items: {
              type: "object",
              properties: [
                { key: "position_name", description: "role of the people in activity", type: "string" },
                { key: "group_name", type: "string" },
                { key: "start_date", type: "string" },
                { key: "end_date", type: "string" },
                { key: "description", type: "string" },
              ],
            },
          },
        ],
      },
      file: fileBuffer, // Gửi file dưới dạng base64
    }),
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Lỗi:", error);
  }
};
