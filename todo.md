# Knowledge Extractor - 项目TODO

## 第一阶段 - MVP（已完成）

### 后端服务
- [x] 项目初始化和依赖安装
- [x] 数据模型设计（KnowledgePoint、Document、Link）
- [x] 文档处理工具（PDF、TXT、DOCX、图片）
- [x] 链接处理工具（网页、视频、文件）
- [x] 去重工具（完全相同、相似但不同、相同问题不同方法）
- [x] 导出工具（Markdown、JSON、CSV、HTML）
- [x] API路由（知识点、文档、链接）
- [x] 服务器启动和健康检查

### 前端界面
- [x] 首页（系统统计、快速导航）
- [x] 文档上传页面
- [x] 链接提交页面
- [x] 知识库管理页面
- [x] 共享样式文件

### 核心功能
- [x] 文档上传和处理
- [x] 链接提交和处理
- [x] 知识点创建和管理
- [x] 智能去重
- [x] 多格式导出
- [x] 搜索功能

## 第二阶段 - 优化和扩展

### 自动化功能
- [ ] 自动分类和标签
- [ ] 自动关联识别
- [ ] 思维导图自动生成
- [ ] 高级NLP处理

### 用户体验
- [ ] 知识点编辑功能
- [ ] 批量导入导出
- [ ] 高级搜索和过滤
- [ ] 知识点关联管理
- [ ] 修改历史查看

### 性能优化
- [ ] 缓存优化
- [ ] 数据库迁移（从JSON到真实数据库）
- [ ] 异步处理优化
- [ ] 前端性能优化

### 集成功能
- [ ] 与学习计划APP的集成
- [ ] API文档完善
- [ ] 推荐引擎初版
- [ ] 用户认证和权限管理

## 第三阶段 - 多平台视频内容提取系统（进行中）

### 重构TikHubApiClient
- [ ] 添加平台识别功能 - 根据URL自动识别平台类型
- [ ] 为每个平台添加ID提取方法
- [ ] 为每个平台添加API调用方法
- [ ] 统一返回数据格式

### 添加视频下载和Whisper转录
- [ ] 添加视频下载功能
- [ ] 集成Whisper转录音频
- [ ] 添加错误处理和重试机制

### 修改处理流程
- [ ] 修改handleDouyinWithApi使用新的TikHub客户端
- [ ] 修改handleXiaohongshuWithApi使用新的TikHub客户端
- [ ] 修改handleBilibiliWithApi使用新的TikHub客户端
- [ ] 修改handleYoutubeWithApi使用新的TikHub客户端
- [ ] 统一处理流程: TikHub API → 下载视频 → Whisper转录 → LLM分析

### 清理旧代码
- [ ] 删除旧的直接分析逻辑
- [ ] 清理不必要的代码

### 测试和部署
- [ ] 本地测试所有平台
- [ ] 提交代码到GitHub
- [ ] 在Railway上部署
- [ ] 验证功能正常

## 支持的平台和API端点

| 平台 | 端点 | 参数 |
|------|------|------|
| 抖音 | `/douyin/web/fetch_one_video` | `aweme_id` |
| 小红书 | `/xiaohongshu/web/get_note_info` | `note_id` |
| B站 | `/bilibili/web/fetch_one_video` | `bvid` |
| YouTube | `/youtube/web/get_video_info` | `video_id` |
| 微博 | `/weibo/app/fetch_user_info` | `user_id` |
| 微信公众号 | `/wechat_mp/web/fetch_mp_article_detail_json` | `url` |
| TikTok | `/tiktok/web/fetch_user_profile` | `unique_id` |

## Bug修复
- [ ] 大文件处理优化
- [ ] 链接超时处理
- [ ] 错误日志完善
- [ ] 前端错误处理

## 文档
- [ ] API文档完善
- [ ] 使用指南
- [ ] 部署指南
- [ ] 开发指南
