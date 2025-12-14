# 豆包AI聊天应用

这是一个完整的全栈应用，包含后端API服务器和Vue 3前端界面，用于与豆包AI模型进行智能对话。

## 🌟 项目特性

### 后端 (Backend)
- ✅ Express.js RESTful API
- ✅ 豆包AI模型集成
- ✅ CORS 支持
- ✅ 完整的错误处理
- ✅ 对话历史支持

### 前端 (Frontend)
- ✅ Vue 3 + Vite 构建
- ✅ 现代化聊天界面
- ✅ 实时消息更新
- ✅ 响应式设计
- ✅ 优美的动画效果
- ✅ 打字指示器
- ✅ Excel文件上传分析（支持.xlsx、.xls、.csv）

## 📦 项目结构

```
AI/
├── backend/              # 后端服务器
│   ├── server.js        # Express API 服务器
│   ├── index.js         # 命令行测试脚本
│   ├── package.json     # 后端依赖
│   └── README.md        # 后端说明文档
│
├── frontend/            # 前端应用
│   ├── src/
│   │   ├── api/        # API 调用服务
│   │   ├── components/ # Vue 组件
│   │   ├── App.vue     # 根组件
│   │   ├── main.js     # 入口文件
│   │   └── style.css   # 全局样式
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json    # 前端依赖
│   └── README.md       # 前端说明文档
│
└── README.md           # 项目总览（本文件）
```

## 🚀 快速开始

### 启动后端服务器

打开终端，执行以下命令：

```bash
# 进入后端目录
cd backend

# 安装依赖（首次运行）
pnpm install

# 启动服务器
pnpm start
```

后端服务器将在 **http://localhost:3000** 启动

### 启动前端应用

打开**新的终端**，执行以下命令：

```bash
# 进入前端目录
cd frontend

# 安装依赖（首次运行）
pnpm install

# 启动开发服务器
pnpm run dev
```

前端应用将在 **http://localhost:5173** 启动

## 📖 使用指南

### 访问应用

1. 确保后端和前端都已启动
2. 打开浏览器访问：http://localhost:5173
3. 在聊天框中输入消息
4. 按回车或点击"发送"按钮
5. 等待AI回复

### 功能说明

- **发送消息**：在输入框输入内容，按回车或点击发送按钮
- **查看历史**：所有对话都会保留在当前会话中
- **清空对话**：点击"清空对话"按钮重新开始
- **加载状态**：发送消息时会显示打字动画
- **Excel分析**：
  1. 点击输入框旁的 📎 按钮上传Excel文件
  2. 支持 .xlsx、.xls、.csv 格式
  3. 自动读取并格式化数据（显示前10行）
  4. AI会分析数据并给出见解

## 🔧 配置说明

### 后端配置

编辑 `backend/server.js` 中的 API 配置：

```javascript
const API_CONFIG = {
  baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  apiKey: 'Bearer YOUR_API_KEY',
  model: 'doubao-1-5-lite-32k-250115'
};
```

### 端口配置

- **后端端口**：3000（在 `backend/server.js` 中修改）
- **前端端口**：5173（在 `frontend/vite.config.js` 中修改）

如果修改了后端端口，需要同时更新前端的代理配置（`frontend/vite.config.js`）。

## 📡 API 接口

### POST /api/upload-excel

上传Excel文件并获取智能分析

**功能：**
- 自动解析Excel文件
- 智能数据统计（数值列的平均值、最大值、最小值）
- 文本列的唯一值统计
- 生成详细的分析报告

### POST /api/chat

发送聊天消息并获取AI回复

**请求：**
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

**响应：**
```json
{
  "success": true,
  "message": "你好！有什么我可以帮助你的吗？"
}
```

详细API文档请查看 `backend/README.md`

## 🛠️ 技术栈

### 后端
- Node.js
- Express.js
- CORS
- Fetch API

### 前端
- Vue 3
- Vite
- Axios
- CSS3 Animations

## 📝 开发说明

### 后端开发

```bash
cd backend
npm run dev
```

### 前端开发

```bash
cd frontend
npm run dev
```

### 构建生产版本

```bash
# 前端构建
cd frontend
npm run build
```

## 🔍 测试

### 测试后端API（命令行）

```bash
cd backend
npm run test
```

### 测试API（curl）

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"你好"}]}'
```

## 🎨 界面预览

- 💬 现代化聊天界面
- 🎨 渐变色彩设计
- 📱 完全响应式
- ⚡ 流畅动画效果
- 🤖 智能AI对话

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📮 联系方式

如有问题或建议，欢迎联系。

---

**祝您使用愉快！** 🎉
