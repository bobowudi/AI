<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <nav class="nav-bar">
      <div class="nav-brand">
        <span class="brand-icon">🤖</span>
        <span class="brand-text">AI 助手</span>
      </div>
      <div class="nav-tabs">
        <button 
          :class="['nav-tab', { active: currentPage === 'chat' }]"
          @click="currentPage = 'chat'"
        >
          💬 智能对话
        </button>
        <button 
          :class="['nav-tab', { active: currentPage === 'image' }]"
          @click="currentPage = 'image'"
        >
          🎨 图像生成
        </button>
        <button 
          :class="['nav-tab', { active: currentPage === 'imageEdit' }]"
          @click="currentPage = 'imageEdit'"
        >
          ✏️ 图像编辑
        </button>
        <!-- <button 
          :class="['nav-tab', { active: currentPage === 'screenshot' }]"
          @click="currentPage = 'screenshot'"
        >
          📸 网页截图
        </button> -->
      </div>
    </nav>

    <!-- 页面内容 -->
    <main class="main-content">
      <ChatBox v-if="currentPage === 'chat'" />
      <ImageGenerator v-if="currentPage === 'image'" />
      <ImageEditor v-if="currentPage === 'imageEdit'" />
      <ScreenshotCapture v-if="currentPage === 'screenshot'" />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ChatBox from './components/ChatBox.vue'
import ImageGenerator from './components/ImageGenerator.vue'
import ImageEditor from './components/ImageEditor.vue'
import ScreenshotCapture from './components/ScreenshotCapture.vue'

const currentPage = ref('chat')
</script>

<style>
.app-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  font-size: 28px;
}

.brand-text {
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.nav-tabs {
  display: flex;
  gap: 10px;
}

.nav-tab {
  padding: 10px 25px;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.nav-tab:hover {
  background: rgba(255, 255, 255, 0.3);
}

.nav-tab.active {
  background: white;
  color: #667eea;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 响应式设计 */
@media (max-width: 600px) {
  .nav-bar {
    flex-direction: column;
    gap: 15px;
    padding: 15px;
  }
  
  .nav-tabs {
    width: 100%;
    justify-content: center;
  }
  
  .nav-tab {
    padding: 8px 18px;
    font-size: 13px;
  }
  
  .main-content {
    padding: 15px;
  }
}
</style>
