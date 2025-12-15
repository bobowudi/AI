/**
 * 图像编辑 API - 调用魔塔 Qwen-Image-Edit
 */

const API_BASE = 'http://localhost:3000';

/**
 * 通过 URL 编辑图像
 * @param {string} imageUrl - 图片的公开 URL 链接
 * @param {string} prompt - 编辑指令
 * @param {object} options - 可选参数
 * @param {string} options.negativePrompt - 负面提示词
 * @param {number} options.steps - 推理步数 (默认 50)
 * @param {number} options.cfgScale - 引导系数 (默认 4.0)
 * @param {number} options.seed - 随机种子 (-1 为随机)
 * @returns {Promise<object>} - 返回包含编辑后图像的对象
 */
export async function editImageByUrl(imageUrl, prompt, options = {}) {
  try {
    const {
      negativePrompt = '',
      steps = 50,
      cfgScale = 4.0,
      seed = -1
    } = options;

    const response = await fetch(`${API_BASE}/api/edit-image-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        prompt,
        negativePrompt,
        steps,
        cfgScale,
        seed
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '图像编辑失败');
    }

    return {
      originalImageUrl: data.originalImageUrl,
      editedImageUrl: data.editedImageUrl,
      prompt: data.prompt,
      options: data.options
    };
  } catch (error) {
    console.error('编辑图像失败:', error);
    throw error;
  }
}

/**
 * 通过 Base64 编辑图像
 * @param {string} base64Image - Base64 编码的图片
 * @param {string} prompt - 编辑指令
 * @param {object} options - 可选参数
 * @returns {Promise<object>} - 返回包含编辑后图像的对象
 */
export async function editImageByBase64(base64Image, prompt, options = {}) {
  try {
    const {
      negativePrompt = '',
      steps = 50,
      cfgScale = 4.0,
      seed = -1
    } = options;

    const response = await fetch(`${API_BASE}/api/edit-image-base64`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image,
        prompt,
        negativePrompt,
        steps,
        cfgScale,
        seed
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '图像编辑失败');
    }

    return {
      editedImageUrl: data.editedImageUrl,
      prompt: data.prompt,
      options: data.options
    };
  } catch (error) {
    console.error('编辑图像失败:', error);
    throw error;
  }
}

/**
 * 将文件转换为 Base64
 * @param {File} file - 文件对象
 * @returns {Promise<string>} - Base64 字符串
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // 去掉 data:image/xxx;base64, 前缀
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 验证 URL 格式
 * @param {string} url - URL 字符串
 * @returns {boolean}
 */
export function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

export default {
  editImageByUrl,
  editImageByBase64,
  fileToBase64,
  isValidUrl
};
