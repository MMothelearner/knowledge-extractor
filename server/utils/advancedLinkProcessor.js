/**
 * 高级链接处理器 - 支持多平台
 * 所有链接都通过ScrapeOps代理处理，确保最高的成功率和反爬虫处理
 */

const axios = require('axios');

class AdvancedLinkProcessor {
  /**
   * 从HTML中提取meta标签内容
   */
  static extractMetaContent(html, property, fallbackName = null) {
    try {
      // 尝试提取property属性
      let match = html.match(new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']*?)["']`, 'i'));
      if (match && match[1]) return match[1];

      // 尝试提取name属性
      if (fallbackName) {
        match = html.match(new RegExp(`<meta\\s+name=["']${fallbackName}["']\\s+content=["']([^"']*?)["']`, 'i'));
        if (match && match[1]) return match[1];
      }

      return '';
    } catch (e) {
      return '';
    }
  }

  /**
   * 从HTML中提取title
   */
  static extractTitle(html) {
    try {
      const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return match ? match[1].trim() : '';
    } catch (e) {
      return '';
    }
  }

  /**
   * 从HTML中提取JSON-LD数据
   */
  static extractJsonLd(html) {
    try {
      const matches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi);
      if (!matches) return '';

      let content = '';
      for (const match of matches) {
        try {
          const jsonStr = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
          const json = JSON.parse(jsonStr);
          if (json.description) content += json.description + '\n';
          if (json.text) content += json.text + '\n';
        } catch (e) {
          // 忽略JSON解析错误
        }
      }
      return content.trim();
    } catch (e) {
      return '';
    }
  }

