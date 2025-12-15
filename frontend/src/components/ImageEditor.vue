<template>
  <div class="image-editor-container">
    <div class="editor-header">
      <h1>✏️ AI 图像编辑</h1>
      <p>使用 Qwen-Image-Edit 模型智能编辑图片</p>
    </div>

    <div class="editor-content">
      <!-- 左侧：输入区域 -->
      <div class="input-section">
        <!-- 图片输入方式选择 -->
        <div class="input-mode-tabs">
          <button 
            :class="['tab-button', { active: inputMode === 'url' }]"
            @click="inputMode = 'url'"
          >
            🔗 URL 链接
          </button>
          <button 
            :class="['tab-button', { active: inputMode === 'upload' }]"
            @click="inputMode = 'upload'"
          >
            📁 上传文件
          </button>
        </div>

        <!-- URL 输入模式 -->
        <div v-if="inputMode === 'url'" class="input-group">
          <label>🖼️ 图片 URL</label>
          <input
            v-model="imageUrl"
            type="text"
            placeholder="输入图片的公开 URL 链接，如 https://example.com/image.jpg"
            :disabled="isLoading"
            @input="handleUrlInput"
          />
          <p v-if="!isValidImageUrl && imageUrl" class="url-hint error">
            ⚠️ 请输入有效的 HTTP/HTTPS 链接
          </p>
          <p v-else class="url-hint">
            💡 支持公开可访问的图片链接，大小不超过 10MB
          </p>
        </div>

        <!-- 上传文件模式 -->
        <div v-if="inputMode === 'upload'" class="input-group">
          <label>📁 选择图片文件</label>
          <div class="file-upload-area" @click="triggerFileInput">
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="handleFileSelect"
              style="display: none"
            />
            <div v-if="!uploadedFile" class="upload-placeholder">
              <span class="upload-icon">📤</span>
              <p>点击选择图片或拖拽到此处</p>
              <p class="upload-hint">支持 JPG, PNG, BMP 等格式，最大 10MB</p>
            </div>
            <div v-else class="upload-preview">
              <img :src="uploadPreviewUrl" alt="预览" />
              <button @click.stop="clearUpload" class="clear-button">✕</button>
            </div>
          </div>
        </div>

        <!-- 编辑指令 -->
        <div class="input-group">
          <label>✏️ 编辑指令</label>
          <textarea
            v-model="editPrompt"
            placeholder="描述你想要如何编辑这张图片，例如：&#10;- 将文字颜色改为红色&#10;- 在左上角添加&#34;新品上市&#34;文字&#10;- 把背景改成蓝色&#10;- 移除图片中的水印"
            :disabled="isLoading"
            rows="4"
          ></textarea>
        </div>

        <!-- 负面提示词 -->
        <div class="input-group">
          <label>🚫 负面提示词 (可选)</label>
          <textarea
            v-model="negativePrompt"
            placeholder="描述你不想出现的内容，例如：模糊, 失真, 低质量"
            :disabled="isLoading"
            rows="2"
          ></textarea>
        </div>

        <!-- 高级选项 -->
        <details class="advanced-options">
          <summary>⚙️ 高级选项</summary>
          <div class="options-content">
            <div class="option-item">
              <label>推理步数: {{ steps }}</label>
              <input
                v-model.number="steps"
                type="range"
                min="20"
                max="100"
                step="10"
                :disabled="isLoading"
              />
              <span class="option-hint">步数越多质量越好，但速度越慢</span>
            </div>
            <div class="option-item">
              <label>引导系数: {{ cfgScale }}</label>
              <input
                v-model.number="cfgScale"
                type="range"
                min="1"
                max="10"
                step="0.5"
                :disabled="isLoading"
              />
              <span class="option-hint">控制编辑指令的影响强度</span>
            </div>
          </div>
        </details>

        <!-- 编辑按钮 -->
        <button 
          @click="handleEdit" 
          :disabled="isLoading || !canEdit"
          class="edit-button"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? '编辑中...' : '✨ 开始编辑' }}
        </button>

        <div v-if="error" class="error-message">
          ❌ {{ error }}
        </div>
      </div>

      <!-- 右侧：对比展示区域 -->
      <div class="result-section">
        <!-- 原图 -->
        <div class="image-panel">
          <h3>原图</h3>
          <div class="image-container">
            <div v-if="!currentOriginalImage" class="placeholder">
              <div class="placeholder-icon">🖼️</div>
              <p>原图将显示在这里</p>
            </div>
            <img v-else :src="currentOriginalImage" alt="原图" />
          </div>
        </div>

        <!-- 编辑后 -->
        <div class="image-panel">
          <h3>编辑后</h3>
          <div class="image-container">
            <div v-if="!editedImage && !isLoading" class="placeholder">
              <div class="placeholder-icon">✨</div>
              <p>编辑后的图片将显示在这里</p>
            </div>

            <div v-if="isLoading" class="loading-placeholder">
              <div class="loading-animation">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
              </div>
              <p>AI 正在编辑中，请稍候...</p>
              <p class="loading-time">预计需要 10-30 秒</p>
            </div>

            <div v-if="editedImage && !isLoading" class="edited-result">
              <img :src="editedImage.editedImageUrl" alt="编辑后" />
              <div class="result-actions">
                <a 
                  :href="editedImage.editedImageUrl" 
                  target="_blank" 
                  download
                  class="action-button"
                >
                  ⬇️ 下载
                </a>
                <button @click="saveToHistory" class="action-button">
                  💾 保存
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑历史 -->
    <div v-if="history.length > 0" class="history-section">
      <h3>📚 编辑历史</h3>
      <div class="history-grid">
        <div 
          v-for="(item, index) in history" 
          :key="index" 
          class="history-item"
          @click="loadHistoryItem(item)"
        >
          <div class="history-images">
            <img :src="item.originalImageUrl || item.editedImageUrl" :alt="item.prompt" />
            <div class="history-overlay">
              <span>点击查看</span>
            </div>
          </div>
          <p class="history-prompt">{{ truncateText(item.prompt, 40) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { editImageByUrl, editImageByBase64, fileToBase64, isValidUrl } from '../api/imageEdit';

// 输入模式
const inputMode = ref('url'); // 'url' 或 'upload'

// URL 模式
const imageUrl = ref('');
const isValidImageUrl = computed(() => {
  if (!imageUrl.value) return true;
  return isValidUrl(imageUrl.value);
});

// 上传模式
const fileInput = ref(null);
const uploadedFile = ref(null);
const uploadPreviewUrl = ref('');

// 编辑参数
const editPrompt = ref('');
const negativePrompt = ref('');
const steps = ref(50);
const cfgScale = ref(4.0);

// 状态
const isLoading = ref(false);
const error = ref('');
const editedImage = ref(null);
const currentOriginalImage = ref('');
const history = ref([]);

// 计算是否可以编辑
const canEdit = computed(() => {
  if (!editPrompt.value.trim()) return false;
  if (inputMode.value === 'url') {
    return imageUrl.value && isValidImageUrl.value;
  } else {
    return uploadedFile.value !== null;
  }
});

// URL 输入处理
const handleUrlInput = () => {
  if (isValidImageUrl.value && imageUrl.value) {
    currentOriginalImage.value = imageUrl.value;
  }
};

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click();
};

// 文件选择处理
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      error.value = '文件大小不能超过 10MB';
      return;
    }
    uploadedFile.value = file;
    uploadPreviewUrl.value = URL.createObjectURL(file);
    currentOriginalImage.value = uploadPreviewUrl.value;
    error.value = '';
  }
};

