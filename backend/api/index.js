/**
 * API 模块统一导出
 * 方便在其他地方引用所有 API 功能
 */

// 豆包模型 API
export { 
  DOUBAO_CONFIG,
  callDoubaoWithTools, 
  callDoubaoStream 
} from './doubao.js';

// 图像生成 API (魔塔 Z-Image-Turbo)
export { 
  IMAGE_CONFIG,
  SUPPORTED_SIZES,
  generateImage, 
  isValidSize 
} from './image.js';

// 图表生成工具
export { 
  CHART_TOOLS,
  CHART_KEYWORDS,
  needsChartGeneration, 
  generateEChartsOption 
} from './chart.js';

// Excel 处理工具
export { 
  parseExcelBuffer,
  analyzeExcelData,
  generateExcelSummary,
  processExcelFile 
} from './excel.js';
