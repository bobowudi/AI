/**
 * 网页截图 API - 调用 ScreenshotOne
 */

const API_BASE = 'http://localhost:3000';

/**
 * 截取网页截图
 * @param {string} url - 要截图的网页 URL
 * @param {object} options - 可选参数
 * @returns {Promise<object>} - 返回包含截图数据的对象
 */
export async function captureScreenshot(url, options = {}) {
  try {
    const response = await fetch(`${API_BASE}/api/screenshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        format: options.format || 'png',
        fullPage: options.fullPage || false,
        viewportWidth: options.viewportWidth || 1920,
        viewportHeight: options.viewportHeight || 1080,
        delay: options.delay || 0
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '截图失败');
    }

    return {
      imageData: data.imageData,
      url: data.url,
      format: data.format,
      fullPage: data.fullPage,
      width: data.width,
      height: data.height
    };
  } catch (error) {
    console.error('截图失败:', error);
    throw error.message || '网络错误，请检查后端服务是否启动';
  }
}

/**
 * 支持的图片格式选项
 */
export const IMAGE_FORMATS = [
  { value: 'png', label: 'PNG (高质量)' },
  { value: 'jpeg', label: 'JPEG (小体积)' },
  { value: 'webp', label: 'WebP (现代格式)' }
];

/**
 * 预设的视口尺寸
 */
export const VIEWPORT_PRESETS = [
  { value: '1920x1080', label: '桌面 (1920×1080)', width: 1920, height: 1080 },
  { value: '1440x900', label: '笔记本 (1440×900)', width: 1440, height: 900 },
  { value: '1280x720', label: 'HD (1280×720)', width: 1280, height: 720 },
  { value: '768x1024', label: '平板 (768×1024)', width: 768, height: 1024 },
  { value: '375x812', label: 'iPhone (375×812)', width: 375, height: 812 },
  { value: '360x640', label: 'Android (360×640)', width: 360, height: 640 }
];