// 清除上传
const clearUpload = () => {
  uploadedFile.value = null;
  uploadPreviewUrl.value = '';
  currentOriginalImage.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// 执行编辑
const handleEdit = async () => {
  if (!canEdit.value || isLoading.value) return;

  isLoading.value = true;
  error.value = '';
  
  try {
    let result;
    
    if (inputMode.value === 'url') {
      // URL 模式
      result = await editImageByUrl(
        imageUrl.value,
        editPrompt.value.trim(),
        {
          negativePrompt: negativePrompt.value.trim(),
          steps: steps.value,
          cfgScale: cfgScale.value
        }
      );
      currentOriginalImage.value = result.originalImageUrl;
    } else {
      // 上传模式
      const base64 = await fileToBase64(uploadedFile.value);
      result = await editImageByBase64(
        base64,
        editPrompt.value.trim(),
        {
          negativePrompt: negativePrompt.value.trim(),
          steps: steps.value,
          cfgScale: cfgScale.value
        }
      );
    }
    
    editedImage.value = result;
    
  } catch (err) {
    error.value = err.message || '编辑失败，请稍后重试';
    console.error('编辑失败:', err);
  } finally {
    isLoading.value = false;
  }
};

// 保存到历史
const saveToHistory = () => {
  if (!editedImage.value) return;
  
  const historyItem = {
    ...editedImage.value,
    originalImageUrl: currentOriginalImage.value,
    timestamp: new Date().toISOString()
  };
  
  history.value.unshift(historyItem);
  if (history.value.length > 12) {
    history.value.pop();
  }
};

// 加载历史项
const loadHistoryItem = (item) => {
  editedImage.value = item;
  currentOriginalImage.value = item.originalImageUrl || item.editedImageUrl;
  editPrompt.value = item.prompt;
  
  if (item.originalImageUrl) {
    inputMode.value = 'url';
    imageUrl.value = item.originalImageUrl;
  }
};

// 文本截断
const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
</script>

<style scoped>
.image-editor-container {
  width: 100%;
  max-width: 1400px;
  min-height: 90vh;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 30px;
  overflow: auto;
}

.editor-header {
  text-align: center;
  margin-bottom: 30px;
}

.editor-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
}

