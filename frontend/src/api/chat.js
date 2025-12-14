/**
 * 发送聊天消息（流式，支持图表数据）
 * @param {Array} messages - 对话历史消息数组
 * @param {Function} onChunk - 接收每个文本片段的回调函数
 * @param {Function} onChart - 接收图表数据的回调函数
 * @returns {Promise<void>}
 */
export async function sendChatMessageStream(messages, onChunk, onChart = null) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 读取流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      // 解码数据块
      buffer += decoder.decode(value, { stream: true });
      
      // 按行分割
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
            
            if (data.error) {
              throw new Error(data.error);
            }
            
            // 检查是否是图表数据
            if (data.type === 'chart' && onChart) {
              onChart({
                chartOption: data.chartOption,
                description: data.description
              });
            } else if (data.content) {
              onChunk(data.content); // 调用回调函数
            }
          } catch (e) {
            console.error('解析数据失败:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    throw error.message || '网络错误';
  }
}
