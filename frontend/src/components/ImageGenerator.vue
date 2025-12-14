<template>
  <div class="image-generator-container">
    <div class="generator-header">
      <h1>🎨 AI 图像生成</h1>
      <p>使用 Z-Image-Turbo 模型生成高质量图像</p>
    </div>

    <div class="generator-content">
      <!-- 左侧：输入区域 -->
      <div class="input-section">
        <div class="input-group">
          <label>✏️ 图像描述 (Prompt)</label>
          <textarea
            v-model="prompt"
            placeholder="描述你想要生成的图像，例如：一只可爱的橘猫在阳光下打盹，柔和的光线，高清摄影风格"
            :disabled="isLoading"
            rows="4"
          ></textarea>
        </div>

        <div class="input-group">
          <label>🚫 负面提示词 (可选)</label>
          <textarea
            v-model="negativePrompt"
            placeholder="描述你不想出现的内容，例如：模糊, 低质量, 变形"
            :disabled="isLoading"
            rows="2"
          ></textarea>
        </div>

        <div class="input-group">
          <label>📐 图片尺寸</label>
          <select v-model="selectedSize" :disabled="isLoading">
            <option v-for="size in IMAGE_SIZES" :key="size.value" :value="size.value">
              {{ size.label }}
            </option>
          </select>
        </div>

        <button 
          @click="handleGenerate" 
          :disabled="isLoading || !prompt.trim()"
          class="generate-button"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? '生成中...' : '✨ 生成图像' }}
        </button>

        <div v-if="error" class="error-message">
          ❌ {{ error }}
        </div>
      </div>

      <!-- 右侧：结果展示区域 -->
      <div class="result-section">
        <div v-if="!generatedImage && !isLoading" class="placeholder">
          <div class="placeholder-icon">🖼️</div>
          <p>生成的图像将显示在这里</p>
        </div>

        <div v-if="isLoading" class="loading-placeholder">
          <div class="loading-animation">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
          <p>AI 正在创作中，请稍候...</p>
        </div>

        <div v-if="generatedImage && !isLoading" class="image-result">
          <img :src="generatedImage.imageUrl" alt="AI 生成的图像" />
          <div class="image-info">
            <p class="image-prompt">📝 {{ generatedImage.prompt }}</p>
            <p class="image-size">📐 {{ generatedImage.size }}</p>
            <a 
              :href="generatedImage.imageUrl" 
              target="_blank" 
              download
              class="download-button"
            >
              ⬇️ 下载图片
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录 -->
    <div v-if="history.length > 0" class="history-section">
      <h3>📚 生成历史</h3>
      <div class="history-grid">
        <div 
          v-for="(item, index) in history" 
          :key="index" 
          class="history-item"
          @click="selectHistoryItem(item)"
        >
          <img :src="item.imageUrl" :alt="item.prompt" />
          <p class="history-prompt">{{ truncateText(item.prompt, 30) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { generateImage, IMAGE_SIZES } from '../api/image';

const prompt = ref('');
const negativePrompt = ref('');
const selectedSize = ref('1024x1024');
const isLoading = ref(false);
const error = ref('');
const generatedImage = ref(null);
const history = ref([]);

const handleGenerate = async () => {
  if (!prompt.value.trim() || isLoading.value) return;

  isLoading.value = true;
  error.value = '';
  
  try {
    const result = await generateImage(
      prompt.value.trim(),
      selectedSize.value,
      negativePrompt.value.trim()
    );
    
    generatedImage.value = result;
    
    // 添加到历史记录
    history.value.unshift(result);
    if (history.value.length > 10) {
      history.value.pop();
    }
    
  } catch (err) {
    error.value = err.toString();
    console.error('生成失败:', err);
  } finally {
    isLoading.value = false;
  }
};

const selectHistoryItem = (item) => {
  generatedImage.value = item;
  prompt.value = item.prompt;
  selectedSize.value = item.size;
};

const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
</script>

<style scoped>
.image-generator-container {
  width: 100%;
  max-width: 1200px;
  min-height: 90vh;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 30px;
  overflow: auto;
}

.generator-header {
  text-align: center;
  margin-bottom: 30px;
}

.generator-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
}

.generator-header p {
  color: #666;
  font-size: 14px;
}

.generator-content {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
}

.input-section {
  flex: 1;
  min-width: 300px;
}

.result-section {
  flex: 1.5;
  min-width: 400px;
  background: #f8f9fa;
  border-radius: 15px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.input-group textarea,
.input-group select {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
  font-family: inherit;
  resize: vertical;
}

.input-group textarea:focus,
.input-group select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-group select {
  cursor: pointer;
  background: white;
}

.generate-button {
  width: 100%;
  padding: 15px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.generate-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.generate-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  margin-top: 15px;
  padding: 12px 15px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 10px;
  color: #c00;
  font-size: 14px;
}

.placeholder,
.loading-placeholder {
  text-align: center;
  color: #999;
}

.placeholder-icon {
  font-size: 80px;
  margin-bottom: 15px;
}

.loading-animation {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.loading-animation .dot {
  width: 15px;
  height: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.loading-animation .dot:nth-child(1) { animation-delay: 0s; }
.loading-animation .dot:nth-child(2) { animation-delay: 0.2s; }
.loading-animation .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-15px); }
}

.image-result {
  width: 100%;
}

.image-result img {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

.image-info {
  margin-top: 15px;
  padding: 15px;
  background: white;
  border-radius: 10px;
}

.image-prompt {
  font-size: 14px;
  color: #555;
  margin-bottom: 8px;
  word-break: break-word;
}

.image-size {
  font-size: 13px;
  color: #888;
  margin-bottom: 12px;
}

.download-button {
  display: inline-block;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
}

.download-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 10px rgba(102, 126, 234, 0.3);
}

.history-section {
  border-top: 1px solid #eee;
  padding-top: 25px;
}

.history-section h3 {
  margin-bottom: 15px;
  color: #333;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.history-item {
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s;
  background: #f8f9fa;
}

.history-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.history-item img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.history-prompt {
  padding: 8px;
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .generator-content {
    flex-direction: column;
  }
  
  .input-section,
  .result-section {
    min-width: auto;
  }
}
</style>