.editor-header p {
  color: #666;
  font-size: 14px;
}

.editor-content {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
}

.input-section {
  flex: 1;
  min-width: 350px;
}

.result-section {
  flex: 2;
  display: flex;
  gap: 20px;
}

.image-panel {
  flex: 1;
  min-width: 300px;
}

.image-panel h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 10px;
  text-align: center;
}

.image-container {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 20px;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container img {
  max-width: 100%;
  max-height: 500px;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

/* 输入模式切换 */
.input-mode-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-button {
  flex: 1;
  padding: 12px;
  background: #f0f0f0;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.tab-button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.tab-button:hover:not(.active) {
  background: #e0e0e0;
}

/* 输入组 */
.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.input-group input[type="text"],
.input-group textarea {
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

.input-group input[type="text"]:focus,
.input-group textarea:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.url-hint {
  font-size: 12px;
  color: #888;
  margin-top: 5px;
}

.url-hint.error {
  color: #e74c3c;
}

/* 文件上传区域 */
.file-upload-area {
  border: 2px dashed #d0d0d0;
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-upload-area:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.upload-placeholder {
  text-align: center;
  color: #888;
}

.upload-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 10px;
}

.upload-hint {
  font-size: 12px;
  color: #aaa;
  margin-top: 5px;
}

.upload-preview {
  position: relative;
  width: 100%;
}

.upload-preview img {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 8px;
}

.clear-button {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 30px;
  height: 30px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.clear-button:hover {
  background: #c0392b;
  transform: scale(1.1);
}

/* 高级选项 */
.advanced-options {
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 15px;
}

.advanced-options summary {
  cursor: pointer;
  font-weight: 600;
  color: #333;
  user-select: none;
}

.options-content {
  margin-top: 15px;
}

.option-item {
  margin-bottom: 15px;
}

.option-item label {
  display: block;
  font-size: 13px;
  color: #555;
  margin-bottom: 5px;
}

.option-item input[type="range"] {
  width: 100%;
}

.option-hint {
  display: block;
  font-size: 11px;
  color: #999;
  margin-top: 3px;
}

/* 编辑按钮 */
.edit-button {
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

.edit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.edit-button:disabled {
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

/* 占位符 */
.placeholder,
.loading-placeholder {
  text-align: center;
  color: #999;
}

.placeholder-icon {
  font-size: 60px;
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

.loading-time {
  font-size: 12px;
  color: #aaa;
  margin-top: 5px;
}

/* 编辑结果 */
.edited-result {
  width: 100%;
}

.result-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  justify-content: center;
}

.action-button {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s;
  display: inline-block;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 10px rgba(102, 126, 234, 0.3);
}

/* 历史记录 */
.history-section {
  border-top: 1px solid #eee;
  padding-top: 25px;
  margin-top: 30px;
}

.history-section h3 {
  margin-bottom: 15px;
  color: #333;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
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

.history-images {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
}

.history-images img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.history-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: white;
  font-size: 14px;
}

.history-item:hover .history-overlay {
  opacity: 1;
}

.history-prompt {
  padding: 10px;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .editor-content {
    flex-direction: column;
  }
  
  .result-section {
    flex-direction: column;
  }
  
  .input-section,
  .image-panel {
    min-width: auto;
  }
}

@media (max-width: 768px) {
  .input-mode-tabs {
    flex-direction: column;
  }
  
  .history-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>
