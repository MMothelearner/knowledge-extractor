# Knowledge Extractor API 文档

## 概述

Knowledge Extractor是一个智能内容分析系统，支持从多个平台（小红书、YouTube、Bilibili等）提取内容，并使用LLM进行深度分析。

## API端点

### 1. 健康检查

**请求**
```
GET /api/health
```

**响应**
```json
{
  "success": true,
  "message": "Knowledge Extractor is running",
  "timestamp": "2026-01-13T05:02:32.873Z"
}
```

---

### 2. 分析链接

**请求**
```
POST /api/smart-analysis/link
Content-Type: application/json

{
  "url": "http://xhslink.com/o/n9cg7NeWIf"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "url": "http://xhslink.com/o/n9cg7NeWIf",
    "title": "英语阅读：如何有效进行英文原版阅读",
    "description": "#unlock #原版阅读 #教育 #英文阅读",
    "contentType": "xiaohongshu_post",
    "source": "xiaohongshu",
    "analysis": {
      "title": "英语阅读：如何有效进行英文原版阅读",
      "problem": "如何有效进行英文原版阅读",
      "topic": "英语阅读",
      "summary": "该内容提倡通过原版阅读来提升英文能力。它强调了在特定话题下寻找和阅读原版材料的重要性。这是一种将语言学习融入兴趣和实践的方法。",
      "keyPoints": [],
      "recommendations": ["通过阅读原版材料提升英文能力", "在学习中融入兴趣和实践"]
    },
    "processedAt": "2026-01-13T05:02:32.873Z"
  }
}
```

**支持的平台**
- 小红书 (xiaohongshu.com, xhslink.com)
- YouTube (youtube.com, youtu.be)
- Bilibili (bilibili.com, b23.tv)
- 微博 (weibo.com, m.weibo.com)
- 抖音 (douyin.com, v.douyin.com)
- 通用网页

---

### 3. 分析文本

**请求**
```
POST /api/smart-analysis/text
Content-Type: application/json

{
  "content": "这是一段需要分析的文本内容",
  "contentType": "text"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "title": "生成的标题",
    "problem": "识别的问题",
    "topic": "主题分类",
    "summary": "内容摘要",
    "keyPoints": ["关键点1", "关键点2"],
    "recommendations": ["建议1", "建议2"]
  }
}
```

---

### 4. 上传并分析文档

**请求**
```
POST /api/smart-analysis/upload
Content-Type: multipart/form-data

file: <PDF/TXT/MD文件>
```

**支持的文件格式**
- PDF (.pdf)
- 文本 (.txt)
- Markdown (.md)

**响应**
```json
{
  "success": true,
  "data": {
    "filename": "document.pdf",
    "title": "文档标题",
    "analysis": {
      "title": "生成的标题",
      "problem": "识别的问题",
      "topic": "主题分类",
      "summary": "文档摘要",
      "keyPoints": ["关键点1", "关键点2"],
      "recommendations": ["建议1", "建议2"]
    }
  }
}
```

---

### 5. 分析大型文档

**请求**
```
POST /api/smart-analysis/large-document
Content-Type: multipart/form-data

file: <大型PDF/TXT/MD文件>
chunkSize: 5000
```

**参数**
- `file`: 要上传的文件
- `chunkSize`: 分段大小（字符数），默认5000

**响应**
```json
{
  "success": true,
  "data": {
    "filename": "large_document.pdf",
    "chunks": [
      {
        "chunkIndex": 0,
        "content": "第一段内容...",
        "analysis": {
          "title": "段落标题",
          "summary": "段落摘要",
          "keyPoints": ["关键点1"]
        }
      }
    ],
    "summary": "整体摘要"
  }
}
```

---

### 6. 获取分析历史

**请求**
```
GET /api/smart-analysis/history
```

**响应**
```json
{
  "success": true,
  "data": {
    "message": "历史记录功能开发中"
  }
}
```

---

### 7. 知识库操作

#### 7.1 保存知识条目

