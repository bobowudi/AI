/**
 * ScreenshotOne 网页截图 API 模块
 * 提供网页截图功能
 */

// ScreenshotOne API 配置
export const SCREENSHOT_CONFIG = {
  baseUrl: 'https://api.screenshotone.com/take',
  accessKey: 'NqDe6aYuWBL_FA'  // 请替换为你的 ScreenshotOne Access Key
};

/**
 * 截取网页截图
 * @param {string} url - 要截图的网页 URL
 * @param {object} options - 可选参数
 * @param {string} options.format - 图片格式 (png/jpeg/webp)
 * @param {boolean} options.fullPage - 是否全页截图
 * @param {number} options.viewportWidth - 视口宽度
 * @param {number} options.viewportHeight - 视口高度
 * @param {number} options.delay - 截图前延迟(秒)
 * @returns {Promise<object>} - 包含截图 URL 的响应
 */
export async function captureScreenshot(url, options = {}) {
  const {
    format = 'png',
    fullPage = false,
    viewportWidth = 1920,
    viewportHeight = 1080,
    delay = 0
  } = options;

  try {
    console.log('📸 开始截取网页:', url);
    console.log('⚙️ 截图参数:', { format, fullPage, viewportWidth, viewportHeight, delay });

    // 构建请求参数
    const params = new URLSearchParams({
      url: url,
      access_key: SCREENSHOT_CONFIG.accessKey,
      format: format,
      full_page: fullPage.toString(),
      viewport_width: viewportWidth.toString(),
      viewport_height: viewportHeight.toString(),
      delay: delay.toString(),
      cache: 'false'  // 不使用缓存，确保每次都是最新截图
    });

    const apiUrl = `${SCREENSHOT_CONFIG.baseUrl}?${params.toString()}`;
    console.log('🔗 请求 URL:', apiUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ScreenshotOne API 错误:', errorText);
      throw new Error(`截图失败: ${response.status} - ${errorText}`);
    }

    // 获取图片数据
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
    
    console.log('✅ 网页截图成功');

    return {
      success: true,
      imageData: `data:${mimeType};base64,${base64Image}`,
      url: url,
      format: format,
      fullPage: fullPage,
      width: viewportWidth,
      height: viewportHeight
    };
  } catch (error) {
    console.error('❌ 截图失败:', error.message);
    throw error;
  }
}

/**
 * 验证 URL 格式
 * @param {string} url - 要验证的 URL
 * @returns {boolean}
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export default {
  SCREENSHOT_CONFIG,
  captureScreenshot,
  isValidUrl
};
