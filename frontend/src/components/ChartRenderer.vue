<template>
  <div class="chart-container">
    <div ref="chartRef" class="chart"></div>
    <div v-if="description" class="chart-description">
      {{ description }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  option: {
    type: Object,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
});

const chartRef = ref(null);
let chartInstance = null;

const initChart = () => {
  if (!chartRef.value) return;
  
  // 如果已有实例，先销毁
  if (chartInstance) {
    chartInstance.dispose();
  }
  
  // 创建新的 ECharts 实例
  chartInstance = echarts.init(chartRef.value);
  chartInstance.setOption(props.option);
};

// 监听 option 变化
watch(() => props.option, () => {
  nextTick(() => {
    initChart();
  });
}, { deep: true });

// 监听窗口大小变化
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

onMounted(() => {
  nextTick(() => {
    initChart();
  });
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.chart-container {
  width: 100%;
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.chart {
  width: 100%;
  height: 350px;
  min-width: 300px;
}

.chart-description {
  margin-top: 12px;
  padding: 10px 15px;
  background: #f8f9fa;
  border-radius: 8px;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  border-left: 3px solid #667eea;
}
</style>
