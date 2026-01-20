/**
 * 视频下载和音频提取模块
 * 支持抖音、小红书、YouTube等平台
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const axios = require('axios');

class VideoDownloader {
  constructor() {
    this.tempDir = path.join('/tmp', 'knowledge-extractor');
    this.ensureTempDir();
  }

  /**
   * 确保临时目录存在
   */
  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 检查系统是否安装了必要的工具
   */
  checkDependencies() {
    const tools = ['ffmpeg', 'yt-dlp'];
    const missing = [];

    for (const tool of tools) {
      try {
        if (process.platform === 'win32') {
          execSync(`where ${tool}`, { stdio: 'ignore' });
        } else {
          execSync(`which ${tool}`, { stdio: 'ignore' });
        }
      } catch (e) {
        missing.push(tool);
      }
    }

    if (missing.length > 0) {
      throw new Error(`缺少必要的系统工具: ${missing.join(', ')}。请确保已安装ffmpeg和yt-dlp。`);
    }
  }

  /**
   * 下载视频文件
   * @param {string} url - 视频链接
   * @param {string} videoId - 视频ID（用于文件名）
   * @returns {string} 视频文件路径
   */
  async downloadVideo(url, videoId) {
    try {
      console.log(`[VideoDownloader] 开始下载视频: ${url}`);

      // 生成输出文件路径
      const outputPath = path.join(this.tempDir, `${videoId}.%(ext)s`);
      
      // 构建yt-dlp命令，添加反爬虫对策
      let command = `yt-dlp`;
      
      // 添加反爬虫参数
      command += ` --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"`;
      command += ` --referer "https://www.douyin.com/"`;
      command += ` --add-header "Accept-Language:zh-CN,zh;q=0.9"`;
      command += ` --add-header "Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"`;
      command += ` --add-header "Sec-Fetch-Dest:document"`;
      command += ` --add-header "Sec-Fetch-Mode:navigate"`;
      command += ` --add-header "Sec-Fetch-Site:none"`;
      
      // 添加抖音专用参数
      command += ` --no-check-certificate`;
      command += ` --no-warnings`;
      
      // 添加代理支持（如果需要）
      if (process.env.HTTP_PROXY) {
        command += ` --proxy "${process.env.HTTP_PROXY}"`;
      }
      
      // 视频格式选择：优先下载最高质量，限制大小
      command += ` -f "best[filesize<500M]/best"`;
      
      // 输出路径
      command += ` -o "${outputPath}"`;
      
      // 添加重试和超时参数
      command += ` --socket-timeout 30`;
      command += ` --retries 3`;
      command += ` --fragment-retries 3`;
      
      // 添加URL
      command += ` "${url}"`;
      
      console.log(`[VideoDownloader] 执行yt-dlp下载...`);
      
      // 执行下载（同步）
      const output = execSync(command, {
        stdio: 'pipe',
        timeout: 300000, // 5分钟超时
        encoding: 'utf-8'
      });
      
      console.log(`[VideoDownloader] yt-dlp输出: ${output.substring(0, 200)}...`);

      // 找到下载的文件
      const files = fs.readdirSync(this.tempDir);
      const videoFile = files.find(f => f.startsWith(videoId) && !f.endsWith('.mp3'));
      
      if (!videoFile) {
        throw new Error('视频下载失败：找不到下载的文件。可能是yt-dlp下载失败或文件格式不符合预期。');
      }

      const videoPath = path.join(this.tempDir, videoFile);
      const videoSize = fs.statSync(videoPath).size;
      console.log(`[VideoDownloader] 视频下载成功: ${videoPath} (大小: ${(videoSize / 1024 / 1024).toFixed(2)}MB)`);
      
      return videoPath;
    } catch (error) {
      console.error(`[VideoDownloader] 下载失败: ${error.message}`);
      console.error(`[VideoDownloader] 错误详情: ${error.stderr || error.stdout || ''}`);
      throw new Error(`无法下载视频: ${error.message}`);
    }
  }

  /**
   * 从视频中提取音频
   * @param {string} videoPath - 视频文件路径
   * @param {string} audioId - 音频ID（用于文件名）
   * @returns {string} 音频文件路径
   */
  async extractAudio(videoPath, audioId) {
    try {
      console.log(`[VideoDownloader] 开始提取音频: ${videoPath}`);

      if (!fs.existsSync(videoPath)) {
        throw new Error(`视频文件不存在: ${videoPath}`);
      }

      const audioPath = path.join(this.tempDir, `${audioId}.mp3`);
      
      // 使用ffmpeg提取音频
      // -vn: 禁用视频
      // -acodec libmp3lame: 使用mp3编码器
      // -ab 128k: 音频比特率
      // -ar 16000: 采样率（Whisper优化）
      // -ac 1: 单声道
      // -y: 覆盖输出文件
      const command = `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -ab 128k -ar 16000 -ac 1 -y "${audioPath}" 2>&1`;
      
      console.log(`[VideoDownloader] 执行ffmpeg提取音频...`);
      
      const output = execSync(command, {
        stdio: 'pipe',
        timeout: 300000,
        encoding: 'utf-8'
      });
      
      console.log(`[VideoDownloader] ffmpeg输出: ${output.substring(0, 200)}...`);

      if (!fs.existsSync(audioPath)) {
        throw new Error('音频提取失败：找不到输出文件');
      }

      const audioSize = fs.statSync(audioPath).size;
      if (audioSize === 0) {
        throw new Error('音频文件为空：ffmpeg提取失败');
      }
      
      console.log(`[VideoDownloader] 音频提取成功: ${audioPath} (大小: ${(audioSize / 1024 / 1024).toFixed(2)}MB)`);
      
      return audioPath;
    } catch (error) {
      console.error(`[VideoDownloader] 提取失败: ${error.message}`);
      console.error(`[VideoDownloader] 错误详情: ${error.stderr || error.stdout || ''}`);
      throw new Error(`无法提取音频: ${error.message}`);
    }
  }

  /**
   * 清理临时文件
   * @param {string} videoPath - 视频文件路径
   * @param {string} audioPath - 音频文件路径
   */
  cleanupFiles(videoPath, audioPath) {
    try {
      if (videoPath && fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
        console.log(`[VideoDownloader] 删除临时视频文件: ${videoPath}`);
      }
      
      if (audioPath && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
        console.log(`[VideoDownloader] 删除临时音频文件: ${audioPath}`);
      }
    } catch (error) {
      console.warn(`[VideoDownloader] 清理文件失败: ${error.message}`);
    }
  }

  /**
   * 生成唯一的ID
   */
  generateId() {
    return `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取视频信息（标题、时长等）
   * @param {string} url - 视频链接
   * @returns {object} 视频信息
   */
  async getVideoInfo(url) {
    try {
      console.log(`[VideoDownloader] 获取视频信息: ${url}`);
      
      // 使用yt-dlp获取视频信息
      const command = `yt-dlp -j "${url}"`;
      const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
      
      const info = JSON.parse(output);
      
      return {
        title: info.title || '未知标题',
        duration: info.duration || 0,
        uploader: info.uploader || '未知上传者',
        description: info.description || '',
        url: info.webpage_url || url
      };
    } catch (error) {
      console.error(`[VideoDownloader] 获取信息失败: ${error.message}`);
      return {
        title: '未知标题',
        duration: 0,
        uploader: '未知上传者',
        description: '',
        url: url
      };
    }
  }
}

module.exports = new VideoDownloader();
