<template>
  <div class="screenshot-container">
    <div class="screenshot-header">
      <h1>📸 网页截图</h1>
      <p>使用 ScreenshotOne 截取任意网页</p>
    </div>

    <div class="screenshot-content">
      <!-- 左侧：输入区域 -->
      <div class="input-section">
        <div class="input-group">
          <label>🔗 网页地址</label>
          <input
            v-model="targetUrl"
            type="url"
            placeholder="输入要截图的网页 URL，如：https://www.baidu.com"
            :disabled="isLoading"
          />
        </div>

        <div class="input-group">
          <label>📐 视口尺寸</label>
          <select v-model="selectedViewport" :disabled="isLoading" @change="onViewportChange">
            <option v-for="preset in VIEWPORT_PRESETS" :key="preset.value" :value="preset.value">
              {{ preset.label }}
            </option>
          </select>
        </div>

        <div class="input-row">
          <div class="input-group half">
            <label>宽度 (px)</label>
            <input
              v-model.number="viewportWidth"
              type="number"
              min="320"
              max="3840"
              :disabled="isLoading"
            />
          </div>
          <div class="input-group half">
            <label>高度 (px)</label>
            <input
              v-model.number="viewportHeight"
              type="number"
              min="320"
              max="3840"
              :disabled="isLoading"
            />
          </div>
        </div>

        <div class="input-group">
          <label>🖼️ 图片格式</label>
          <select v-model="selectedFormat" :disabled="isLoading">
            <option v-for="format in IMAGE_FORMATS" :key="format.value" :value="format.value">
              {{ format.label }}
            </option>
          </select>
        </div>

        <div class="input-group">
          <label>⏱️ 延迟截图 (秒)</label>
          <input
            v-model.number="delay"
            type="number"
            min="0"
            max="10"
            placeholder="等待页面加载的时间"
            :disabled="isLoading"
          />
        </div>

        <div class="checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="fullPage" :disabled="isLoading" />
            <span>📄 截取整个页面（长截图）</span>
          </label>
        </div>

        <button 
          @click="handleCapture" 
          :disabled="isLoading || !targetUrl.trim()"
          class="capture-button"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? '截图中...' : '📸 开始截图' }}
        </button>

        <div v-if="error" class="error-message">
          ❌ {{ error }}
        </div>
      </div>

      <!-- 右侧：结果展示区域 -->
      <div class="result-section">
        <div v-if="!screenshotResult && !isLoading" class="placeholder">
          <div class="placeholder-icon">🖥️</div>
          <p>截图结果将显示在这里</p>
        </div>

        <div v-if="isLoading" class="loading-placeholder">
          <div class="loading-animation">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
          <p>正在截取网页，请稍候...</p>
        </div>

        <div v-if="screenshotResult && !isLoading" class="screenshot-result">
          <img :src="screenshotResult.imageData" alt="网页截图" />
          <div class="screenshot-info">
            <p class="screenshot-url">🔗 {{ screenshotResult.url }}</p>
            <p class="screenshot-size">📐 {{ screenshotResult.width }} × {{ screenshotResult.height }}</p>
            <p class="screenshot-format">🖼️ {{ screenshotResult.format.toUpperCase() }}</p>
            <a 
              :href="screenshotResult.imageData" 
              :download="`screenshot.${screenshotResult.format}`"
              class="download-button"
            >
              ⬇️ 下载截图
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录 -->
    <div v-if="history.length > 0" class="history-section">
      <h3>📚 截图历史</h3>
      <div class="history-grid">
        <div 
          v-for="(item, index) in history" 
          :key="index" 
          class="history-item"
          @click="selectHistoryItem(item)"
        >
          <img :src="item.imageData" :alt="item.url" />
          <p class="history-url">{{ truncateUrl(item.url, 25) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { captureScreenshot, IMAGE_FORMATS, VIEWPORT_PRESETS } from '../api/screenshot';

const targetUrl = ref('');
const selectedViewport = ref('1920x1080');
const viewportWidth = ref(1920);
const viewportHeight = ref(1080);
const selectedFormat = ref('png');
const delay = ref(0);
const fullPage = ref(false);
const isLoading = ref(false);
const error = ref('');
const screenshotResult = ref(null);
const history = ref([]);

const onViewportChange = () => {
  const preset = VIEWPORT_PRESETS.find(p => p.value === selectedViewport.value);
  if (preset) {
    viewportWidth.value = preset.width;
    viewportHeight.value = preset.height;
  }
};

const handleCapture = async () => {
  if (!targetUrl.value.trim() || isLoading.value) return;

  // 自动补全 https://
  let url = targetUrl.value.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
    targetUrl.value = url;
  }

  isLoading.value = true;
  error.value = '';
  
  try {
    const result = await captureScreenshot(url, {
      format: selectedFormat.value,
      fullPage: fullPage.value,
      viewportWidth: viewportWidth.value,
      viewportHeight: viewportHeight.value,
      delay: delay.value
    });
    
    screenshotResult.value = result;
    
    // 添加到历史记录
    history.value.unshift(result);
    if (history.value.length > 6) {
      history.value.pop();
    }
    
  } catch (err) {
    error.value = err.toString();
    console.error('截图失败:', err);
  } finally {
    isLoading.value = false;
  }
};

const selectHistoryItem = (item) => {
  screenshotResult.value = item;
  targetUrl.value = item.url;
};

const truncateUrl = (url, maxLength) => {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
};
</script>

<style scoped>
.screenshot-container {
  width: 100%;
  max-width: 1200px;
  min-height: 90vh;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 30px;
  overflow: auto;
}

.screenshot-header {
  text-align: center;
  margin-bottom: 30px;
}

.screenshot-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
}

.screenshot-header p {
  color: #666;
  font-size: 14px;
}

.screenshot-content {
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

.input-group.half {
  flex: 1;
}

.input-row {
  display: flex;
  gap: 15px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.input-group input,
.input-group select {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
  font-family: inherit;
}

.input-group input:focus,
.input-group select:focus {
  border-color: #17a2b8;
  box-shadow: 0 0 0 3px rgba(23, 162, 184, 0.1);
}

.input-group select {
  cursor: pointer;
  background: white;
}

.checkbox-group {
  margin-bottom: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.capture-button {
  width: 100%;
  padding: 15px 30px;
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
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

.capture-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(23, 162, 184, 0.4);
}

.capture-button:disabled {
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
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
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

.screenshot-result {
  width: 100%;
}

.screenshot-result img {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

.screenshot-info {
  margin-top: 15px;
  padding: 15px;
  background: white;
  border-radius: 10px;
}

.screenshot-url {
  font-size: 14px;
  color: #555;
  margin-bottom: 8px;
  word-break: break-all;
}

.screenshot-size,
.screenshot-format {
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
}

.download-button {
  display: inline-block;
  padding: 10px 20px;
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
  margin-top: 5px;
}

.download-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 10px rgba(23, 162, 184, 0.3);
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

.history-item img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.history-url {
  padding: 8px;
  font-size: 11px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .screenshot-content {
    flex-direction: column;
  }
  
  .input-section,
  .result-section {
    min-width: auto;
  }
  
  .input-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
