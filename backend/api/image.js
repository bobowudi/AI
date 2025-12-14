/**
 * 魔塔 Z-Image-Turbo 图像生成 API 模块
 * 提供 AI 图像生成功能
 */

// 魔塔 Z-Image-Turbo 配置
export const IMAGE_CONFIG = {
  baseUrl: 'https://api-inference.modelscope.cn/v1/images/generations',
  apiKey: 'ms-ba6fc3a2-020a-479f-8196-531af11db279',  // ModelScope API Key
  model: 'Tongyi-MAI/Z-Image-Turbo'
};

// 支持的图片尺寸
export const SUPPORTED_SIZES = [
  '512x512',
  '768x768',
  '1024x1024',
  '1024x768',
  '768x1024'
];

/**
 * 生成图像
 * @param {string} prompt - 图像描述提示词
 * @param {object} options - 可选参数
 * @param {string} options.size - 图片尺寸 (默认 1024x1024)
 * @param {string} options.negativePrompt - 负面提示词
 * @param {number} options.n - 生成数量 (默认 1)
 * @returns {Promise<object>} - 包含图像 URL 的响应
 */
export async function generateImage(prompt, options = {}) {
  const {
    size = '1024x1024',
    negativePrompt = '',
    n = 1
  } = options;

  try {
    const response = await fetch(IMAGE_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${IMAGE_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: IMAGE_CONFIG.model,
        prompt: prompt,
        negative_prompt: negativePrompt,
        n: n,
        size: size
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('魔塔 API 错误:', errorText);
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 API 返回数据:', JSON.stringify(data, null, 2));
    // 从 API 响应中提取图像 URL
    const imageUrl = data.images && data.images[0] ? data.images[0].url : null;
    
    if (!imageUrl) {
      throw new Error('API 响应中未找到图像 URL');
    }

    return {
      success: true,
      imageUrl: imageUrl,
      prompt: prompt,
      size: size
    };
  } catch (error) {
    console.error('❌ 生成图像失败:', error.message);
    throw error;
  }
}

/**
 * 验证图片尺寸是否支持
 * @param {string} size - 图片尺寸
 * @returns {boolean}
 */
export function isValidSize(size) {
  return SUPPORTED_SIZES.includes(size);
}

export default {
  IMAGE_CONFIG,
  SUPPORTED_SIZES,
  generateImage,
  isValidSize
};
