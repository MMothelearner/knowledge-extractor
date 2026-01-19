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
      
      // 使用yt-dlp下载视频
      // 优先下载最高质量的视频，但限制大小（最多500MB）
      const command = `yt-dlp -f "best[filesize<500M]/best" -o "${outputPath}" "${url}"`;
      
      console.log(`[VideoDownloader] 执行命令: ${command}`);
      
      // 执行下载（同步）
      execSync(command, {
        stdio: 'pipe',
        timeout: 300000 // 5分钟超时
      });

      // 找到下载的文件
      const files = fs.readdirSync(this.tempDir);
      const videoFile = files.find(f => f.startsWith(videoId) && !f.endsWith('.mp3'));
      
      if (!videoFile) {
        throw new Error('视频下载失败：找不到下载的文件');
      }

      const videoPath = path.join(this.tempDir, videoFile);
      console.log(`[VideoDownloader] 视频下载成功: ${videoPath}`);
      
      return videoPath;
    } catch (error) {
      console.error(`[VideoDownloader] 下载失败: ${error.message}`);
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

      const audioPath = path.join(this.tempDir, `${audioId}.mp3`);
      
      // 使用ffmpeg提取音频
      // -q:a 5 = 中等质量（平衡大小和质量）
      const command = `ffmpeg -i "${videoPath}" -q:a 5 -n "${audioPath}" 2>&1`;
      
      console.log(`[VideoDownloader] 执行命令: ${command}`);
      
      execSync(command, {
        stdio: 'pipe',
        timeout: 300000 // 5分钟超时
      });

      if (!fs.existsSync(audioPath)) {
        throw new Error('音频提取失败：找不到输出文件');
      }

      const audioSize = fs.statSync(audioPath).size;
      console.log(`[VideoDownloader] 音频提取成功: ${audioPath} (大小: ${(audioSize / 1024 / 1024).toFixed(2)}MB)`);
      
      return audioPath;
    } catch (error) {
      console.error(`[VideoDownloader] 提取失败: ${error.message}`);
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
