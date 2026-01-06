# Knowledge Extractor - 详细使用指南

## 目录

1. [系统启动](#系统启动)
2. [Web界面使用](#web界面使用)
3. [API调用](#api调用)
4. [实际案例](#实际案例)
5. [常见问题](#常见问题)

---

## 系统启动

### 步骤1：获取LLM API密钥

**从Manus平台获取：**

1. 登录您的Manus账户
2. 进入 **Settings** → **Secrets**
3. 查找 `BUILT_IN_FORGE_API_KEY` 或创建新密钥
4. 复制密钥值（看起来像：`sk-...`）

### 步骤2：配置环境变量

**方式A：编辑.env文件**

```bash
# 打开 .env 文件
nano .env

# 找到这一行并替换
LLM_API_KEY=your_manus_api_key_here

# 改为
LLM_API_KEY=sk-your_actual_key_here

# 保存（Ctrl+O, Enter, Ctrl+X）
```

**方式B：使用命令行**

```bash
# 设置环境变量
export LLM_API_KEY=sk-your_actual_key_here

# 然后启动服务
npm start
```

### 步骤3：启动服务

```bash
# 进入项目目录
cd knowledge_extractor

# 安装依赖（如果还没安装）
npm install

# 启动服务
npm start

# 您应该看到：
# Knowledge Extractor is running on http://localhost:3000
```

### 步骤4：打开Web界面

在浏览器中打开：
```
http://localhost:3000
```

您应该看到Knowledge Extractor的首页。

---

## Web界面使用

### 首页概览

首页显示：
- 📊 **系统统计** - 已分析的知识点、文档、链接数量
- 🎯 **快速操作** - 上传文档、分析文本、处理链接
- 📚 **知识库** - 已保存的知识点列表

### 方式1：上传文档分析

**适用场景**：分析PDF、Word文档、Markdown文件等

**步骤：**

1. **点击"上传文档"按钮**
   - 或直接拖拽文件到上传区域

2. **选择文件**
   - 支持格式：PDF、TXT、MD
   - 文件大小：<50MB（可配置）

3. **等待分析**
   - 系统会显示进度
   - LLM会自动分析内容

4. **查看结果**
   - **问题**：文档解决的核心问题
   - **方法**：具体的解决方法（多个）
   - **关键词**：核心概念
   - **总结**：内容精炼总结
   - **思维导图**：可视化的Mermaid图表

5. **保存或导出**
   - 点击"保存"将结果存入知识库
   - 点击"导出"选择格式（JSON/Markdown/CSV/HTML）

**示例：上传《格格爸一本通》第15章**

```
1. 点击"上传文档"
2. 选择 15章.pdf
3. 等待分析（通常需要10-30秒）
4. 查看分析结果
5. 如果满意，点击"保存"
```

### 方式2：分析文本

**适用场景**：分析一段文字、笔记、总结等

**步骤：**

1. **点击"分析文本"按钮**

2. **粘贴或输入文本**
   - 可以是任何长度的文本
   - 支持中文、英文等多语言

3. **点击"分析"按钮**

4. **等待结果**
   - 系统会调用LLM进行分析

5. **查看和保存结果**
   - 同上

**示例：分析一段教学笔记**

```
输入文本：
"KET写作考试要求学生能够写简单的邮件、明信片、表格等。
关键是要掌握基本的写作结构：开头、正文、结尾。
常用的表达包括问候语、过渡词、结尾语等。
建议学生每周写2-3篇练习，并请老师批改。"

点击分析后，系统会返回：
- 问题：如何备考KET写作
- 方法：掌握写作结构、积累常用表达、定期练习
- 关键词：KET、写作、结构、表达
- 思维导图：可视化的学习路径
```

### 方式3：处理链接

**适用场景**：分析网页、视频内容等

**步骤：**

1. **点击"处理链接"按钮**

2. **输入URL**
   - 可以是网页链接
   - 也可以是视频链接（YouTube等）

3. **点击"提取"按钮**

4. **等待提取和分析**
   - 系统会提取网页/视频内容
   - 然后进行LLM分析

5. **查看结果**
   - 同上

**示例：分析一个英语学习网站**

```
输入URL：https://www.bbc.com/learningenglish

系统会：
1. 提取网页内容
2. 识别主要内容
3. 生成分析结果
4. 显示思维导图
```

### 查看知识库

**浏览已保存的知识点：**

1. **点击"知识库"标签**

2. **浏览列表**
   - 显示所有已保存的知识点
   - 每个知识点显示：问题、来源、保存时间

3. **搜索**
   - 使用搜索框查找特定知识点
   - 支持按问题、关键词搜索

4. **查看详情**
   - 点击知识点查看完整信息
   - 包括方法、关键词、思维导图

5. **导出**
   - 选择多个知识点
   - 批量导出为JSON或Markdown

---

## API调用

### 基础URL

```
http://localhost:3000
```

### 1. 上传文档分析

**端点**：`POST /api/smart-analysis/upload`

**请求**：
```bash
curl -X POST http://localhost:3000/api/smart-analysis/upload \
  -F "file=@/path/to/document.pdf"
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
      "methods": [
        "掌握基本写作结构",
        "积累常用表达",
        "定期练习和反馈"
      ],
      "keywords": ["KET", "写作", "备考"],
      "summary": "介绍了KET写作备考的系统方法...",
      "mindmap": "mindmap\n  root((如何备考KET写作))\n    ..."
    }
  }
}
```

### 2. 分析文本

**端点**：`POST /api/smart-analysis/text`

**请求**：
```bash
curl -X POST http://localhost:3000/api/smart-analysis/text \
  -H "Content-Type: application/json" \
  -d '{
    "content": "要分析的文本内容",
    "contentType": "text"
  }'
```

**Python示例**：
```python
import requests
import json

url = "http://localhost:3000/api/smart-analysis/text"
data = {
    "content": "KET写作考试要求...",
    "contentType": "text"
}

response = requests.post(url, json=data)
result = response.json()

print(f"问题：{result['data']['analysis']['problem']}")
print(f"方法：{result['data']['analysis']['methods']}")
print(f"思维导图：\n{result['data']['analysis']['mindmap']}")
```

### 3. 处理链接

**端点**：`POST /api/smart-analysis/link`

**请求**：
```bash
curl -X POST http://localhost:3000/api/smart-analysis/link \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com"
  }'
```

### 4. 获取系统统计

**端点**：`GET /api/stats`

**请求**：
```bash
curl http://localhost:3000/api/stats
```

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

---

## 实际案例

### 案例1：分析《格格爸一本通》第15章

**目标**：提炼第15章关于教材体系的核心内容

**步骤**：

1. 打开Knowledge Extractor
2. 点击"上传文档"
3. 选择 `15章.pdf`
4. 等待分析完成
5. 查看结果：
   - **问题**：如何选择合适的英语教材
   - **方法**：
     - 根据学生水平选择教材
     - 结合分级阅读和原版教材
     - 定期更新和调整教材
   - **关键词**：教材、分级、原版、选择
   - **思维导图**：显示教材选择的决策树

6. 点击"保存"存入知识库

### 案例2：分析多个学生的学习笔记

**目标**：整理学生的学习反馈

**步骤**：

1. 收集学生笔记
2. 逐个使用"分析文本"功能
3. 系统自动识别：
   - 学生遇到的问题
   - 他们的解决方法
   - 学习中的关键点
4. 所有结果自动保存到知识库
5. 后续可以搜索和对比

### 案例3：建立教学资源库

**目标**：为英语学习APP建立知识库

**步骤**：

1. 上传所有教学资源：
   - 《格格爸一本通》的各章节
   - 教学笔记和总结
   - 学生案例和反馈
   - 相关网页和视频链接

2. 系统自动分析和整理

3. 导出为JSON格式：
   ```bash
   # 在知识库中选择所有知识点
   # 点击"导出为JSON"
   # 获得完整的知识库数据
   ```

4. 将JSON导入到英语学习APP
   - APP可以调用这些数据
   - 为学生生成个性化计划
   - 推荐合适的资源

---

## 常见问题

### Q1：如何处理超大文件？

**问题**：PDF文件超过50MB

**解决方案**：

方案A：分割文件
```bash
# 使用PDF工具分割
# 然后逐个上传分析
```

方案B：修改配置
```bash
# 编辑 .env 文件
MAX_FILE_SIZE=100000000  # 改为100MB
```

### Q2：分析结果不满意怎么办？

**问题**：LLM的分析结果不准确或不符合预期

**解决方案**：

1. **手动编辑**
   - 在知识库中编辑结果
   - 修改问题、方法、关键词

2. **重新分析**
   - 删除不满意的结果
   - 重新上传文件
   - 或者修改文本后重新分析

3. **提供反馈**
   - 记录不满意的案例
   - 帮助改进系统

### Q3：如何批量处理多个文件？

**问题**：需要分析多个PDF文件

**解决方案**：

方案A：Web界面逐个上传
```bash
1. 上传文件1
2. 等待完成
3. 上传文件2
4. 等待完成
# ...
```

方案B：使用脚本批量调用API
```bash
#!/bin/bash
for file in *.pdf; do
  curl -X POST http://localhost:3000/api/smart-analysis/upload \
    -F "file=@$file"
done
```

### Q4：如何导出知识库？

**问题**：需要备份或转移知识库

**解决方案**：

```bash
# 导出为JSON
curl http://localhost:3000/api/stats > stats.json

# 导出所有知识点
# 在Web界面中选择"导出"
# 选择格式（JSON/Markdown/CSV/HTML）
```

### Q5：系统运行缓慢怎么办？

**问题**：分析速度慢或API响应慢

**解决方案**：

1. **检查网络**
   - 确保网络连接正常
   - LLM API调用需要网络

2. **检查系统资源**
   - 关闭其他应用
   - 释放内存

3. **优化配置**
   - 减小文件大小
   - 分段处理大文件

### Q6：如何与英语学习APP集成？

**问题**：如何在APP中使用Knowledge Extractor的数据

**解决方案**：

1. **导出知识库为JSON**
   ```bash
   # 获取所有知识点
   curl http://localhost:3000/api/stats
   ```

2. **在APP中调用API**
   ```javascript
   // 在APP中调用Knowledge Extractor API
   const response = await fetch('http://knowledge-extractor-url/api/smart-analysis/text', {
     method: 'POST',
     body: JSON.stringify({ content: userInput })
   });
   ```

3. **使用分析结果生成计划**
   - 根据分析结果推荐资源
   - 生成学习计划

---

## 最佳实践

### 1. 内容准备

- 确保输入内容清晰明确
- 避免混合多个主题
- 提供足够的上下文

### 2. 结果验证

- 检查分析结果的准确性
- 手动调整不准确的部分
- 标记高质量的结果

### 3. 知识库维护

- 定期检查和更新
- 删除过时的信息
- 合并重复的知识点

### 4. 性能优化

- 使用缓存避免重复分析
- 异步处理大文件
- 定期清理过期数据

---

## 支持和反馈

如有问题或建议，请联系开发团队。

---

**最后更新**：2024年1月6日
