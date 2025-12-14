/**
 * Excel 文件处理工具模块
 * 提供 Excel 文件解析和数据分析功能
 */

import * as XLSX from 'xlsx';

/**
 * 解析 Excel 文件
 * @param {Buffer} buffer - 文件 Buffer
 * @returns {object} - 解析结果
 */
export function parseExcelBuffer(buffer) {
  const workbook = XLSX.read(buffer);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  return {
    workbook,
    sheetName: firstSheetName,
    worksheet,
    data: jsonData
  };
}

/**
 * 分析 Excel 数据并生成统计信息
 * @param {Array} jsonData - Excel 数据 (JSON 格式)
 * @returns {object} - 统计信息
 */
export function analyzeExcelData(jsonData) {
  if (!jsonData || jsonData.length === 0) {
    return null;
  }

  const columns = Object.keys(jsonData[0]);
  const statistics = {};

  columns.forEach(col => {
    const values = jsonData.map(row => row[col]).filter(v => v !== null && v !== undefined);
    const numericValues = values.filter(v => !isNaN(parseFloat(v))).map(v => parseFloat(v));
    
    if (numericValues.length > 0) {
      const sum = numericValues.reduce((a, b) => a + b, 0);
      const avg = sum / numericValues.length;
      const max = Math.max(...numericValues);
      const min = Math.min(...numericValues);
      
      statistics[col] = {
        type: 'numeric',
        count: numericValues.length,
        sum: sum.toFixed(2),
        average: avg.toFixed(2),
        max: max,
        min: min
      };
    } else {
      statistics[col] = {
        type: 'text',
        count: values.length,
        uniqueValues: [...new Set(values)].length
      };
    }
  });

  return {
    columns,
    rowCount: jsonData.length,
    columnCount: columns.length,
    statistics
  };
}

/**
 * 生成 Excel 数据的智能摘要
 * @param {string} fileName - 文件名
 * @param {string} sheetName - 工作表名
 * @param {Array} jsonData - Excel 数据
 * @param {object} analysis - 分析结果
 * @returns {string} - 摘要文本
 */
export function generateExcelSummary(fileName, sheetName, jsonData, analysis) {
  const { columns, rowCount, statistics } = analysis;

  let summary = `📊 Excel文件分析报告：${fileName}\n\n`;
  summary += `📋 基本信息：\n`;
  summary += `- 工作表名称：${sheetName}\n`;
  summary += `- 总行数：${rowCount} 行\n`;
  summary += `- 总列数：${columns.length} 列\n\n`;
  
  summary += `📂 列信息：\n`;
  columns.forEach(col => {
    const stat = statistics[col];
    if (stat.type === 'numeric') {
      summary += `- ${col} (数值型)：平均值=${stat.average}, 最大值=${stat.max}, 最小值=${stat.min}\n`;
    } else {
      summary += `- ${col} (文本型)：${stat.count}个值, ${stat.uniqueValues}个唯一值\n`;
    }
  });
  
  summary += `\n📑 前5行数据预览：\n`;
  jsonData.slice(0, 5).forEach((row, index) => {
    summary += `\n第 ${index + 1} 行：\n`;
    columns.forEach(col => {
      summary += `  ${col}: ${row[col]}\n`;
    });
  });
  
  if (rowCount > 5) {
    summary += `\n...(还有 ${rowCount - 5} 行数据)\n`;
  }

  return summary;
}

/**
 * 处理完整的 Excel 文件上传
 * @param {object} file - multer 文件对象
 * @returns {object} - 处理结果
 */
export function processExcelFile(file) {
  // 解析文件
  const { sheetName, data: jsonData } = parseExcelBuffer(file.buffer);
  
  if (jsonData.length === 0) {
    throw new Error('Excel文件为空或格式不正确');
  }

  // 分析数据
  const analysis = analyzeExcelData(jsonData);
  
  // 生成摘要
  const summary = generateExcelSummary(
    file.originalname, 
    sheetName, 
    jsonData, 
    analysis
  );

  return {
    fileName: file.originalname,
    sheetName: sheetName,
    rowCount: analysis.rowCount,
    columnCount: analysis.columnCount,
    columns: analysis.columns,
    statistics: analysis.statistics,
    summary: summary,
    preview: jsonData.slice(0, 10)
  };
}

export default {
  parseExcelBuffer,
  analyzeExcelData,
  generateExcelSummary,
  processExcelFile
};
