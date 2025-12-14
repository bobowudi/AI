// 豆包 API 配置
const API_CONFIG = {
  baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  apiKey: 'Bearer 21ea5241-161a-4f24-9161-628bce42abd6',
  model: 'doubao-1-5-lite-32k-250115'
};

/**
 * 调用豆包模型
 * @param {string} message - 用户输入的消息
 * @returns {Promise<string>} - AI 的回复
 */
async function callDoubao(message) {
  try {
    const response = await fetch(API_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_CONFIG.apiKey
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // 提取 AI 的回复
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    } else {
      throw new Error('响应格式异常，未找到回复内容');
    }
  } catch (error) {
    console.error('调用豆包模型时出错:', error.message);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('正在调用豆包模型...\n');
  
  const userMessage = '你好';
  console.log(`用户: ${userMessage}`);
  
  try {
    const aiResponse = await callDoubao(userMessage);
    console.log(`\n豆包: ${aiResponse}`);
  } catch (error) {
    console.error('\n程序执行失败:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main();
