const OpenAI = require("openai");
require("dotenv").config();

// 初始化OpenAI客户端，连接到豆包AI
const openai = new OpenAI({
  apiKey: process.env.ARK_API_KEY,
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
});

/**
 * 调用豆包AI进行文本处理
 * @param {string} userContent - 用户输入的文本内容
 * @param {string} systemPrompt - 系统提示词，定义AI的行为
 * @param {string} modelId - 模型ID
 * @param {boolean} isStream - 是否使用流式响应
 * @returns {Promise<string|ReadableStream>} - 处理后的文本或流
 */
async function processText(
  userContent,
  systemPrompt = "你是一名专业的文本润色专家，现在需要你对接下来的文本进行旅游日记类型的润色，并保留原文的意思。",
  modelId = "ep-20250513000008-6hjfc", // 修改为豆包AI支持的模型ID
  isStream = true
) {
  try {
    // 构建请求参数
    const requestParams = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      model: modelId,
    };

    // 根据是否需要流式响应选择不同的处理方式
    if (isStream) {
      requestParams.stream = true;
      return await openai.chat.completions.create(requestParams);
    } else {
      const completion = await openai.chat.completions.create(requestParams);
      return completion.choices[0]?.message?.content || "";
    }
  } catch (error) {
    console.error("调用豆包AI失败:", error);
    throw error;
  }
}

module.exports = { processText };
