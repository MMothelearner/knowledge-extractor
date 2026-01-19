# Whisper音频转录方案 - 部署指南

## 概述

本指南说明如何在Railway上部署Whisper音频转录方案，用于替代ScrapeOps爬虫处理抖音、小红书等视频平台的内容提取。

## 架构

```
用户提交链接
    ↓
检测网站类型
    ↓
视频平台 (抖音/小红书/YouTube/Bilibili)
    ↓
Whisper方案：
  1. yt-dlp下载视频
  2. ffmpeg提取音频
  3. Whisper API转录
  4. 清理临时文件
    ↓
网页
    ↓
ScrapeOps爬虫（降级方案）
    ↓
LLM分析处理
```

## 部署步骤

### 1. 更新依赖

**package.json已更新**，包含以下新依赖：
- `yt-dlp-exec`: 视频下载工具
- `openai`: Whisper API客户端
- `fluent-ffmpeg`: 音频处理库
- `ffmpeg-static`: ffmpeg二进制文件（可选）

### 2. 配置系统依赖

**Dockerfile已更新**，自动安装：
- ffmpeg（音频视频处理）
- yt-dlp（视频下载）
- Python 3（yt-dlp依赖）

### 3. 配置环境变量

在Railway上设置以下环境变量：

#### 必需变量

```
OPENAI_API_KEY=sk-...  # OpenAI API密钥
```

#### 可选变量

```
# Whisper配置
WHISPER_ENABLED=true
WHISPER_LANGUAGE=zh
WHISPER_TIMEOUT=300
WHISPER_MAX_FILE_SIZE=25000000

# 视频下载配置
VIDEO_DOWNLOAD_TIMEOUT=300
VIDEO_MAX_SIZE=500000000
AUDIO_QUALITY=5

# ScrapeOps（降级方案）
SCRAPEOPS_API_KEY=your_key_here
```

### 4. 获取OpenAI API密钥

1. 访问 https://platform.openai.com/api-keys
2. 创建新的API密钥
3. 复制密钥值
4. 在Railway上设置为 `OPENAI_API_KEY` 环境变量

### 5. 部署到Railway

```bash
# 1. 提交更改到GitHub
git add .
git commit -m "feat: implement Whisper audio transcription for video platforms"
git push origin main

# 2. Railway会自动检测更改并部署
# 3. 在Railway仪表板上检查部署状态
```

## 测试

### 本地测试

```bash
# 1. 安装系统依赖
# Ubuntu/Debian:
sudo apt-get install ffmpeg python3 python3-pip
pip3 install yt-dlp

# macOS:
brew install ffmpeg python3
pip3 install yt-dlp

# 2. 配置环境变量
cp .env.example .env
# 编辑.env，填入OPENAI_API_KEY

# 3. 运行测试脚本
node test-whisper.js
```

### Railway上的测试

1. 部署完成后，访问Railway仪表板
2. 检查应用日志，确认没有错误
3. 使用API测试端点：

```bash
curl -X POST http://your-railway-url/api/extract \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.douyin.com/video/...",
    "type": "link"
  }'
```

## 故障排除

### 问题1：ffmpeg未找到

**症状**：错误信息 "ffmpeg not found"

**解决方案**：
- 检查Dockerfile是否正确安装了ffmpeg
- 在Railway上重新部署应用

### 问题2：yt-dlp下载失败

**症状**：错误信息 "Unable to download video"

**解决方案**：
- 检查视频链接是否有效
- yt-dlp可能需要更新（YouTube等平台经常更改反爬虫机制）
- 在Railway上运行：`pip3 install --upgrade yt-dlp`

### 问题3：Whisper API超时

**症状**：错误信息 "Whisper API timeout"

**解决方案**：
- 检查音频文件大小（限制25MB）
- 增加 `WHISPER_TIMEOUT` 环境变量值
- 检查OpenAI API状态（https://status.openai.com）

### 问题4：OpenAI API密钥无效

**症状**：错误信息 "Invalid API key"

**解决方案**：
- 确认API密钥正确复制（无多余空格）
- 检查API密钥是否有效（访问https://platform.openai.com/api-keys）
- 检查API密钥是否有足够的配额

## 性能优化

### 1. 音频质量调整

编辑 `server/utils/videoDownloader.js`，修改ffmpeg命令中的 `-q:a` 参数：
- `-q:a 0-1`: 最高质量（文件较大）
- `-q:a 5`: 中等质量（推荐）
- `-q:a 9`: 最低质量（文件较小）

### 2. 视频大小限制

编辑 `server/utils/videoDownloader.js`，修改yt-dlp命令中的文件大小限制：
```javascript
const command = `yt-dlp -f "best[filesize<500M]/best" ...`
```

### 3. 超时配置

根据网络速度调整超时时间：
```javascript
timeout: 300000 // 5分钟
```

## 成本估算

### OpenAI Whisper API定价

- 价格：$0.006 / 分钟音频
- 示例：
  - 10分钟视频 = $0.06
  - 1小时视频 = $0.36
  - 100小时视频 = $36

### 降级方案成本

如果Whisper失败，会自动降级到ScrapeOps爬虫：
- ScrapeOps：$99/月（起价）
- 建议：优先使用Whisper，ScrapeOps作为备选

## 监控和日志

### 查看日志

在Railway仪表板上：
1. 选择应用
2. 点击"Logs"标签
3. 搜索关键词：
   - `[Whisper]` - Whisper相关操作
   - `[VideoDownloader]` - 视频下载相关
   - `[LinkProcessor]` - 链接处理相关

### 关键日志示例

```
[Whisper] 开始处理视频: https://...
[VideoDownloader] 视频下载成功: /tmp/video_xxx.mp4
[VideoDownloader] 音频提取成功: /tmp/audio_xxx.mp3
[WhisperTranscriber] 转录成功，文本长度: 5000 字符
[Whisper] 转录成功，文本长度: 5000 字符
```

## 常见问题

**Q: Whisper支持哪些语言？**
A: Whisper支持99种语言，包括中文。自动检测或指定语言代码（如'zh'）。

**Q: 如果视频太长怎么办？**
A: Whisper API限制25MB，对应约1小时的MP3音频。超过此限制需要分割处理。

**Q: 能否离线使用Whisper？**
A: 可以，但需要下载模型（~3GB）。当前实现使用OpenAI API。

**Q: 如何处理多语言视频？**
A: 当前配置为中文（'zh'）。可以修改为自动检测或支持多语言。

## 下一步

1. **监控成本**：定期检查OpenAI API使用情况
2. **优化性能**：根据实际使用情况调整音频质量和超时时间
3. **扩展功能**：
   - 支持视频字幕提取（如果可用）
   - 支持多语言自动检测
   - 实现音频分割处理超长视频

## 参考资源

- [OpenAI Whisper API文档](https://platform.openai.com/docs/guides/speech-to-text)
- [yt-dlp文档](https://github.com/yt-dlp/yt-dlp)
- [FFmpeg文档](https://ffmpeg.org/documentation.html)
- [Railway文档](https://docs.railway.app/)
