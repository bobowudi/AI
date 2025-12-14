# 豆包AI聊天应用 - 后端服务器

这是一个基于 Express.js 的后端服务器，提供 RESTful API 接口与豆包AI模型进行交互。

## 📋 功能特性

- ✅ Express.js RESTful API
- ✅ 豆包AI模型集成
- ✅ CORS 支持
- ✅ 完整的错误处理
- ✅ 对话历史支持

## 🚀 快速开始

### 安装依赖

```bash
npm install
# 或
pnpm install
```

### 启动服务器

```bash
npm start
# 或
npm run dev
```

服务器将在 http://localhost:3000 启动

### 测试API（命令行）

```bash
npm run test
```

## 📡 API 文档

### POST /api/upload-excel

上传Excel文件并获取智能分析。

**请求示例：**

```bash
curl -X POST http://localhost:3000/api/upload-excel \
  -F "file=@data.xlsx"
```

**请求格式：**
- Content-Type: multipart/form-data
- 字段名：file
- 支持格式：.xlsx, .xls, .csv
- 文件大小限制：10MB

**响应示例：**

```json
{
  "success": true,
  "data": {
    "fileName": "data.xlsx",
    "sheetName": "Sheet1",
    "rowCount": 100,
    "columnCount": 5,
    "columns": ["姓名", "年龄", "城市", "销售额", "日期"],
    "statistics": {
      "年龄": {
        "type": "numeric",
        "count": 100,
        "average": "28.50",
        "max": 45,
        "min": 18
      },
      "城市": {
        "type": "text",
        "count": 100,
        "uniqueValues": 10
      }
    },
    "summary": "📊 Excel文件分析报告...",
    "preview": [...]
  }
}
```

### POST /api/chat

发送聊天消息并获取AI回复。

**请求示例：**

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "你好"
      }
    ]
  }'
```

**请求体结构：**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "你好"
    }
  ]
}
```

**响应示例：**

```json
{
  "success": true,
  "message": "你好！有什么我可以帮助你的吗？"
}
```

**错误响应：**

```json
{
  "success": false,
  "error": "错误信息"
}
```

## ⚙️ 配置

API 配置位于 `server.js` 文件中：

```javascript
const API_CONFIG = {
  baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  apiKey: 'Bearer YOUR_API_KEY',
  model: 'doubao-1-5-lite-32k-250115'
};
```

### 环境变量（可选）

您可以创建 `.env` 文件来管理配置：

```env
PORT=3000
DOUBAO_API_KEY=your_api_key_here
DOUBAO_MODEL=doubao-1-5-lite-32k-250115
```

## 📁 项目结构

```
backend/
├── server.js          # Express 服务器主文件
├── index.js           # 命令行测试脚本
├── package.json       # 项目配置
├── .gitignore        # Git 忽略文件
└── README.md         # 项目说明
```

## 🛠️ 技术栈

- **Node.js** - JavaScript 运行时
- **Express.js** - Web 框架
- **CORS** - 跨域资源共享
- **Fetch API** - HTTP 请求

## 📝 开发说明

### 添加新的API端点

在 `server.js` 中添加新的路由：

```javascript
app.post('/api/your-endpoint', async (req, res) => {
  // 您的逻辑
});
```

### 错误处理

所有的API调用都包含完整的错误处理机制，确保返回适当的HTTP状态码和错误信息。

## 🔒 安全提醒

- 请不要将 API Key 提交到版本控制系统
- 建议使用环境变量管理敏感信息
- 在生产环境中添加适当的认证和授权机制

## 📄 许可证

MIT