  /**
   * 从HTML中提取纯文本内容
   */
  static extractPlainText(html) {
    try {
      // 移除script和style标签
      let text = html.replace(/<script[^>]*>.*?<\/script>/gi, '');
      text = text.replace(/<style[^>]*>.*?<\/style>/gi, '');
      
      // 移除HTML标签
      text = text.replace(/<[^>]+>/g, '');
      
      // 解码HTML实体
      text = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&');
      
      // 清理空白
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 10);
      
      return lines.slice(0, 10).join('\n');
    } catch (e) {
      return '';
    }
  }

  /**
   * 使用ScrapeOps获取网页内容
   * 支持动态渲染、反爬虫规则处理、自动重试
   */
  static async fetchWithScrapeOps(url) {
    const scrapeOpsApiKey = process.env.SCRAPEOPS_API_KEY;
    
    if (!scrapeOpsApiKey) {
      throw new Error('ScrapeOps API密钥未配置');
    }

    try {
      console.log(`[ScrapeOps] 下载链接: ${url}`);
      
      // 使用ScrapeOps代理 - 正确的API端点
      const scrapeOpsUrl = 'https://proxy.scrapeops.io/v1/';
      
      const response = await axios.get(scrapeOpsUrl, {
        params: {
          'api_key': scrapeOpsApiKey,
          'url': url,
          'render_javascript': 'true',
          'timeout': '30'
        },
        timeout: 60000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.data) {
        throw new Error('ScrapeOps返回空数据');
      }

      console.log(`[ScrapeOps] 成功下载: ${url} (大小: ${response.data.length} 字节)`);
      return response.data;
    } catch (error) {
      console.error(`[ScrapeOps] 下载失败: ${error.message}`);
      throw new Error(`无法下载网页: ${error.message}`);
    }
  }

  /**
   * 获取链接内容 - 所有链接都使用ScrapeOps处理
   */
  static async fetchLinkContent(url) {
    try {
      // 检测网站类型
      const siteType = this.detectSiteType(url);
      console.log(`[LinkProcessor] 检测到网站类型: ${siteType}`);

      // 使用ScrapeOps获取HTML
      const html = await this.fetchWithScrapeOps(url);

      let result;
      
      switch (siteType) {
        case 'douyin':
          result = await this.handleDouyin(url, html);
          break;
        case 'xiaohongshu':
          result = await this.handleXiaohongshu(url, html);
          break;
        case 'youtube':
          result = await this.handleYouTube(url, html);
          break;
        case 'weibo':
          result = await this.handleWeibo(url, html);
          break;
        case 'bilibili':
          result = await this.handleBilibili(url, html);
          break;
        default:
          result = await this.handleGeneric(url, html);
      }

      // 验证内容
      if (!result.content || result.content.trim().length < 10) {
        throw new Error(`无法提取有效内容。网站类型: ${siteType}，提取的内容长度: ${result.content?.length || 0}`);
      }

      return result;
    } catch (error) {
      console.error('Error fetching link:', error.message);
      throw error;
    }
  }

  /**
   * 检测网站类型
   */
  static detectSiteType(url) {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('douyin.com') || urlLower.includes('v.douyin.com') || urlLower.includes('dy.')) {
      return 'douyin';
    } else if (urlLower.includes('xiaohongshu') || urlLower.includes('xhslink')) {
      return 'xiaohongshu';
    } else if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      return 'youtube';
    } else if (urlLower.includes('weibo.com') || urlLower.includes('weibo.cn')) {
      return 'weibo';
    } else if (urlLower.includes('bilibili.com') || urlLower.includes('b23.tv')) {
      return 'bilibili';
    }
    return 'generic';
  }

  /**
   * 处理抖音链接
   */
  static async handleDouyin(url, html) {
    try {
      const title = this.extractMetaContent(html, 'og:title') || 
                    this.extractTitle(html) || 
                    '抖音视频';

      const description = this.extractMetaContent(html, 'og:description', 'description') || '';
      const jsonLdContent = this.extractJsonLd(html);
      
      // 如果description为空，尝试从纯文本中提取
      let plainText = '';
      if (!description && !jsonLdContent) {
        plainText = this.extractPlainText(html);
      }
      
      // 构建content - 优先使用title和description
      const content = (title + '\n' + description + '\n' + jsonLdContent + '\n' + plainText)
        .split('\n')
        .filter(line => line.trim())
        .join('\n')
        .trim();

      return {
        type: 'douyin_video',
        title: title.trim(),
        description: description.trim(),
        content: content,
        url: url,
        source: 'douyin'
      };
    } catch (error) {
      throw new Error(`抖音链接处理失败: ${error.message}`);
    }
  }

  /**
   * 处理小红书链接
   */
  static async handleXiaohongshu(url, html) {
    try {
      // 提取标题
      let title = this.extractMetaContent(html, 'og:title') || 
                  this.extractTitle(html) || 
                  '小红书笔记';
      
      // 清理标题 - 移除"- 小红书"后缀
      if (title.includes('- 小红书')) {
        title = title.replace(/\s*-\s*小红书\s*$/, '').trim();
      }

      // 提取描述
      let description = this.extractMetaContent(html, 'og:description', 'description') || '';

      // 尝试从JavaScript数据中提取更多内容
      let jsContent = '';
      
      // 方法1: 查找desc字段
      const descMatch = html.match(/"desc":"([^"]*?)"/);
      if (descMatch && descMatch[1]) {
        jsContent = descMatch[1];
      }
      
      // 方法2: 查找content字段
      if (!jsContent) {
        const contentMatch = html.match(/"content":"([^"]*?)"/);
        if (contentMatch && contentMatch[1]) {
          jsContent = contentMatch[1];
        }
      }

      // 提取JSON-LD内容
      const jsonLdContent = this.extractJsonLd(html);
      
      // 如果仍然一无所获，尝试从纯文本中提取
      let plainText = '';
      if (!description && !jsContent && !jsonLdContent) {
        plainText = this.extractPlainText(html);
      }
      
      // 组合内容 - 优先使用title和description
      const content = (title + '\n' + description + '\n' + jsContent + '\n' + jsonLdContent + '\n' + plainText)
        .split('\n')
        .filter(line => line.trim())
        .join('\n')
        .trim();

      return {
        type: 'xiaohongshu_post',
        title: title.trim(),
        description: description.trim(),
        content: content,
        url: url,
        source: 'xiaohongshu'
      };
    } catch (error) {
      throw new Error(`小红书链接处理失败: ${error.message}`);
    }
  }

  /**
   * 处理YouTube链接
   */
  static async handleYouTube(url, html) {
    try {
      const title = this.extractMetaContent(html, 'og:title') || 
                    this.extractTitle(html) || 
                    'YouTube视频';

      const description = this.extractMetaContent(html, 'og:description', 'description') || '';

      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';

      const jsonLdContent = this.extractJsonLd(html);
      
      // 如果description为空，尝试从纯文本中提取
      let plainText = '';
      if (!description && !jsonLdContent) {
        plainText = this.extractPlainText(html);
      }
      
      // 构建content - 优先使用title和description
      const content = (title + '\n' + description + '\n' + jsonLdContent + '\n' + plainText)
        .split('\n')
        .filter(line => line.trim())
        .join('\n')
        .trim();

      return {
        type: 'youtube_video',
        title: title.trim(),
        description: description.trim(),
        content: content,
        url: url,
        videoId: videoId,
        source: 'youtube'
      };
    } catch (error) {
      throw new Error(`YouTube链接处理失败: ${error.message}`);
    }
  }

  /**
   * 处理微博链接
   */
  static async handleWeibo(url, html) {
    try {
      const title = this.extractTitle(html) || '微博';
      const description = this.extractMetaContent(html, 'og:description', 'description') || '';
      const jsonLdContent = this.extractJsonLd(html);
      const plainText = this.extractPlainText(html);

      const content = (description + '\n' + jsonLdContent + '\n' + plainText).trim();

      return {
        type: 'weibo_post',
        title: title.trim(),
        description: description.trim(),
        content: content,
        url: url,
        source: 'weibo'
      };
    } catch (error) {
      throw new Error(`微博链接处理失败: ${error.message}`);
    }
  }

  /**
   * 处理Bilibili链接
   */
  static async handleBilibili(url, html) {
    try {
      // 提取标题
      let title = this.extractMetaContent(html, 'og:title') || 
                  this.extractTitle(html) || 
                  'Bilibili视频';
      
      // 清理标题 - 移除"_哔哩哔哩_bilibili"后缀
      if (title.includes('_')) {
        title = title.split('_')[0].trim();
      }

      // 提取描述
      let description = this.extractMetaContent(html, 'og:description', 'description') || '';

      // 提取视频ID
      const videoIdMatch = url.match(/\/video\/(BV[^/?]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';

      // 提取JSON-LD内容
      const jsonLdContent = this.extractJsonLd(html);
      
      // 尝试从__INITIAL_STATE__中提取更多信息
      let initialStateContent = '';
      const initialStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[^;]+});/);
      if (initialStateMatch) {
        try {
          const initialState = JSON.parse(initialStateMatch[1]);
          if (initialState.videoData) {
            const videoData = initialState.videoData;
            if (videoData.title) title = videoData.title;
            // 只使用有意义的描述（不是"-"或空字符串）
            if (videoData.desc && videoData.desc.trim() && videoData.desc.trim() !== '-') {
              description = videoData.desc;
            }
          }
        } catch (e) {
          // 忽略JSON解析错误
        }
      }

      // 如果description仍然为空或无意义，尝试从纯文本中提取
      if (!description || description.trim() === '-' || description.trim().length === 0) {
        description = this.extractPlainText(html);
      }

      // 构建content - 优先使用title和description
      const content = (title + '\n' + description + '\n' + jsonLdContent + '\n' + initialStateContent)
        .split('\n')
        .filter(line => line.trim() && line.trim() !== '-')
        .join('\n')
        .trim();

      return {
        type: 'bilibili_video',
        title: title.trim(),
        description: description.trim(),
        content: content,
        url: url,
        videoId: videoId,
        source: 'bilibili'
      };
    } catch (error) {
      throw new Error(`Bilibili链接处理失败: ${error.message}`);
    }
  }

  /**
   * 处理通用网页
   */
  static async handleGeneric(url, html) {
    try {
      const title = this.extractMetaContent(html, 'og:title') || 
                    this.extractTitle(html) || 
                    'Web Page';

      const description = this.extractMetaContent(html, 'og:description', 'description') || '';

      const jsonLdContent = this.extractJsonLd(html);
      const plainText = this.extractPlainText(html);

      const content = (description + '\n' + jsonLdContent + '\n' + plainText).trim();

      return {
        type: 'webpage',
        title: title.trim(),
        description: description.trim(),
        content: content,
        url: url,
        source: 'generic'
      };
    } catch (error) {
      throw new Error(`网页处理失败: ${error.message}`);
    }
  }
}

module.exports = AdvancedLinkProcessor;
