# Knowledge Extractor - 快速开始指南

## 项目概述

**Knowledge Extractor** 是一个智能知识提炼和组织平台，集成了Manus LLM服务，能够自动分析文档、识别问题和方法、生成思维导图。

### 核心功能

- 📄 **文档上传** - 支持PDF、TXT、MD格式
- 🔗 **链接处理** - 提取网页和视频内容
- 🧠 **LLM分析** - 使用Manus LLM自动识别问题和方法
- 📊 **思维导图** - 生成Mermaid格式的可视化思维导图
- 🔄 **智能去重** - 识别和处理重复内容
- 💾 **多格式导出** - JSON、Markdown、CSV、HTML

## 部署方式

### 方式1：本地运行（推荐用于开发和测试）

#### 前置要求
- Node.js 18+ 
- npm 或 yarn

#### 安装步骤

```bash
# 1. 克隆或下载项目
cd knowledge_extractor

# 2. 安装依赖
npm install

# 3. 配置环境变量
# 编辑 .env 文件，设置 LLM_API_KEY
# LLM_API_KEY=your_manus_api_key_here

# 4. 启动服务
npm start

# 服务将在 http://localhost:3000 运行
```

### 方式2：Docker部署（推荐用于生产环境）

#### 前置要求
- Docker
- Docker Compose（可选）

#### 构建和运行

```bash
# 构建镜像
docker build -t knowledge-extractor .

# 运行容器
docker run -p 3000:3000 \
  -e LLM_API_KEY=your_manus_api_key_here \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/data:/app/data \
  knowledge-extractor
```

#### Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  knowledge-extractor:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      LLM_API_KEY: ${LLM_API_KEY}
      UPLOAD_DIR: ./uploads
      DATA_DIR: ./data
    volumes:
      - ./uploads:/app/uploads
      - ./data:/app/data
    restart: unless-stopped
```

运行：
```bash
LLM_API_KEY=your_key docker-compose up -d
```

### 方式3：云平台部署

#### Heroku

```bash
# 1. 安装Heroku CLI
# 2. 登录
heroku login

# 3. 创建应用
heroku create knowledge-extractor

# 4. 设置环境变量
heroku config:set LLM_API_KEY=your_key

# 5. 部署
git push heroku main
```

#### Railway / Render / Fly.io

类似的部署流程，具体参考各平台文档。

## 获取LLM API密钥

### 从Manus平台获取

1. 登录 Manus 账户
2. 进入 Settings → Secrets
3. 查找 `BUILT_IN_FORGE_API_KEY` 或创建新的API密钥
4. 复制密钥值

### 配置到Knowledge Extractor

**方式1：环境变量**
```bash
export LLM_API_KEY=your_key
npm start
```

**方式2：.env文件**
```
LLM_API_KEY=your_key
```

**方式3：Docker环境变量**
```bash
docker run -e LLM_API_KEY=your_key ...
```

## 使用指南

### Web界面

打开浏览器访问 `http://localhost:3000`

#### 1. 上传文档

1. 点击"上传文档"
2. 选择PDF、TXT或MD文件
3. 系统自动分析并返回结果

**支持的格式：**
- PDF（任何大小，建议<50MB）
- TXT（纯文本）
- MD（Markdown）

#### 2. 分析文本

1. 点击"分析文本"
2. 粘贴要分析的内容
3. 点击"分析"

#### 3. 处理链接

1. 点击"处理链接"
2. 输入网页URL
3. 系统提取内容并分析

### API调用

#### 上传文档分析

```bash
curl -X POST http://localhost:3000/api/smart-analysis/upload \
  -F "file=@document.pdf"
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "fileName": "document.pdf",
    "contentLength": 5000,
    "analysis": {
      "problem": "如何备考KET写作",
      "methods": [
        "掌握基本写作结构",
        "积累常用表达",
        "定期练习和反馈"
      ],
      "keywords": ["KET", "写作", "备考"],
      "summary": "介绍了KET写作备考的系统方法...",
      "mindmap": "mindmap\n  root((如何备考KET写作))\n    方法\n      方法1: 掌握基本写作结构\n      ..."
    }
  }
}
```

#### 分析文本

```bash
curl -X POST http://localhost:3000/api/smart-analysis/text \
  -H "Content-Type: application/json" \
  -d '{
    "content": "要分析的文本内容",
    "contentType": "text"
  }'
```

#### 处理链接

```bash
curl -X POST http://localhost:3000/api/smart-analysis/link \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com"
  }'
```

#### 获取系统统计

```bash
curl http://localhost:3000/api/stats
```

**响应：**
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

## 输出格式

### JSON格式

每个分析结果都包含以下字段：

```json
{
  "problem": "核心问题（简洁准确）",
  "methods": [
    "具体方法1",
    "具体方法2",
    "具体方法3"
  ],
  "keywords": [
    "关键词1",
    "关键词2",
    "关键词3"
  ],
  "summary": "内容总结（精炼准确）",
  "mindmap": "Mermaid思维导图代码",
  "contentType": "document|text|link",
  "analyzedAt": "2024-01-06T10:30:00Z"
}
```

### Markdown格式

可以导出为Markdown供人类阅读：

```markdown
# 问题：如何备考KET写作

## 解决方法

1. 掌握基本写作结构
2. 积累常用表达
3. 定期练习和反馈

## 关键词

- KET
- 写作
- 备考

## 思维导图

[Mermaid图表可视化]
```

## 测试

### 本地测试

```bash
# 1. 启动服务
npm start

# 2. 在另一个终端测试API
curl -X POST http://localhost:3000/api/smart-analysis/text \
  -H "Content-Type: application/json" \
  -d '{
    "content": "这是一个测试文本",
    "contentType": "text"
  }'
```

### 使用测试PDF

项目包含一个测试PDF文件（15章.pdf），您可以用它来测试：

```bash
curl -X POST http://localhost:3000/api/smart-analysis/upload \
  -F "file=@/path/to/15章.pdf"
```

## 故障排除

### 问题：LLM API错误

**错误信息：** `LLM API Key not configured`

**解决方案：**
1. 确保 `.env` 文件中配置了 `LLM_API_KEY`
2. 确保密钥有效
3. 检查网络连接

### 问题：文件上传失败

**错误信息：** `File too large` 或 `File type not allowed`

**解决方案：**
1. 检查文件大小（默认限制50MB）
2. 确保文件格式是PDF、TXT或MD
3. 修改 `.env` 中的 `MAX_FILE_SIZE` 或 `ALLOWED_FILE_TYPES`

### 问题：PDF提取失败

**错误信息：** `Failed to extract PDF content`

**解决方案：**
1. 确保PDF文件有效
2. 确保PDF不受密码保护
3. 尝试用其他PDF查看器打开文件

## 性能优化

### 1. 缓存

实现缓存避免重复分析相同内容：

```javascript
// 在 llmAnalyzer.js 中添加缓存
const cache = new Map();
const cacheKey = hash(content);
if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}
```

### 2. 异步处理

大文件使用异步处理：

```javascript
// 使用队列处理大文件
const queue = [];
const processQueue = async () => {
  while (queue.length > 0) {
    const item = queue.shift();
    await processItem(item);
  }
};
```

### 3. 分段处理

超大文档分段处理：

```javascript
// 将大文档分成小段
const chunks = splitDocument(content, chunkSize);
const results = await Promise.all(
  chunks.map(chunk => analyzeContent(chunk))
);
```

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
**版本**：1.0.0
