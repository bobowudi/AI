/**
 * 豆包 AI 聊天服务器 - 主入口文件
 * 整合豆包对话、图表生成、图像生成、Excel分析功能
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';

// 导入 API 模块
import { callDoubaoWithTools, callDoubaoStream } from './api/doubao.js';
import { generateImage } from './api/image.js';
import { editImageByUrl, editImageByBase64, isValidImageUrl } from './api/image-edit.js';
import { CHART_TOOLS, needsChartGeneration, generateEChartsOption } from './api/chart.js';
import { processExcelFile } from './api/excel.js';
import { captureScreenshot, isValidUrl } from './api/screenshot.js';

const app = express();
const PORT = 3000;

// ==================== 中间件配置 ====================

// CORS 跨域支持
app.use(cors());

// JSON 解析 (增加大小限制以支持图片 Base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 文件上传配置 (multer)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 限制 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.match(/\.(xlsx|xls|csv)$/)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 Excel 和 CSV 文件格式'));
    }
  }
});

// ==================== API 路由 ====================

/**
 * 聊天接口 (流式，支持图表工具调用)
 * POST /api/chat
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: '请求参数错误：messages 必须是数组' 
      });
    }

    const userMessage = messages[messages.length - 1].content;
    console.log('💬 收到聊天请求:', userMessage);
    
    // 检测是否需要生成图表
    if (needsChartGeneration(userMessage)) {
      console.log('📊 检测到图表生成需求，使用工具调用模式...');
      
      const response = await callDoubaoWithTools(messages, CHART_TOOLS, true);
      const choice = response.choices?.[0];
      const message = choice?.message;
      
      // 检查是否有工具调用
      if (message?.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        
        if (toolCall.function?.name === 'generate_chart') {
          console.log('🎨 AI 请求生成图表:', toolCall.function.arguments);
          
          try {
            const chartParams = JSON.parse(toolCall.function.arguments);
            const { option, description } = generateEChartsOption(chartParams);
            
            // 返回图表数据 (SSE 格式)
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            
            res.write(`data: ${JSON.stringify({ 
              type: 'chart',
              chartOption: option,
              description: description || chartParams.description || '图表已生成'
            })}\n\n`);
            
            res.write('data: [DONE]\n\n');
            res.end();
            
            console.log('✅ 图表生成完成');
            return;
          } catch (parseError) {
            console.error('❌ 解析图表参数失败:', parseError);
          }
        }
      }
      
      // 如果没有工具调用，返回普通文本响应
      if (message?.content) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        res.write(`data: ${JSON.stringify({ content: message.content })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
    }
    
    // 默认使用流式响应
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    await callDoubaoStream(messages, (chunk) => {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    });
    
    res.write('data: [DONE]\n\n');
    res.end();
    
    console.log('✅ AI 回复完成');
    
  } catch (error) {
    console.error('❌ 处理聊天请求时出错:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

/**
 * 图像生成接口 (魔塔 Z-Image-Turbo)
 * POST /api/generate-image
 */
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, size = '1024x1024', negativePrompt = '' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false,
        error: '请提供图像描述 (prompt)' 
      });
    }

    const result = await generateImage(prompt, { size, negativePrompt });
    
    res.json(result);

  } catch (error) {
    console.error('❌ 生成图像失败:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * 图像编辑接口 (魔塔 Qwen-Image-Edit) - URL 模式
 * POST /api/edit-image-url
 */
app.post('/api/edit-image-url', async (req, res) => {
  try {
    const { 
      imageUrl, 
      prompt, 
      negativePrompt = '', 
      steps = 50, 
      cfgScale = 4.0,
      seed = -1 
    } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ 
        success: false,
        error: '请提供图片 URL (imageUrl)' 
      });
    }

    if (!prompt) {
      return res.status(400).json({ 
        success: false,
        error: '请提供编辑指令 (prompt)' 
      });
    }

    if (!isValidImageUrl(imageUrl)) {
      return res.status(400).json({ 
        success: false,
        error: '无效的图片 URL 格式' 
      });
    }

    console.log('🎨 收到图片编辑请求 (URL 模式)');
    
    const result = await editImageByUrl(imageUrl, prompt, {
      negativePrompt,
      steps,
      cfgScale,
      seed
    });
    
    res.json(result);

  } catch (error) {
    console.error('❌ 编辑图像失败:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * 图像编辑接口 (魔塔 Qwen-Image-Edit) - Base64 模式
 * POST /api/edit-image-base64
 */
app.post('/api/edit-image-base64', async (req, res) => {
  try {
    const { 
      base64Image, 
      prompt, 
      negativePrompt = '', 
      steps = 50, 
      cfgScale = 4.0,
      seed = -1 
    } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({ 
        success: false,
        error: '请提供 Base64 图片数据 (base64Image)' 
      });
    }

    if (!prompt) {
      return res.status(400).json({ 
        success: false,
        error: '请提供编辑指令 (prompt)' 
      });
    }

    console.log('🎨 收到图片编辑请求 (Base64 模式)');
    
    const result = await editImageByBase64(base64Image, prompt, {
      negativePrompt,
      steps,
      cfgScale,
      seed
    });
    
    res.json(result);

  } catch (error) {
    console.error('❌ 编辑图像失败:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Excel 文件上传和分析接口
 * POST /api/upload-excel
 */
app.post('/api/upload-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: '没有上传文件' 
      });
    }

    console.log('📁 收到 Excel 文件上传:', req.file.originalname);

    const result = processExcelFile(req.file);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ 处理 Excel 文件时出错:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * 网页截图接口 (ScreenshotOne)
 * POST /api/screenshot
 */
app.post('/api/screenshot', async (req, res) => {
  try {
    const { 
      url, 
      format = 'png', 
      fullPage = false, 
      viewportWidth = 1920, 
      viewportHeight = 1080,
      delay = 0 
    } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        success: false,
        error: '请提供要截图的网页 URL' 
      });
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({ 
        success: false,
        error: '无效的 URL 格式，请输入完整的网址 (如 https://example.com)' 
      });
    }

    const result = await captureScreenshot(url, { 
      format, 
      fullPage, 
      viewportWidth, 
      viewportHeight,
      delay 
    });
    
    res.json(result);

  } catch (error) {
    console.error('❌ 截图失败:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * 健康检查接口
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      chat: 'available',
      image: 'available',
      imageEdit: 'available',
      excel: 'available',
      screenshot: 'available'
    }
  });
});

// ==================== 启动服务器 ====================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 AI 助手服务器已启动！                                   ║
║                                                            ║
║   📡 服务地址: http://localhost:${PORT}                      ║
║                                                            ║
║   📋 API 端点:                                              ║
║      💬 聊天: POST /api/chat                                ║
║      🎨 图像生成: POST /api/generate-image                  ║
║      ✏️  图像编辑: POST /api/edit-image-url                 ║
║      ✏️  图像编辑: POST /api/edit-image-base64              ║
║      📸 截图: POST /api/screenshot                          ║
║      📊 Excel: POST /api/upload-excel                       ║
║      ❤️  健康: GET /api/health                              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
