/**
 * 抖音API客户端
 * 用于调用Douyin_TikTok_Download_API服务获取视频信息和下载链接
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

class DouyinApiClient {
  constructor() {
    // 从环境变量获取Douyin API服务地址
    this.apiBaseUrl = process.env.DOUYIN_API_URL || 'http://localhost:8000';
    this.timeout = 60000; // 60秒超时
    this.tempDir = path.join('/tmp', 'knowledge-extractor');
    
    // 确保临时目录存在
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 从抖音链接中提取视频ID
   * @param {string} url - 抖音链接
   * @returns {string} 视频ID
   */
  extractVideoId(url) {
    try {
      // 支持多种抖音链接格式
      // 格式1: https://v.douyin.com/XuFwigSIw8A/
      // 格式2: https://www.douyin.com/video/7372484719365098803
      // 格式3: 直接是ID
      
      if (url.includes('douyin.com/video/')) {
        const match = url.match(/video\/(\d+)/);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      // 如果是短链接，需要先获取重定向的真实链接
      if (url.includes('v.douyin.com')) {
        console.log(`[DouyinApiClient] 检测到短链接: ${url}`);
        // 这里需要使用Douyin API来解析短链接
        // 暂时返回错误
        throw new Error('短链接需要通过API解析');
      }
      
      // 如果直接是ID
      if (/^\d+$/.test(url)) {
        return url;
      }
      
      throw new Error(`无法从链接中提取视频ID: ${url}`);
    } catch (error) {
      console.error(`[DouyinApiClient] 提取视频ID失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取单个视频的详细信息
   * @param {string} videoIdOrUrl - 视频ID或URL
   * @returns {object} 视频信息
   */
  async fetchVideoInfo(videoIdOrUrl) {
    try {
      console.log(`[DouyinApiClient] 获取视频信息: ${videoIdOrUrl}`);
      
      let videoId = videoIdOrUrl;
      
      // 如果是URL，先提取ID
      if (videoIdOrUrl.includes('douyin.com') || videoIdOrUrl.includes('v.douyin.com')) {
        videoId = this.extractVideoId(videoIdOrUrl);
      }
      
      // 调用Douyin API获取视频信息
      const response = await axios.get(
        `${this.apiBaseUrl}/api/douyin/web/fetch_one_video`,
        {
          params: {
            aweme_id: videoId
          },
          timeout: this.timeout
        }
      );
      
      if (response.data && response.data.code === 200 && response.data.data) {
        const videoData = response.data.data;
        
        console.log(`[DouyinApiClient] 视频信息获取成功`);
        console.log(`  标题: ${videoData.desc || '未知'}`);
        console.log(`  作者: ${videoData.author?.nickname || '未知'}`);
        
        return {
          videoId: videoData.aweme_id || videoId,
          title: videoData.desc || '未知标题',
          description: videoData.desc || '',
          author: videoData.author?.nickname || '未知作者',
          duration: videoData.video?.duration || 0,
          createTime: videoData.create_time || 0,
          likeCount: videoData.statistics?.digg_count || 0,
          commentCount: videoData.statistics?.comment_count || 0,
          shareCount: videoData.statistics?.share_count || 0,
          downloadUrl: videoData.video?.download_addr || null,
          playUrl: videoData.video?.play_addr || null,
          coverUrl: videoData.video?.cover || null,
          rawData: videoData
        };
      } else {
        throw new Error(`API返回错误: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.error(`[DouyinApiClient] 获取视频信息失败: ${error.message}`);
      throw new Error(`无法获取视频信息: ${error.message}`);
    }
  }

  /**
   * 下载视频文件
   * @param {string} videoIdOrUrl - 视频ID或URL
   * @param {string} videoId - 用于文件名的ID
   * @returns {string} 视频文件路径
   */
  async downloadVideo(videoIdOrUrl, videoId) {
    try {
      console.log(`[DouyinApiClient] 开始下载视频: ${videoIdOrUrl}`);
      
      // 先获取视频信息
      const videoInfo = await this.fetchVideoInfo(videoIdOrUrl);
      
      if (!videoInfo.downloadUrl && !videoInfo.playUrl) {
        throw new Error('无法获取视频下载链接');
      }
      
      const downloadUrl = videoInfo.downloadUrl || videoInfo.playUrl;
      const outputPath = path.join(this.tempDir, `${videoId}.mp4`);
      
      console.log(`[DouyinApiClient] 下载链接: ${downloadUrl.substring(0, 100)}...`);
      console.log(`[DouyinApiClient] 输出路径: ${outputPath}`);
      
      // 使用curl或wget下载视频
      const command = `curl -L -o "${outputPath}" "${downloadUrl}" --connect-timeout 30 --max-time 300`;
      
      console.log(`[DouyinApiClient] 执行下载命令...`);
      execSync(command, {
        stdio: 'pipe',
        timeout: 300000 // 5分钟超时
      });
      
      // 检查文件是否存在且大小大于0
      if (!fs.existsSync(outputPath)) {
        throw new Error('下载失败: 文件不存在');
      }
      
      const fileSize = fs.statSync(outputPath).size;
      if (fileSize === 0) {
        throw new Error('下载失败: 文件大小为0');
      }
      
      console.log(`[DouyinApiClient] 视频下载成功: ${outputPath} (大小: ${(fileSize / 1024 / 1024).toFixed(2)}MB)`);
      
      return outputPath;
    } catch (error) {
      console.error(`[DouyinApiClient] 下载视频失败: ${error.message}`);
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
      console.log(`[DouyinApiClient] 从视频提取音频: ${videoPath}`);
      
      if (!fs.existsSync(videoPath)) {
        throw new Error(`视频文件不存在: ${videoPath}`);
      }
      
      const audioPath = path.join(this.tempDir, `${audioId}.mp3`);
      
      // 使用ffmpeg提取音频
      // 参数说明:
      // -i: 输入文件
      // -q:a 9: 音频质量（0-9，0最好）
      // -map a: 只提取音频流
      const command = `ffmpeg -i "${videoPath}" -q:a 9 -map a "${audioPath}" -y 2>&1`;
      
      console.log(`[DouyinApiClient] 执行ffmpeg命令...`);
      const output = execSync(command, {
        stdio: 'pipe',
        timeout: 300000,
        encoding: 'utf-8'
      });
      
      if (!fs.existsSync(audioPath)) {
        throw new Error('音频提取失败: 文件不存在');
      }
      
      const audioSize = fs.statSync(audioPath).size;
      console.log(`[DouyinApiClient] 音频提取成功: ${audioPath} (大小: ${(audioSize / 1024 / 1024).toFixed(2)}MB)`);
      
      return audioPath;
    } catch (error) {
      console.error(`[DouyinApiClient] 提取音频失败: ${error.message}`);
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
        console.log(`[DouyinApiClient] 删除视频文件: ${videoPath}`);
      }
      
      if (audioPath && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
        console.log(`[DouyinApiClient] 删除音频文件: ${audioPath}`);
      }
    } catch (error) {
      console.error(`[DouyinApiClient] 清理文件失败: ${error.message}`);
    }
  }

  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

module.exports = DouyinApiClient;
