/**
 * 图像生成 API - 调用魔塔 Z-Image-Turbo
 */

const API_BASE = 'http://localhost:3000';

/**
 * 生成图像
 * @param {string} prompt - 图像描述提示词
 * @param {string} size - 图片尺寸 (默认 1024x1024)
 * @param {string} negativePrompt - 负面提示词 (可选)
 * @returns {Promise<object>} - 返回包含 imageUrl 的对象
 */
export async function generateImage(prompt, size = '1024x1024', negativePrompt = '') {
  try {
    const response = await fetch(`${API_BASE}/api/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        size,
        negativePrompt
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '图像生成失败');
    }

    return {
      imageUrl: data.imageUrl,
      prompt: data.prompt,
      size: data.size
    };
  } catch (error) {
    console.error('生成图像失败:', error);
    throw error.message || '网络错误，请检查后端服务是否启动';
  }
}

/**
 * 支持的图片尺寸选项
 */
export const IMAGE_SIZES = [
  { value: '512x512', label: '512 × 512 (小)' },
  { value: '768x768', label: '768 × 768 (中)' },
  { value: '1024x1024', label: '1024 × 1024 (大)' },
  { value: '1024x768', label: '1024 × 768 (横向)' },
  { value: '768x1024', label: '768 × 1024 (纵向)' },
];
