import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const evaluate = async (cvs) => {
  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: 'Bạn là chuyên viên tuyển dụng. Với mỗi file CV, hãy đọc nội dung và so sánh với mô tả công việc được cung cấp.\nTrả về JSON dạng:\n\n[\n  {\n    "id": ID CV ,\n    "score": số từ 0 đến 100 thể hiện độ phù hợp,\n    "reason": ["..."]\n  }\n]\n\nChỉ trả về JSON, không thêm văn bản khác.Chỉ trả về tiếng việt',
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Đây là mô tả công việc:\nVị trí tuyển dụng: Entity Data Management Associate\n\nMô tả công việc: Accountable for accuracy and completeness of entity data in Source, Salesforce and Oracle. Reviewing each request to create / update entity. Verifying required information using authorised sources. Researching to enrich entity records as required by EMS. Managing approvals process. Reviewing DQ dashboard and Duplicates dashboard and action as required. Providing reports and data extracts from source / core systems when required.\n\nYêu cầu công việc: Research skills to be able to find entity information/ data from authorised sources. Ability to perform repetitive tasks with a high degree of accuracy. Strong attention to detail. Strong problem solving skills. English proficient\n\nCấp bậc: Mới Tốt Nghiệp\n\nSố năm kinh nghiệm: Không yêu cầu\n\nKỹ năng: Research Ability, Data Management",
            },
          ],
        },
        {
          role: "user",
          content: cvs
        }
      ],
      text: {
        format: {
          type: "json_object",
        },
      },
      reasoning: {},
      tools: [],
      temperature: 0.3,
      max_output_tokens: 2048,
      top_p: 1,
      store: true,
    });
    return JSON.parse(response.output_text);
  } catch (error) {
    console.log("🚀 ~ test ~ error:", error);
    throw error
  }
};
