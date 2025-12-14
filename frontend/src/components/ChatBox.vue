<template>
  <div class="chat-container">
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="welcome-icon">🤖</div>
        <h2>欢迎使用豆包AI助手</h2>
        <p>我可以帮助您回答问题、提供建议或进行有趣的对话</p>
      </div>

      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['message', msg.role === 'user' ? 'user-message' : 'ai-message']"
      >
        <div class="message-avatar">
          {{ msg.role === 'user' ? '👤' : '🤖' }}
        </div>
        <div class="message-content">
          <!-- 文本消息 -->
          <div v-if="msg.type !== 'chart'" class="message-text">{{ msg.content }}</div>
          <!-- 图表消息 -->
          <div v-else class="message-chart">
            <ChartRenderer 
              v-if="msg.chartOption"
              :option="msg.chartOption"
              :description="msg.chartDescription"
            />
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="message ai-message loading-message">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input-container">
      <div class="input-wrapper">
        <input
          v-model="inputMessage"
          @keypress.enter="sendMessage"
          :disabled="isLoading"
          type="text"
          placeholder="输入消息..."
          class="chat-input"
        />
        <label class="upload-button" :class="{ disabled: isLoading }">
          📎
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls,.csv"
            @change="handleFileUpload"
            :disabled="isLoading"
            style="display: none"
          />
        </label>
        <button
          @click="sendMessage"
          :disabled="isLoading || !inputMessage.trim()"
          class="send-button"
        >
          <span v-if="!isLoading">发送</span>
          <span v-else>...</span>
        </button>
      </div>
      <div v-if="uploadedFileName" class="file-info">
        📄 已选择: {{ uploadedFileName }}
        <button @click="clearFile" class="remove-file">✕</button>
      </div>
      <button @click="clearChat" class="clear-button" :disabled="messages.length === 0">
        清空对话
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { sendChatMessageStream } from '../api/chat';
import { uploadExcel } from '../api/upload';
import ChartRenderer from './ChartRenderer.vue';

const messages = ref([]);
const inputMessage = ref('');
const isLoading = ref(false);
const messagesContainer = ref(null);
const fileInput = ref(null);
const uploadedFileName = ref('');
const excelData = ref('');

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};
// 请输出一篇关于你自己的自我介绍，要求800字
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  uploadedFileName.value = file.name;
  isLoading.value = true;

  try {
    // 调用后端API上传并分析Excel
    const result = await uploadExcel(file);
    
    // 使用后端返回的智能摘要
    const textData = result.summary + '\n\n请帮我分析这个Excel文件的数据，给出专业的见解和建议。';
    
    excelData.value = textData;
    inputMessage.value = textData;
    
    console.log('Excel分析结果:', result);
    
  } catch (error) {
    console.error('上传Excel文件失败:', error);
    alert(`上传失败: ${error}`);
    clearFile();
  } finally {
    isLoading.value = false;
  }
};

const clearFile = () => {
  uploadedFileName.value = '';
  excelData.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  if (inputMessage.value === excelData.value) {
    inputMessage.value = '';
  }
};

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return;

  const userMessage = inputMessage.value.trim();
  
  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: userMessage
  });

  inputMessage.value = '';
  clearFile();
  scrollToBottom();

  // 添加一个空的AI消息，用于流式更新
  const aiMessageIndex = messages.value.length;
  messages.value.push({
    role: 'assistant',
    content: '',
    type: 'text',  // 默认是文本类型
    chartOption: null,
    chartDescription: ''
  });

  // 开始加载
  isLoading.value = true;

  try {
    // 调用流式API，支持图表回调
    await sendChatMessageStream(
      messages.value.slice(0, -1), 
      // 文本片段回调
      (chunk) => {
        messages.value[aiMessageIndex].content += chunk;
        scrollToBottom();
      },
      // 图表数据回调
      (chartData) => {
        console.log('收到图表数据:', chartData);
        messages.value[aiMessageIndex].type = 'chart';
        messages.value[aiMessageIndex].chartOption = chartData.chartOption;
        messages.value[aiMessageIndex].chartDescription = chartData.description;
        messages.value[aiMessageIndex].content = '📊 图表已生成';
        scrollToBottom();
      }
    );
    
  } catch (error) {
    console.error('发送消息失败:', error);
    
    // 更新错误消息
    messages.value[aiMessageIndex].content = `❌ 抱歉，出现了错误: ${error}`;
    scrollToBottom();
  } finally {
    isLoading.value = false;
  }
};

const clearChat = () => {
  if (confirm('确定要清空对话记录吗？')) {
    messages.value = [];
    clearFile();
  }
};
</script>

<style scoped>
.chat-container {
  width: 100%;
  max-width: 900px;
  height: 90vh;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  text-align: center;
}

.chat-header h1 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 600;
}

.chat-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
  background: #f8f9fa;
}

.welcome-message {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.welcome-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.welcome-message h2 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #495057;
}

.welcome-message p {
  font-size: 16px;
  opacity: 0.8;
}

.message {
  display: flex;
  margin-bottom: 20px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-content {
  max-width: 70%;
  margin: 0 15px;
}

.message-text {
  background: white;
  padding: 15px 20px;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  line-height: 1.6;
  word-wrap: break-word;
}

.user-message {
  flex-direction: row-reverse;
}

.user-message .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.ai-message .message-text {
  background: white;
  color: #333;
}

.message-chart {
  min-width: 400px;
  max-width: 100%;
}

.typing-indicator {
  display: flex;
  gap: 6px;
  padding: 15px 20px;
  background: white;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #667eea;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.chat-input-container {
  padding: 20px 30px;
  background: white;
  border-top: 1px solid #e9ecef;
}

.input-wrapper {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.chat-input {
  flex: 1;
  padding: 15px 20px;
  border: 2px solid #e9ecef;
  border-radius: 25px;
  font-size: 15px;
  outline: none;
  transition: all 0.3s;
  max-height: 150px;
  overflow-y: auto;
  resize: vertical;
}

.chat-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.chat-input:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.send-button {
  padding: 15px 35px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-button {
  width: 100%;
  padding: 10px;
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
  border-radius: 15px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.clear-button:hover:not(:disabled) {
  background: #e9ecef;
  color: #495057;
}

.clear-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-button {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
}

.upload-button:hover:not(.disabled) {
  background: #e9ecef;
  border-color: #667eea;
  transform: translateY(-2px);
}

.upload-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  background: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-radius: 10px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #0066cc;
}

.remove-file {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 18px;
  padding: 0 5px;
  transition: color 0.3s;
}

.remove-file:hover {
  color: #ff4444;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
