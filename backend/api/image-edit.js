/**
 * 阿里云百炼 Qwen-Image-Edit 图像编辑 API 模块
 * 提供 AI 图像编辑功能
 */


// 阿里云百炼 Qwen-Image-Edit 配置
export const IMAGE_EDIT_CONFIG = {
  baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
  apiKey: 'sk-385eff51de9044d7ab101bb7eed2e50a',  // 阿里云百炼 API Key
  model: 'qwen-image-edit-plus'
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
    n = 1,  // 生成图片数量
    promptExtend = true,  // 提示词扩展
    watermark = false  // 水印
  } = options;

  try {
    console.log('🎨 调用阿里云百炼图片编辑 API...');
    console.log('📸 图片 URL:', imageUrl);
    console.log('✏️  编辑指令:', prompt);

    // 构建阿里云百炼 API 请求体
    const requestBody = {
      model: IMAGE_EDIT_CONFIG.model,
      input: {
        messages: [
          {
            role: 'user',
            content: [
              {
                image: imageUrl  // 图片 URL
              },
              {
                text: prompt  // 编辑指令
              }
            ]
          }
        ]
      },
      parameters: {
        n: n,
        watermark: watermark,
        prompt_extend: promptExtend
      }
    };

    // 只在有值时添加负面提示词
    if (negativePrompt) {
      requestBody.parameters.negative_prompt = negativePrompt;
    }

    console.log('📤 发送请求到阿里云百炼 API...');

    const response = await fetch(IMAGE_EDIT_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${IMAGE_EDIT_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 阿里云百炼 API 错误:', errorText);
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 API 返回数据:', JSON.stringify(data, null, 2));

    // 从阿里云百炼 API 响应中提取图像 URL
    // 响应格式: output.choices[0].message.content[0].image
    let editedImageUrl = null;
    
    if (data.output && data.output.choices && data.output.choices[0]) {
      const content = data.output.choices[0].message?.content;
      if (Array.isArray(content) && content[0]?.image) {
        editedImageUrl = content[0].image;
      }
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
        n,
        promptExtend,
        watermark
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
    n = 1,
    promptExtend = true,
    watermark = false
  } = options;

  try {
    console.log('🎨 调用阿里云百炼图片编辑 API (Base64 模式)...');
    console.log('✏️  编辑指令:', prompt);

    // 确保 Base64 字符串格式正确（阿里云支持 data URI 格式）
    const imageData = base64Image.startsWith('data:') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;

    // 构建阿里云百炼 API 请求体
    const requestBody = {
      model: IMAGE_EDIT_CONFIG.model,
      input: {
        messages: [
          {
            role: 'user',
            content: [
              {
                image: imageData  // Base64 图片
              },
              {
                text: prompt  // 编辑指令
              }
            ]
          }
        ]
      },
      parameters: {
        n: n,
        watermark: watermark,
        prompt_extend: promptExtend
      }
    };

    // 只在有值时添加负面提示词
    if (negativePrompt) {
      requestBody.parameters.negative_prompt = negativePrompt;
    }

    console.log('📤 发送请求到阿里云百炼 API...');

    const response = await fetch(IMAGE_EDIT_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${IMAGE_EDIT_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 阿里云百炼 API 错误:', errorText);
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 API 返回数据:', JSON.stringify(data, null, 2));

    // 从阿里云百炼 API 响应中提取图像 URL
    let editedImageUrl = null;
    
    if (data.output && data.output.choices && data.output.choices[0]) {
      const content = data.output.choices[0].message?.content;
      if (Array.isArray(content) && content[0]?.image) {
        editedImageUrl = content[0].image;
      }
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
        n,
        promptExtend,
        watermark
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
