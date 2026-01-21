const axios = require('axios');

/**
 * TikHub API客户端 - 支持多平台
 * 支持的平台：抖音、小红书、B站、YouTube、微博、微信公众号、TikTok
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
   * 检测URL属于哪个平台
   */
  detectPlatform(url) {
    if (!url) return null;
    
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('douyin.com') || urlLower.includes('v.douyin.com')) {
      return 'douyin';
    } else if (urlLower.includes('xiaohongshu.com')) {
      return 'xiaohongshu';
    } else if (urlLower.includes('bilibili.com') || urlLower.includes('b23.tv')) {
      return 'bilibili';
    } else if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      return 'youtube';
    } else if (urlLower.includes('weibo.com') || urlLower.includes('t.cn')) {
      return 'weibo';
    } else if (urlLower.includes('mp.weixin.qq.com')) {
      return 'wechat';
    } else if (urlLower.includes('tiktok.com') || urlLower.includes('vm.tiktok.com')) {
      return 'tiktok';
    }
    
    return null;
  }

  /**
   * 从抖音视频链接中提取视频ID
   */
  extractDouyinVideoId(url) {
    try {
      const patterns = [
        /v\.douyin\.com\/([A-Za-z0-9]+)/,
        /douyin\.com\/video\/(\d+)/,
        /douyin\.com\/share\/video\/(\d+)/,
        /aweme\/v1\/feed.*video_id=([\d]+)/,
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      console.error('[TikHub] Error extracting Douyin video ID:', error);
      return null;
    }
  }

  /**
   * 从小红书链接中提取笔记ID
   */
  extractXiaohongshuNoteId(url) {
    try {
      const patterns = [
        /xiaohongshu\.com\/explore\/([A-Za-z0-9]+)/,
        /xiaohongshu\.com\/share\/([A-Za-z0-9]+)/,
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      console.error('[TikHub] Error extracting Xiaohongshu note ID:', error);
      return null;
    }
  }

  /**
   * 从B站链接中提取视频ID
   */
  extractBilibiliVideoId(url) {
    try {
      const patterns = [
        /bilibili\.com\/video\/(BV[A-Za-z0-9]+)/,
        /bilibili\.com\/video\/(av\d+)/,
        /b23\.tv\/([A-Za-z0-9]+)/,
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      console.error('[TikHub] Error extracting Bilibili video ID:', error);
      return null;
    }
  }

  /**
   * 从YouTube链接中提取视频ID
   */
  extractYoutubeVideoId(url) {
    try {
      const patterns = [
        /youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/,
        /youtu\.be\/([A-Za-z0-9_-]+)/,
        /youtube\.com\/embed\/([A-Za-z0-9_-]+)/,
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      console.error('[TikHub] Error extracting YouTube video ID:', error);
      return null;
    }
  }

  /**
   * 从微博链接中提取用户ID或微博ID
   */
  extractWeiboId(url) {
    try {
      const patterns = [
        /weibo\.com\/u\/(\d+)/,
        /weibo\.com\/(\d+)\/[A-Za-z0-9]+/,
        /t\.cn\/([A-Za-z0-9]+)/,
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      console.error('[TikHub] Error extracting Weibo ID:', error);
      return null;
    }
  }

  /**
   * 从TikTok链接中提取用户名或视频ID
   */
  extractTiktokId(url) {
    try {
      const patterns = [
        /tiktok\.com\/@([A-Za-z0-9_.-]+)/,
        /tiktok\.com\/video\/(\d+)/,
        /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      console.error('[TikHub] Error extracting TikTok ID:', error);
      return null;
    }
  }

  /**
   * 处理短链接重定向，获取真实的视频ID
   */
  async resolveShortLink(shortUrl, platform) {
    try {
      console.log(`[TikHub] Resolving short link for ${platform}: ${shortUrl}`);
      
      // 首先尝试使用TikHub API的短链接解析端点
      try {
        const endpoint = platform === 'douyin' ? '/douyin/web/v1/resolve_url' : null;
        
        if (endpoint) {
          const response = await this.client.get(endpoint, {
            params: {
              url: shortUrl,
            },
          });

          if (response.data && response.data.video_id) {
            console.log(`[TikHub] Resolved video ID via API: ${response.data.video_id}`);
            return response.data.video_id;
          }
        }
      } catch (apiError) {
        console.log(`[TikHub] TikHub API解析失败，尝试HTTP重定向...`);
      }

      // 如果API解析失败，尝试HTTP重定向
      try {
        const redirectResponse = await axios.head(shortUrl, {
          maxRedirects: 5,
          timeout: 10000,
          validateStatus: () => true,
        });

        if (redirectResponse.request && redirectResponse.request.path) {
          const redirectUrl = redirectResponse.request.path;
          console.log(`[TikHub] Redirected path: ${redirectUrl}`);
          
          // 根据平台重新提取ID
          let videoId = null;
          if (platform === 'douyin') {
            videoId = this.extractDouyinVideoId(redirectUrl);
          } else if (platform === 'bilibili') {
            videoId = this.extractBilibiliVideoId(redirectUrl);
          }
          
          if (videoId) {
            console.log(`[TikHub] Extracted ${platform} ID from redirect: ${videoId}`);
            return videoId;
          }
        }
      } catch (redirectError) {
        console.log(`[TikHub] HTTP重定向失败: ${redirectError.message}`);
      }

      return null;
    } catch (error) {
      console.error(`[TikHub] Error resolving short link: ${error.message}`);
      return null;
    }
  }

  /**
   * 获取抖音视频信息
   */
  async fetchDouyinVideoInfo(videoId) {
    try {
      console.log(`[TikHub] Fetching Douyin video info for video ID: ${videoId}`);

      const response = await this.client.get('/douyin/web/fetch_one_video', {
        params: {
          aweme_id: videoId,
        },
      });

      if (response.status === 200 && response.data && response.data.data && response.data.data.aweme_detail) {
        console.log(`[TikHub] Successfully fetched Douyin video info for video ID: ${videoId}`);
        return response.data.data.aweme_detail;
      } else {
        console.error(`[TikHub] Failed to fetch Douyin video info: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error('[TikHub] Error fetching Douyin video info:', error.message);
      return null;
    }
  }

  /**
   * 获取小红书笔记信息
   */
  async fetchXiaohongshuNoteInfo(noteId) {
    try {
      console.log(`[TikHub] Fetching Xiaohongshu note info for note ID: ${noteId}`);

      const response = await this.client.get('/xiaohongshu/web/get_note_info', {
        params: {
          note_id: noteId,
        },
      });

      if (response.status === 200 && response.data && response.data.data) {
        console.log(`[TikHub] Successfully fetched Xiaohongshu note info for note ID: ${noteId}`);
        return response.data.data;
      } else {
        console.error(`[TikHub] Failed to fetch Xiaohongshu note info: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error('[TikHub] Error fetching Xiaohongshu note info:', error.message);
      return null;
    }
  }

  /**
   * 获取B站视频信息
   */
  async fetchBilibiliVideoInfo(videoId) {
    try {
      console.log(`[TikHub] Fetching Bilibili video info for video ID: ${videoId}`);

      const response = await this.client.get('/bilibili/web/fetch_one_video', {
        params: {
          bvid: videoId,
        },
      });

      if (response.status === 200 && response.data && response.data.data) {
        console.log(`[TikHub] Successfully fetched Bilibili video info for video ID: ${videoId}`);
        return response.data.data;
      } else {
        console.error(`[TikHub] Failed to fetch Bilibili video info: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error('[TikHub] Error fetching Bilibili video info:', error.message);
      return null;
    }
  }

  /**
   * 获取YouTube视频信息
   */
  async fetchYoutubeVideoInfo(videoId) {
    try {
      console.log(`[TikHub] Fetching YouTube video info for video ID: ${videoId}`);

      const response = await this.client.get('/youtube/web/get_video_info', {
        params: {
          video_id: videoId,
        },
      });

      if (response.status === 200 && response.data && response.data.data) {
        console.log(`[TikHub] Successfully fetched YouTube video info for video ID: ${videoId}`);
        return response.data.data;
      } else {
        console.error(`[TikHub] Failed to fetch YouTube video info: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error('[TikHub] Error fetching YouTube video info:', error.message);
      return null;
    }
  }

  /**
   * 获取微博用户信息
   */
  async fetchWeiboUserInfo(userId) {
    try {
      console.log(`[TikHub] Fetching Weibo user info for user ID: ${userId}`);

      const response = await this.client.get('/weibo/app/fetch_user_info', {
        params: {
          user_id: userId,
        },
      });

      if (response.status === 200 && response.data && response.data.data) {
        console.log(`[TikHub] Successfully fetched Weibo user info for user ID: ${userId}`);
        return response.data.data;
      } else {
        console.error(`[TikHub] Failed to fetch Weibo user info: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error('[TikHub] Error fetching Weibo user info:', error.message);
      return null;
    }
  }

  /**
   * 获取TikTok用户信息
   */
  async fetchTiktokUserInfo(uniqueId) {
    try {
      console.log(`[TikHub] Fetching TikTok user info for unique ID: ${uniqueId}`);

      const response = await this.client.get('/tiktok/web/fetch_user_profile', {
        params: {
          unique_id: uniqueId,
        },
      });

      if (response.status === 200 && response.data && response.data.data) {
        console.log(`[TikHub] Successfully fetched TikTok user info for unique ID: ${uniqueId}`);
        return response.data.data;
      } else {
        console.error(`[TikHub] Failed to fetch TikTok user info: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error('[TikHub] Error fetching TikTok user info:', error.message);
      return null;
    }
  }

  /**
   * 从URL获取完整的视频/内容信息 - 自动检测平台
   */
  async getVideoFromUrl(url) {
    try {
      console.log(`[TikHub] Processing URL: ${url}`);

      const platform = this.detectPlatform(url);
      if (!platform) {
        console.error('[TikHub] Unable to detect platform from URL');
        return {
          success: false,
          error: 'Unable to detect platform from URL',
        };
      }

      console.log(`[TikHub] Detected platform: ${platform}`);

      // 根据平台提取ID
      let id = null;
      if (platform === 'douyin') {
        id = this.extractDouyinVideoId(url);
        if (url.includes('v.douyin.com') && id && id.length < 20) {
          const resolvedId = await this.resolveShortLink(url, platform);
          if (resolvedId) id = resolvedId;
        }
      } else if (platform === 'xiaohongshu') {
        id = this.extractXiaohongshuNoteId(url);
      } else if (platform === 'bilibili') {
        id = this.extractBilibiliVideoId(url);
      } else if (platform === 'youtube') {
        id = this.extractYoutubeVideoId(url);
      } else if (platform === 'weibo') {
        id = this.extractWeiboId(url);
      } else if (platform === 'wechat') {
        id = url; // 微信公众号使用完整URL
      } else if (platform === 'tiktok') {
        id = this.extractTiktokId(url);
      }

      if (!id) {
        console.error(`[TikHub] Failed to extract ID from URL for platform: ${platform}`);
        return {
          success: false,
          error: `Failed to extract ID from URL for platform: ${platform}`,
        };
      }

      console.log(`[TikHub] Using ${platform} ID: ${id}`);

      // 根据平台获取信息
      let videoInfo = null;
      if (platform === 'douyin') {
        videoInfo = await this.fetchDouyinVideoInfo(id);
      } else if (platform === 'xiaohongshu') {
        videoInfo = await this.fetchXiaohongshuNoteInfo(id);
      } else if (platform === 'bilibili') {
        videoInfo = await this.fetchBilibiliVideoInfo(id);
      } else if (platform === 'youtube') {
        videoInfo = await this.fetchYoutubeVideoInfo(id);
      } else if (platform === 'weibo') {
        videoInfo = await this.fetchWeiboUserInfo(id);
      } else if (platform === 'tiktok') {
        videoInfo = await this.fetchTiktokUserInfo(id);
      }

      if (!videoInfo) {
        return {
          success: false,
          error: `Failed to fetch ${platform} info from TikHub API`,
        };
      }

      // 统一返回格式
      const result = {
        success: true,
        platform: platform,
        id: id,
        title: this.extractTitle(videoInfo, platform),
        description: this.extractDescription(videoInfo, platform),
        author: this.extractAuthor(videoInfo, platform),
        duration: this.extractDuration(videoInfo, platform),
        playUrl: this.extractPlayUrl(videoInfo, platform),
        coverUrl: this.extractCoverUrl(videoInfo, platform),
        likes: this.extractLikes(videoInfo, platform),
        comments: this.extractComments(videoInfo, platform),
        shares: this.extractShares(videoInfo, platform),
        views: this.extractViews(videoInfo, platform),
        rawData: videoInfo,
      };

      console.log(`[TikHub] Successfully extracted ${platform} info: ${result.title}`);
      return result;
    } catch (error) {
      console.error('[TikHub] Error in getVideoFromUrl:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 从不同平台的数据中提取标题
   */
  extractTitle(data, platform) {
    if (!data) return 'Untitled';
    
    if (platform === 'douyin') {
      return data.desc || 'Untitled';
    } else if (platform === 'xiaohongshu') {
      return data.title || data.desc || 'Untitled';
    } else if (platform === 'bilibili') {
      return data.title || 'Untitled';
    } else if (platform === 'youtube') {
      return data.title || 'Untitled';
    } else if (platform === 'weibo') {
      return data.screen_name || 'Untitled';
    } else if (platform === 'tiktok') {
      return data.nickname || 'Untitled';
    }
    
    return 'Untitled';
  }

  /**
   * 从不同平台的数据中提取描述
   */
  extractDescription(data, platform) {
    if (!data) return '';
    
    if (platform === 'douyin') {
      return data.desc || '';
    } else if (platform === 'xiaohongshu') {
      return data.desc || '';
    } else if (platform === 'bilibili') {
      return data.desc || '';
    } else if (platform === 'youtube') {
      return data.description || '';
    } else if (platform === 'weibo') {
      return data.description || '';
    } else if (platform === 'tiktok') {
      return data.signature || '';
    }
    
    return '';
  }

  /**
   * 从不同平台的数据中提取作者
   */
  extractAuthor(data, platform) {
    if (!data) return 'Unknown';
    
    if (platform === 'douyin') {
      return data.author?.nickname || 'Unknown';
    } else if (platform === 'xiaohongshu') {
      return data.author?.nickname || 'Unknown';
    } else if (platform === 'bilibili') {
      return data.owner?.name || 'Unknown';
    } else if (platform === 'youtube') {
      return data.channel_title || 'Unknown';
    } else if (platform === 'weibo') {
      return data.screen_name || 'Unknown';
    } else if (platform === 'tiktok') {
      return data.nickname || 'Unknown';
    }
    
    return 'Unknown';
  }

  /**
   * 从不同平台的数据中提取时长（秒）
   */
  extractDuration(data, platform) {
    if (!data) return 0;
    
    if (platform === 'douyin') {
      return Math.floor((data.duration || 0) / 1000);
    } else if (platform === 'xiaohongshu') {
      return Math.floor((data.video?.duration || 0) / 1000);
    } else if (platform === 'bilibili') {
      return data.duration || 0;
    } else if (platform === 'youtube') {
      return data.duration || 0;
    }
    
    return 0;
  }

  /**
   * 从不同平台的数据中提取播放URL
   */
  extractPlayUrl(data, platform) {
    if (!data) return null;
    
    if (platform === 'douyin') {
      return data.video?.play_addr?.url_list?.[0] || null;
    } else if (platform === 'xiaohongshu') {
      return data.video?.url_list?.[0] || null;
    } else if (platform === 'bilibili') {
      return data.bvid || null;
    } else if (platform === 'youtube') {
      return data.video_id || null;
    }
    
    return null;
  }

  /**
   * 从不同平台的数据中提取封面URL
   */
  extractCoverUrl(data, platform) {
    if (!data) return null;
    
    if (platform === 'douyin') {
      return data.video?.cover?.url_list?.[0] || data.dynamic_cover?.url_list?.[0] || null;
    } else if (platform === 'xiaohongshu') {
      return data.cover?.url_list?.[0] || null;
    } else if (platform === 'bilibili') {
      return data.pic || null;
    } else if (platform === 'youtube') {
      return data.thumbnail_url || null;
    }
    
    return null;
  }

  /**
   * 从不同平台的数据中提取点赞数
   */
  extractLikes(data, platform) {
    if (!data) return 0;
    
    if (platform === 'douyin') {
      return data.statistics?.digg_count || 0;
    } else if (platform === 'xiaohongshu') {
      return data.interact_info?.liked || 0;
    } else if (platform === 'bilibili') {
      return data.stat?.like || 0;
    } else if (platform === 'youtube') {
      return data.like_count || 0;
    } else if (platform === 'weibo') {
      return data.attitudes_count || 0;
    }
    
    return 0;
  }

  /**
   * 从不同平台的数据中提取评论数
   */
  extractComments(data, platform) {
    if (!data) return 0;
    
    if (platform === 'douyin') {
      return data.statistics?.comment_count || 0;
    } else if (platform === 'xiaohongshu') {
      return data.interact_info?.comment || 0;
    } else if (platform === 'bilibili') {
      return data.stat?.reply || 0;
    } else if (platform === 'youtube') {
      return data.comment_count || 0;
    } else if (platform === 'weibo') {
      return data.comments_count || 0;
    }
    
    return 0;
  }

  /**
   * 从不同平台的数据中提取分享数
   */
  extractShares(data, platform) {
    if (!data) return 0;
    
    if (platform === 'douyin') {
      return data.statistics?.share_count || 0;
    } else if (platform === 'xiaohongshu') {
      return data.interact_info?.share || 0;
    } else if (platform === 'bilibili') {
      return data.stat?.share || 0;
    }
    
    return 0;
  }

  /**
   * 从不同平台的数据中提取浏览/播放数
   */
  extractViews(data, platform) {
    if (!data) return 0;
    
    if (platform === 'douyin') {
      return data.statistics?.play_count || 0;
    } else if (platform === 'xiaohongshu') {
      return data.interact_info?.view || 0;
    } else if (platform === 'bilibili') {
      return data.stat?.view || 0;
    } else if (platform === 'youtube') {
      return data.view_count || 0;
    } else if (platform === 'weibo') {
      return data.reposts_count || 0;
    }
    
    return 0;
  }
}

module.exports = TikHubApiClient;
