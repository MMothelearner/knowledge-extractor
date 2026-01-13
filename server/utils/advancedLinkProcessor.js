/**
 * 高级链接处理器 - 支持多平台
 * 不使用cheerio，避免undici依赖问题
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
   * 获取链接内容 - 支持多平台
   */
  static async fetchLinkContent(url) {
    try {
      // 检测网站类型
      const siteType = this.detectSiteType(url);
      console.log(`检测到网站类型: ${siteType}`);

      let result;
      
      switch (siteType) {
        case 'douyin':
          result = await this.handleDouyin(url);
          break;
        case 'xiaohongshu':
          result = await this.handleXiaohongshu(url);
          break;
        case 'youtube':
          result = await this.handleYouTube(url);
          break;
        case 'weibo':
          result = await this.handleWeibo(url);
          break;
        case 'bilibili':
          result = await this.handleBilibili(url);
          break;
        default:
          result = await this.handleGeneric(url);
      }

      // 验证内容 - 小红书笔记标题通常较短，使用较低的阈值
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
    } else if (urlLower.includes('youtube') || urlLower.includes('youtu.be')) {
      return 'youtube';
    } else if (urlLower.includes('weibo') || urlLower.includes('m.weibo')) {
      return 'weibo';
    } else if (urlLower.includes('bilibili') || urlLower.includes('b23.tv')) {
      return 'bilibili';
    } else if (urlLower.includes('zhihu')) {
      return 'zhihu';
    } else if (urlLower.includes('juejin')) {
      return 'juejin';
    }
    return 'generic';
  }

  /**
   * 处理抖音链接
   */
  static async handleDouyin(url) {
    try {
      const videoIdMatch = url.match(/video\/(\d+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          'Referer': 'https://www.douyin.com/'
        },
        timeout: 15000,
        maxRedirects: 5
      });

      const html = response.data;

      const title = this.extractMetaContent(html, 'og:title') || 
                    this.extractTitle(html) || 
                    '抖音视频';

      const description = this.extractMetaContent(html, 'og:description', 'description') || '';

      const jsonLdContent = this.extractJsonLd(html);
      const plainText = this.extractPlainText(html);

      const content = (description + '\n' + jsonLdContent + '\n' + plainText).trim();

      return {
        type: 'douyin_video',
        title: title.trim(),
        description: description.trim(),
        content: content,
        url: url,
        videoId: videoId,
        source: 'douyin'
      };
    } catch (error) {
      throw new Error(`抖音链接处理失败: ${error.message}。可能原因：1) 链接已失效 2) 网站有防爬虫机制 3) 网络连接问题。建议手动复制视频文案。`);
    }
  }

  /**
   * 处理小红书链接 - 改进版本
   */
  static async handleXiaohongshu(url) {
    try {
      let html = '';
      
      // 尝试使用ScrapeOps代理
      const apiKey = process.env.SCRAPEOPS_API_KEY;
      if (apiKey) {
        try {
          console.log('使用ScrapeOps代理获取小红书内容...');
          const proxyUrl = 'https://proxy.scrapeops.io/v1/';
          const response = await axios.get(proxyUrl, {
            params: {
              api_key: apiKey,
              url: url
            },
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
          });
          html = response.data;
        } catch (proxyError) {
          console.warn('ScrapeOps代理失败，尝试直接访问:', proxyError.message);
          const response = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'zh-CN,zh;q=0.9'
            },
            timeout: 15000
          });
          html = response.data;
        }
      } else {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9'
          },
          timeout: 15000
        });
        html = response.data;
      }

      // 提取标题
      let title = this.extractMetaContent(html, 'og:title') || 
                  this.extractTitle(html) || 
                  '小红书笔记';
      
      // 清理标题
      title = title.replace(/\s*-\s*小红书\s*$/, '').trim();

      // 提取描述
      const description = this.extractMetaContent(html, 'og:description', 'description') || '';

      // 提取内容 - 优先使用标题作为内容
      let content = title.replace(/\s*-\s*小红书\s*$/, '').trim();
      
      // 如果标题太短或为空，尝试从其他地方提取
      if (content.length < 10) {
        // 方法一：从JavaScript数据中提取
        const dataMatches = html.match(/"desc":"([^"]*)"|"content":"([^"]*)"/g);
        if (dataMatches && dataMatches.length > 0) {
          for (const match of dataMatches) {
            const valueMatch = match.match(/"(?:desc|content)":"([^"]*)"/);  
            if (valueMatch && valueMatch[1]) {
              const text = valueMatch[1].trim();
              if (text.length > 10 && !text.match(/^\d+$/) && !text.match(/javascript|function|小红书/i)) {
                content = text;
                break;
              }
            }
          }
        }
        
        // 方法二：从JSON-LD中提取
        if (content.length < 20) {
          const jsonLdContent = this.extractJsonLd(html);
          if (jsonLdContent.length > 20) {
            content = jsonLdContent;
          }
        }
      }

      return {
        type: 'xiaohongshu_post',
        title: title,
        description: description.trim(),
        content: content.trim(),
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
  static async handleYouTube(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 15000
      });

      const html = response.data;

      const title = this.extractMetaContent(html, 'og:title') || 
                    this.extractTitle(html) || 
                    'YouTube视频';

      const description = this.extractMetaContent(html, 'og:description', 'description') || '';

      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';

      const jsonLdContent = this.extractJsonLd(html);
      const content = (description + '\n' + jsonLdContent).trim();

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
  static async handleWeibo(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9'
        },
        timeout: 15000
      });

      const html = response.data;

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
  static async handleBilibili(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.bilibili.com/'
        },
        timeout: 15000
      });

      const html = response.data;

      const title = this.extractMetaContent(html, 'og:title') || 
                    this.extractTitle(html) || 
                    'Bilibili视频';

      const description = this.extractMetaContent(html, 'og:description', 'description') || '';

      const videoIdMatch = url.match(/\/video\/(BV[^/?]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';

      const jsonLdContent = this.extractJsonLd(html);
      const content = (description + '\n' + jsonLdContent).trim();

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
  static async handleGeneric(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const html = response.data;

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
        source: 'webpage'
      };
    } catch (error) {
      throw new Error(`网页链接处理失败: ${error.message}`);
    }
  }
}

module.exports = AdvancedLinkProcessor;
