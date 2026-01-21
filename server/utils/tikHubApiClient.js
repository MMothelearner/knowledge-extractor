const axios = require('axios');

/**
 * TikHub API客户端
 * 用于调用TikHub.io的Douyin API获取视频信息
 */
class TikHubApiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.tikhub.io/api/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * 从抖音视频链接中提取视频ID
   */
  extractVideoId(url) {
    try {
      const patterns = [
        /v\.douyin\.com\/([A-Za-z0-9]+)/,
        /douyin\.com\/video\/(\d+)/,
        /douyin\.com\/share\/video\/(\d+)/,
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      logger.error('Error extracting video ID:', error);
      return null;
    }
  }

  /**
   * 获取抖音视频信息
   */
  async fetchVideoInfo(videoId) {
    try {
      console.log(`[TikHub] Fetching video info for video ID: ${videoId}`);

      const response = await this.client.get('/douyin/app/v3/fetch_one_video', {
        params: {
          video_id: videoId,
        },
      });

      if (response.status === 200 && response.data) {
        console.log(`[TikHub] Successfully fetched video info for video ID: ${videoId}`);
        return response.data;
      } else {
        console.error(`[TikHub] Failed to fetch video info: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error('[TikHub] Error fetching video info:', error.message);
      return null;
    }
  }

  /**
   * 从抖音视频链接获取完整的视频信息
   */
  async getVideoFromUrl(url) {
    try {
      console.log(`[TikHub] Processing Douyin URL: ${url}`);

      const videoId = this.extractVideoId(url);
      if (!videoId) {
        console.error('[TikHub] Failed to extract video ID from URL');
        return {
          success: false,
          error: 'Failed to extract video ID from URL',
        };
      }

      console.log(`[TikHub] Extracted video ID: ${videoId}`);

      const videoInfo = await this.fetchVideoInfo(videoId);
      if (!videoInfo) {
        return {
          success: false,
          error: 'Failed to fetch video info from TikHub API',
        };
      }

      const result = {
        success: true,
        videoId: videoId,
        title: videoInfo.title || videoInfo.desc || 'Untitled',
        description: videoInfo.desc || '',
        author: videoInfo.author?.nickname || 'Unknown',
        duration: videoInfo.duration || 0,
        playUrl: videoInfo.play_addr?.url_list?.[0] || videoInfo.video?.download_addr || null,
        coverUrl: videoInfo.cover?.url_list?.[0] || videoInfo.dynamic_cover?.url_list?.[0] || null,
        likes: videoInfo.statistics?.digg_count || 0,
        comments: videoInfo.statistics?.comment_count || 0,
        shares: videoInfo.statistics?.share_count || 0,
        views: videoInfo.statistics?.play_count || 0,
        rawData: videoInfo,
      };

      console.log(`[TikHub] Successfully extracted video info: ${result.title}`);
      return result;
    } catch (error) {
      console.error('[TikHub] Error in getVideoFromUrl:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = TikHubApiClient;
