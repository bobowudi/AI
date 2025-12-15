/**
 * 魔塔 Qwen-Image-Edit 图像编辑 API 模块
 * 提供 AI 图像编辑功能
 */

// 魔塔 Qwen-Image-Edit 配置
export const IMAGE_EDIT_CONFIG = {
  baseUrl: 'https://api-inference.modelscope.cn/v1/images/generations',  // 注意: 图像编辑也使用 generations 端点
  apiKey: 'ms-ba6fc3a2-020a-479f-8196-531af11db279',  // ModelScope API Key (复用 image.js 的)
  model: 'Qwen/Qwen-Image-Edit'
};

/**
 * 编辑图像 (支持 URL 输入)
 * @param {string} imageUrl - 图片的公开 URL 链接
 * @param {string} prompt - 编辑指令
 * @param {object} options - 可选参数
 * @param {string} options.negativePrompt - 负面提示词
 * @param {number} options.steps - 推理步数 (默认 50)
 * @param {number} options.cfgScale - 提示词引导系数 (默认 4.0)
 * @param {number} options.seed - 随机种子 (-1 为随机)
 * @returns {Promise<object>} - 包含编辑后图像 URL 的响应
 */
export async function editImageByUrl(imageUrl, prompt, options = {}) {
  const {
    negativePrompt = '',
    steps = 50,
    cfgScale = 4.0,
    seed = -1
  } = options;

  try {
    console.log('🎨 调用魔塔图片编辑 API...');
    console.log('📸 图片 URL:', imageUrl);
    console.log('✏️  编辑指令:', prompt);

    // 根据魔塔 API 文档,需要使用 data:image 格式的 URL 或 Base64
    // 对于 URL 模式,直接传入 URL 字符串
    const requestBody = {
      model: IMAGE_EDIT_CONFIG.model,
      prompt: prompt,
      image: imageUrl,  // 直接传入 URL
      negative_prompt: negativePrompt,
      size: '1024x1024'  // 添加默认尺寸
    };

    // 如果指定了 seed，添加到请求中
    if (seed >= 0) {
      requestBody.seed = seed;
    }
    
    // 添加高级参数到 extra_body (如果 API 支持)
    if (steps !== 50 || cfgScale !== 4.0) {
      requestBody.extra_body = {
        num_inference_steps: steps,
        true_cfg_scale: cfgScale
      };
    }

    const response = await fetch(IMAGE_EDIT_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${IMAGE_EDIT_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 魔塔 API 错误:', errorText);
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 API 返回数据:', JSON.stringify(data, null, 2));

    // 从 API 响应中提取图像 URL (可能是 images[0].url 或 data[0].url)
    let editedImageUrl = null;
    
    if (data.images && data.images[0]) {
      editedImageUrl = data.images[0].url;
    } else if (data.data && data.data[0]) {
      // 有些 API 返回格式可能是 data 数组
      editedImageUrl = data.data[0].url;
    }
    
    if (!editedImageUrl) {
      throw new Error('API 响应中未找到编辑后的图像 URL');
    }

    return {
      success: true,
      originalImageUrl: imageUrl,
      editedImageUrl: editedImageUrl,
      prompt: prompt,
      options: {
        negativePrompt,
        steps,
        cfgScale,
        seed: data.seed || seed
      }
    };
  } catch (error) {
    console.error('❌ 编辑图像失败:', error.message);
    throw error;
  }
}

/**
 * 编辑图像 (支持 Base64 输入)
 * @param {string} base64Image - Base64 编码的图片
 * @param {string} prompt - 编辑指令
 * @param {object} options - 可选参数
 * @returns {Promise<object>} - 包含编辑后图像 URL 的响应
 */
export async function editImageByBase64(base64Image, prompt, options = {}) {
  const {
    negativePrompt = '',
    steps = 50,
    cfgScale = 4.0,
    seed = -1
  } = options;

  try {
    console.log('🎨 调用魔塔图片编辑 API (Base64 模式)...');
    console.log('✏️  编辑指令:', prompt);

    // 确保 Base64 字符串格式正确
    const imageData = base64Image.startsWith('data:') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;

    const requestBody = {
      model: IMAGE_EDIT_CONFIG.model,
      prompt: prompt,
      image: imageData,
      negative_prompt: negativePrompt,
      size: '1024x1024'
    };

    if (seed >= 0) {
      requestBody.seed = seed;
    }
    
    // 添加高级参数到 extra_body
    if (steps !== 50 || cfgScale !== 4.0) {
      requestBody.extra_body = {
        num_inference_steps: steps,
        true_cfg_scale: cfgScale
      };
    }

    const response = await fetch(IMAGE_EDIT_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${IMAGE_EDIT_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 魔塔 API 错误:', errorText);
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 API 返回数据:', JSON.stringify(data, null, 2));

    // 从 API 响应中提取图像 URL
    let editedImageUrl = null;
    
    if (data.images && data.images[0]) {
      editedImageUrl = data.images[0].url;
    } else if (data.data && data.data[0]) {
      editedImageUrl = data.data[0].url;
    }
    
    if (!editedImageUrl) {
      throw new Error('API 响应中未找到编辑后的图像 URL');
    }

    return {
      success: true,
      editedImageUrl: editedImageUrl,
      prompt: prompt,
      options: {
        negativePrompt,
        steps,
        cfgScale,
        seed: data.seed || seed
      }
    };
  } catch (error) {
    console.error('❌ 编辑图像失败:', error.message);
    throw error;
  }
}

/**
 * 验证图片 URL 格式
 * @param {string} url - 图片 URL
 * @returns {boolean}
 */
export function isValidImageUrl(url) {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

export default {
  IMAGE_EDIT_CONFIG,
  editImageByUrl,
  editImageByBase64,
  isValidImageUrl
};
