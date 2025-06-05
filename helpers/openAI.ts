import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
  Bạn là một chuyên gia tuyển dụng AI. 
  Hãy đánh giá mức độ phù hợp giữa một CV và mô tả công việc được cung cấp, sau đó đưa ra gợi ý cải thiện CV để nâng cao khả năng ứng tuyển thành công. 
  Trả về kết quả dưới dạng JSON với cấu trúc sau:

  {
    "overview": {
      "score": [0-100],
      "summary": ["..."],
      "rankingScore": "Cao | Trung bình | Thấp"
    },
    "evaluation": {
      "skill": {
        "score": [0-100],
        "matched": ["..."],
        "unmatched": ["..."],
        "suggestions": ["..."]
      },
      "experience": {
        "score": [0-100],
        "matched": ["..."],
        "unmatched": ["..."],
        "suggestions": ["..."]
      },
      "jobTitle": {
        "score": [0-100],
        "matched": ["..."],
        "unmatched": ["..."],
        "suggestions": ["..."]
      },
      "education": {
        "score": [0-100],
        "matched": ["..."],
        "unmatched": ["..."],
        "suggestions": ["..."]
      }
    }
  }

  Luôn trả lời bằng tiếng Việt. Chỉ trả về JSON hợp lệ.
`

export const evaluate = async (jdText, fileCv) => {
  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: SYSTEM_PROMPT,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Mô tả công việc: ${jdText}`,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "CV: "
            },
            {
              type: "input_file",
              file_data: fileCv.file_data,
              filename: fileCv.filename
            }
          ]
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

export const getEmbedding = async (text) => {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
    encoding_format: "float",
  });

  console.log("🚀 ~ getEmbedding ~ embedding:", embedding)
  return embedding.data[0].embedding
}

