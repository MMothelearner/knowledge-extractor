# Knowledge Extractor - 部署和使用指南

## 系统概述

Knowledge Extractor 是一个智能知识提炼和组织平台，集成了Manus LLM服务，能够：

- 📄 上传各类文档（PDF、TXT、MD）
- 🔗 处理网页和视频链接
- 🧠 使用LLM自动分析内容
- 🎯 识别问题和解决方法
- 📊 生成思维导图
- 🔄 智能去重和关联识别

## 技术栈

- **后端**：Node.js + Express
- **LLM**：Manus LLM API（Gemini 2.5 Flash）
- **文档处理**：pdf-parse
- **前端**：HTML5 + CSS3 + JavaScript

## 部署步骤

### 1. 环境配置

创建或更新 `.env` 文件：

```env
PORT=3000
NODE_ENV=production
UPLOAD_DIR=./uploads
DATA_DIR=./data
MAX_FILE_SIZE=50000000
ALLOWED_FILE_TYPES=pdf,txt,md
LLM_API_ENDPOINT=https://forge.manus.im/v1/chat/completions
LLM_API_KEY=your_manus_api_key_here
DATABASE_URL=sqlite:./data/knowledge.db
```

**重要**：`LLM_API_KEY` 需要从Manus平台获取。

### 2. 安装依赖

```bash
npm install
```

### 3. 启动服务

**开发模式**：
```bash
npm run dev
```

**生产模式**：
```bash
npm start
```

服务器将在 `http://localhost:3000` 启动

### 4. 部署到Manus平台

#### 方式A：使用Manus Web项目功能

1. 在Manus平台创建一个Web项目
2. 上传Knowledge Extractor代码
3. 配置环境变量（在Manus Settings中）
4. 部署

#### 方式B：Docker部署

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

构建和运行：

```bash
docker build -t knowledge-extractor .
docker run -p 3000:3000 \
  -e LLM_API_KEY=your_key \
  knowledge-extractor
```

## API 文档

### 上传文档分析

**端点**：`POST /api/smart-analysis/upload`

**请求**：
```
Content-Type: multipart/form-data
- file: 文件（PDF、TXT、MD）
```

**响应**：
```json
{
  "success": true,
  "data": {
    "fileName": "document.pdf",
    "contentLength": 5000,
    "analysis": {
      "problem": "如何备考KET写作",
      "methods": ["方法1", "方法2"],
      "keywords": ["KET", "写作", "备考"],
      "summary": "内容总结",
      "mindmap": "mermaid图表代码"
    }
  }
}
```

### 分析文本

**端点**：`POST /api/smart-analysis/text`

**请求**：
```json
{
  "content": "要分析的文本内容",
  "contentType": "text"
}
```

**响应**：同上

### 处理链接

**端点**：`POST /api/smart-analysis/link`

**请求**：
```json
{
  "url": "https://example.com"
}
```

**响应**：同上

### 系统统计

**端点**：`GET /api/stats`

**响应**：
```json
{
  "success": true,
  "stats": {
    "knowledgePoints": 10,
    "documents": 5,
    "links": 3,
    "documentsProcessing": 0,
    "linksProcessing": 0
  }
}
```

## 使用流程

### 1. 上传文档

1. 打开 `http://localhost:3000`
2. 点击"上传文档"
3. 选择PDF、TXT或MD文件
4. 系统自动分析并返回结果

### 2. 分析文本

1. 点击"分析文本"
2. 粘贴要分析的内容
3. 系统自动识别问题和方法

### 3. 处理链接

1. 点击"处理链接"
2. 输入网页URL
3. 系统提取内容并分析

## LLM分析流程

### 第一步：内容分析

系统使用LLM分析内容，识别：
- **问题**：内容解决的核心问题
- **方法**：具体的解决方法（多个）
- **关键词**：核心概念和术语
- **总结**：内容的精炼总结

### 第二步：思维导图生成

基于分析结果，系统生成Mermaid格式的思维导图，可视化展示：
- 中心问题
- 解决方法
- 关键概念

### 第三步：去重检测

系统可以检测新内容与现有知识点的相似度：
- **完全相同**：合并，只保留一份
- **相似但不同**：标注来源
- **相同问题不同方法**：保留多份，标注为不同方法

## 输出格式

### JSON格式

分析结果以JSON格式存储，便于系统调用和集成：

```json
{
  "problem": "问题描述",
  "methods": ["方法1", "方法2"],
  "keywords": ["关键词1", "关键词2"],
  "summary": "总结",
  "mindmap": "mermaid代码",
  "contentType": "document|text|link",
  "analyzedAt": "2024-01-06T10:30:00Z"
}
```

### Markdown格式

可以导出为Markdown，便于查看和分享：

```markdown
# 问题：...

## 解决方法

1. 方法1
2. 方法2

## 关键词

- 关键词1
- 关键词2

## 思维导图

[mermaid图表]
```

## 故障排除

### LLM API 错误

**错误**：`LLM API Key not configured`

**解决**：确保 `.env` 中配置了 `LLM_API_KEY`

### 文件上传失败

**错误**：`File too large`

**解决**：检查文件大小是否超过 `MAX_FILE_SIZE`（默认50MB）

### PDF 提取失败

**错误**：`Failed to extract PDF content`

**解决**：确保PDF文件有效且不受密码保护

## 性能优化

### 1. 缓存

实现缓存机制避免重复分析相同内容

### 2. 异步处理

大文件使用异步处理，避免阻塞主线程

### 3. 分段处理

超大文档可以分段处理，然后合并结果

## 安全建议

1. **API密钥管理**
   - 不要在代码中硬编码API密钥
   - 使用环境变量存储敏感信息
   - 定期轮换密钥

2. **文件上传**
   - 验证文件类型
   - 限制文件大小
   - 使用病毒扫描

3. **访问控制**
   - 添加身份验证
   - 实现速率限制
   - 记录所有操作

## 后续功能

### 第二阶段

- [ ] 用户认证和授权
- [ ] 知识库管理界面
- [ ] 高级搜索功能
- [ ] 知识点关联管理
- [ ] 批量导入/导出
- [ ] 数据持久化存储

### 第三阶段

- [ ] 与英语学习APP集成
- [ ] 推荐引擎
- [ ] 学习计划生成
- [ ] 进度跟踪
- [ ] 学生管理

## 支持和反馈

如有问题或建议，请联系开发团队。

---

**最后更新**：2024年1月6日
