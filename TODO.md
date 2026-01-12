# Knowledge Extractor - 项目TODO

## 已完成功能
- [x] 基础链接处理（抖音、小红书、YouTube等）
- [x] LLM分析功能
- [x] 文档上传功能
- [x] 修复cheerio依赖问题（移除cheerio，改用正则表达式）

## 我的知识库 - 新功能开发

### 阶段1：数据库设计与配置
- [ ] 设计PostgreSQL表结构
  - [ ] knowledge_entries 表（知识库条目）
  - [ ] categories 表（分类标签）
  - [ ] entry_categories 表（条目与分类的关系）
  - [ ] user_notes 表（用户笔记）
- [ ] 配置Railway PostgreSQL
- [ ] 创建数据库迁移脚本

### 阶段2：后端API开发
- [ ] 创建知识库条目CRUD接口
  - [ ] POST /api/knowledge-entries（创建）
  - [ ] GET /api/knowledge-entries（列表、搜索、筛选、排序）
  - [ ] GET /api/knowledge-entries/:id（详情）
  - [ ] PUT /api/knowledge-entries/:id（编辑）
  - [ ] DELETE /api/knowledge-entries/:id（删除）
- [ ] 创建分类标签接口
  - [ ] GET /api/categories（获取所有分类）
  - [ ] POST /api/categories（创建自定义分类）
- [ ] 创建导出接口
  - [ ] GET /api/knowledge-entries/:id/export（导出为PDF）
- [ ] 实现自动分类建议功能

### 阶段3：前端界面开发
- [ ] 创建"我的知识库"页面
  - [ ] 列表视图（显示所有条目）
  - [ ] 搜索功能（全文搜索）
  - [ ] 筛选功能（按类型、分类标签）
  - [ ] 排序功能（按标题A-Z）
- [ ] 创建条目详情页面
  - [ ] 显示完整信息（标题、来源、摘要、LLM分析、笔记等）
- [ ] 创建编辑页面
  - [ ] 编辑分类标签
  - [ ] 编辑用户笔记
- [ ] 创建删除确认对话
- [ ] 创建导出功能

### 阶段4：集成现有流程
- [ ] 修改"处理链接"流程
  - [ ] 处理完成后自动保存到知识库
  - [ ] 显示自动分类建议
  - [ ] 允许用户确认或修改分类
- [ ] 修改文档上传流程
  - [ ] 上传完成后自动保存到知识库

### 阶段5：测试与优化
- [ ] 单元测试（API）
- [ ] 集成测试（前后端）
- [ ] 性能优化（查询优化、缓存）
- [ ] 用户体验测试

### 阶段6：部署与交付
- [ ] 部署PostgreSQL到Railway
- [ ] 部署后端API
- [ ] 部署前端
- [ ] 验证所有功能正常运行
- [ ] 创建用户文档

## 预设分类标签（11个）
1. 语法 (Grammar)
2. 词汇 (Vocabulary)
3. 听力 (Listening)
4. 阅读 (Reading)
5. 写作 (Writing)
6. 口语 (Speaking)
7. 教学方法 (Teaching Methods)
8. 教材介绍 (Textbook Introduction)
9. 教材用法 (Textbook Usage)
10. 教材适合人群 (Target Audience)
11. 考试准备 (Exam Prep)
+ 用户自定义分类

## 知识库条目数据结构
- 标题 (title)
- 来源 (source_url / file_name)
- 内容摘要 (summary)
- LLM分析结果 (llm_analysis: questions, solutions, keywords, mindmap)
- 分类标签 (categories: 可多个)
- 用户笔记 (user_notes)
- 创建日期 (created_at)
- 修改日期 (updated_at)
- 来源类型 (source_type: link / document)
