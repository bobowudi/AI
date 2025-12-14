import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

/**
 * 上传Excel文件并获取分析结果
 * @param {File} file - Excel文件
 * @returns {Promise<Object>} - 分析结果
 */
export async function uploadExcel(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload-excel', formData);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || '上传失败');
    }
  } catch (error) {
    console.error('上传文件失败:', error);
    throw error.response?.data?.error || error.message || '网络错误';
  }
}
