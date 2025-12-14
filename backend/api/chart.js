/**
 * ECharts 图表生成工具模块
 * 提供图表配置生成和工具定义
 */

// 图表颜色主题
const CHART_COLORS = [
  '#5470c6', '#91cc75', '#fac858', '#ee6666', 
  '#73c0de', '#3ba272', '#fc8452', '#9a60b4'
];

// 图表生成工具定义 (用于豆包 Function Calling)
export const CHART_TOOLS = [
  {
    type: "function",
    function: {
      name: "generate_chart",
      description: "根据用户需求生成 ECharts 图表配置。当用户要求绘制图表、生成可视化、画图表时调用此函数。",
      parameters: {
        type: "object",
        properties: {
          chartType: {
            type: "string",
            enum: ["bar", "line", "pie", "scatter", "radar"],
            description: "图表类型：bar(柱状图)、line(折线图)、pie(饼图)、scatter(散点图)、radar(雷达图)"
          },
          title: {
            type: "string",
            description: "图表标题"
          },
          xAxisData: {
            type: "array",
            items: { type: "string" },
            description: "X轴数据（类目轴），如：['周一', '周二', '周三']"
          },
          seriesData: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "数据系列名称" },
                data: { 
                  type: "array", 
                  items: { type: "number" },
                  description: "数据值数组"
                }
              }
            },
            description: "数据系列数组，每个系列包含 name 和 data"
          },
          description: {
            type: "string",
            description: "对图表的简要说明"
          }
        },
        required: ["chartType", "title", "seriesData"]
      }
    }
  }
];

// 图表关键词列表
export const CHART_KEYWORDS = [
  '图表', '绘制', '画一个', '生成图', 
  '柱状图', '折线图', '饼图', '散点图', '雷达图', 
  '可视化', '图形', 'chart', 'plot'
];

/**
 * 检测消息是否需要生成图表
 * @param {string} message - 用户消息
 * @returns {boolean}
 */
export function needsChartGeneration(message) {
  const lowerMessage = message.toLowerCase();
  return CHART_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

/**
 * 根据工具调用参数生成 ECharts 配置
 * @param {object} params - 图表参数
 * @returns {object} - 包含 option 和 description 的对象
 */
export function generateEChartsOption(params) {
  const { chartType, title, xAxisData, seriesData, description } = params;
  
  let option = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: chartType === 'pie' ? 'item' : 'axis'
    },
    color: CHART_COLORS
  };

  switch (chartType) {
    case 'pie':
      option = generatePieChart(option, seriesData, xAxisData, title);
      break;
    case 'radar':
      option = generateRadarChart(option, seriesData, xAxisData);
      break;
    default:
      option = generateCartesianChart(option, chartType, seriesData, xAxisData);
  }

  return { option, description };
}

/**
 * 生成饼图配置
 */
function generatePieChart(baseOption, seriesData, xAxisData, title) {
  baseOption.series = [{
    name: seriesData[0]?.name || title,
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: {
      borderRadius: 10,
      borderColor: '#fff',
      borderWidth: 2
    },
    label: {
      show: true,
      formatter: '{b}: {d}%'
    },
    data: xAxisData 
      ? xAxisData.map((name, index) => ({
          name,
          value: seriesData[0]?.data[index] || 0
        }))
      : seriesData[0]?.data.map((value, index) => ({
          name: `项目${index + 1}`,
          value
        }))
  }];
  return baseOption;
}

/**
 * 生成雷达图配置
 */
function generateRadarChart(baseOption, seriesData, xAxisData) {
  const maxValue = Math.max(...seriesData.flatMap(s => s.data)) * 1.2;
  
  baseOption.radar = {
    indicator: xAxisData?.map(name => ({ name, max: maxValue })) || 
               seriesData[0]?.data.map((_, i) => ({ name: `指标${i + 1}`, max: maxValue }))
  };
  
  baseOption.series = [{
    type: 'radar',
    data: seriesData.map(s => ({
      name: s.name,
      value: s.data
    }))
  }];
  
  return baseOption;
}

/**
 * 生成笛卡尔坐标系图表 (柱状图、折线图、散点图)
 */
function generateCartesianChart(baseOption, chartType, seriesData, xAxisData) {
  baseOption.xAxis = {
    type: 'category',
    data: xAxisData || seriesData[0]?.data.map((_, i) => `项目${i + 1}`),
    axisLabel: {
      rotate: xAxisData && xAxisData.length > 6 ? 45 : 0
    }
  };
  
  baseOption.yAxis = {
    type: 'value'
  };
  
  baseOption.legend = {
    data: seriesData.map(s => s.name),
    bottom: 0
  };
  
  baseOption.grid = {
    left: '3%',
    right: '4%',
    bottom: '15%',
    containLabel: true
  };
  
  baseOption.series = seriesData.map(s => ({
    name: s.name,
    type: chartType,
    data: s.data,
    smooth: chartType === 'line',
    emphasis: {
      focus: 'series'
    }
  }));
  
  return baseOption;
}

export default {
  CHART_TOOLS,
  CHART_KEYWORDS,
  needsChartGeneration,
  generateEChartsOption
};