**请求**
```
POST /api/knowledge-entries
Content-Type: application/json

{
  "title": "英语阅读：如何有效进行英文原版阅读",
  "content": "笔记内容",
  "source": "xiaohongshu",
  "url": "http://xhslink.com/o/n9cg7NeWIf",
  "categories": ["阅读", "英语学习"],
  "notes": "个人笔记"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": "entry-123",
    "title": "英语阅读：如何有效进行英文原版阅读",
    "createdAt": "2026-01-13T05:02:32.873Z"
  }
}
```

#### 7.2 获取所有知识条目

**请求**
```
GET /api/knowledge-entries
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": "entry-123",
      "title": "英语阅读：如何有效进行英文原版阅读",
      "content": "笔记内容",
      "source": "xiaohongshu",
      "categories": ["阅读", "英语学习"],
      "createdAt": "2026-01-13T05:02:32.873Z"
    }
  ]
}
```

#### 7.3 按分类过滤

**请求**
```
GET /api/knowledge-entries?category=阅读
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": "entry-123",
      "title": "英语阅读：如何有效进行英文原版阅读",
      "categories": ["阅读", "英语学习"],
      "createdAt": "2026-01-13T05:02:32.873Z"
    }
  ]
}
```

#### 7.4 获取分类列表

**请求**
```
GET /api/categories
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat-1",
      "name": "阅读",
      "chineseName": "阅读",
      "description": "阅读相关内容"
    },
    {
      "id": "cat-2",
      "name": "listening",
      "chineseName": "听力",
      "description": "听力相关内容"
    }
  ]
}
```

---

## 错误处理

### 错误响应格式
```json
{
  "success": false,
  "error": "错误信息"
}
```

### 常见错误

| 错误 | 状态码 | 描述 |
|------|--------|------|
| 无效的URL | 400 | URL格式不正确或为空 |
| 内容为空 | 400 | 提交的内容为空 |
| 文件过大 | 413 | 文件大小超过50MB限制 |
| 不支持的文件类型 | 400 | 上传的文件类型不支持 |
| 提取失败 | 500 | 无法从链接提取内容 |
| 分析失败 | 500 | LLM分析失败 |
| 数据库错误 | 500 | 数据库操作失败 |

---

## 认证

当前API不需要认证。生产环境建议添加API密钥或JWT认证。

---

## 速率限制

- 每分钟最多100个请求
- 每小时最多5000个请求
- 大文件上传限制：50MB

---

## 示例代码

### Python
```python
import requests

url = "http://localhost:3000/api/smart-analysis/link"
data = {"url": "http://xhslink.com/o/n9cg7NeWIf"}

response = requests.post(url, json=data)
result = response.json()

if result['success']:
    print(f"标题: {result['data']['title']}")
    print(f"问题: {result['data']['analysis']['problem']}")
else:
    print(f"错误: {result['error']}")
```

### JavaScript
```javascript
const url = "http://localhost:3000/api/smart-analysis/link";
const data = { url: "http://xhslink.com/o/n9cg7NeWIf" };

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data)
})
  .then(res => res.json())
  .then(result => {
    if (result.success) {
      console.log(`标题: ${result.data.title}`);
      console.log(`问题: ${result.data.analysis.problem}`);
    } else {
      console.error(`错误: ${result.error}`);
    }
  });
```

### cURL
```bash
curl -X POST http://localhost:3000/api/smart-analysis/link \
  -H "Content-Type: application/json" \
  -d '{"url":"http://xhslink.com/o/n9cg7NeWIf"}'
```

---

## 更新日志

### v1.1.0 (2026-01-13)
- ✅ 修复小红书链接内容提取
- ✅ 集成ScrapeOps代理服务
- ✅ 改进LLM分析
- ✅ 添加知识库功能

### v1.0.0 (2026-01-01)
- ✅ 初始版本发布
- ✅ 支持多平台链接提取
- ✅ LLM内容分析
- ✅ 文档上传和分析

---

## 支持

如有任何问题或建议，请联系开发团队。
