/**
 * 豆包 (Doubao) 大模型 API 模块
 * 提供聊天和工具调用功能
 */

// 豆包 API 配置
export const DOUBAO_CONFIG = {
  baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  apiKey: 'Bearer 21ea5241-161a-4f24-9161-628bce42abd6',
  model: 'doubao-1-5-lite-32k-250115'
};

/**
 * 调用豆包模型（非流式，带工具调用）
 * @param {Array} messages - 对话历史消息数组
 * @param {Array} tools - 工具定义数组
 * @param {boolean} useTools - 是否使用工具
 * @returns {Promise<object>} - 完整响应
 */
export async function callDoubaoWithTools(messages, tools = [], useTools = true) {
  try {
    const requestBody = {
      model: DOUBAO_CONFIG.model,
      messages: messages,
      stream: false
    };
    
    if (useTools && tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = "auto";
    }

    const response = await fetch(DOUBAO_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': DOUBAO_CONFIG.apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('调用豆包模型时出错:', error.message);
    throw error;
  }
}

/**
 * 调用豆包模型（流式）
 * @param {Array} messages - 对话历史消息数组
 * @param {Function} onChunk - 接收每个文本片段的回调函数
 * @returns {Promise<void>}
 */
export async function callDoubaoStream(messages, onChunk) {
  try {
    const response = await fetch(DOUBAO_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': DOUBAO_CONFIG.apiKey
      },
      body: JSON.stringify({
        model: DOUBAO_CONFIG.model,
        messages: messages,
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
    }

    // 读取流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine === '') continue;
        if (trimmedLine === 'data: [DONE]') {
          return;
        }
        
        if (trimmedLine.startsWith('data: ')) {
          try {
            const jsonStr = trimmedLine.slice(6);
            const data = JSON.parse(jsonStr);
            const content = data.choices?.[0]?.delta?.content;
            
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            console.error('解析 SSE 数据失败:', e.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('调用豆包模型时出错:', error.message);
    throw error;
  }
}

export default {
  DOUBAO_CONFIG,
  callDoubaoWithTools,
  callDoubaoStream
};
