# Knowledge Extractor

一个知识提炼和整理平台，支持上传文档、提交链接、自动提炼问题和方法、智能去重，并生成结构化知识。

## 项目结构

```
knowledge_extractor/
├── server/                 # 后端服务
│   ├── index.js           # 服务器入口
│   ├── routes/            # API路由
│   ├── controllers/        # 业务逻辑
│   ├── models/            # 数据模型
│   └── utils/             # 工具函数
├── public/                # 前端静态文件
├── uploads/               # 上传文件存储
├── data/                  # 数据存储（JSON）
└── package.json
```

## 功能特性

- ✅ 文档上传（PDF、Word、图片等）
- ✅ 链接提交（提取文本、视频字幕、下载文件）
- ✅ 自动提炼（识别问题、总结方法）
- ✅ 知识点管理（创建、编辑、删除）
- ✅ 智能去重（完全相同、相似但不同、相同问题不同方法）
- ✅ 思维导图生成（复杂步骤）
- ✅ 导出功能（Markdown、JSON、PDF）
- ✅ Web界面管理

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动服务

```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动

### 访问Web应用

打开浏览器访问 `http://localhost:3000`

## API文档

### 文档上传

```
POST /api/documents/upload
Content-Type: multipart/form-data

参数：
- file: 上传的文件
- title: 文档标题
- description: 文档描述
```

### 提交链接

```
POST /api/links/submit
Content-Type: application/json

参数：
- url: 链接地址
- title: 链接标题
- description: 链接描述
```

### 获取知识点

```
GET /api/knowledge-points
GET /api/knowledge-points/:id
```

### 创建知识点

```
POST /api/knowledge-points
Content-Type: application/json

参数：
- problem: 问题
- methods: 解决方法
- sources: 来源
- tags: 标签
- mindmap: 思维导图（可选）
```

### 编辑知识点

```
PUT /api/knowledge-points/:id
Content-Type: application/json
```

### 删除知识点

```
DELETE /api/knowledge-points/:id
```

### 导出知识点

```
GET /api/knowledge-points/export/:format
format: markdown | json | pdf
```

## 数据模型

### 知识点（Knowledge Point）

```json
{
  "id": "unique-id",
  "problem": "问题描述",
  "methods": ["方法1", "方法2"],
  "sources": [
    {
      "type": "document|link|manual",
      "title": "来源标题",
      "url": "来源URL（如果有）",
      "date": "2024-01-01"
    }
  ],
  "tags": ["标签1", "标签2"],
  "mindmap": "思维导图数据（可选）",
  "status": "draft|reviewed|published",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## 开发路线

### 第一阶段（MVP）
- [x] 项目初始化
- [ ] 系统架构设计
- [ ] 文档上传功能
- [ ] 链接处理功能
- [ ] 知识点存储和展示
- [ ] 去重逻辑
- [ ] 导出功能
- [ ] Web界面

### 第二阶段（优化）
- [ ] 自动分类和标签
- [ ] 自动关联识别
- [ ] 思维导图自动生成
- [ ] 高级搜索和过滤
- [ ] 性能优化

## 许可证

ISC
