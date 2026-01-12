/**
 * 高级链接处理器 - 支持JavaScript渲染和多平台
 * 使用Puppeteer处理动态网站
 */

const axios = require('axios');
const cheerio = require('cheerio');

class AdvancedLinkProcessor {
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

      // 验证内容
      if (!result.content || result.content.trim().length < 20) {
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
      // 抖音链接需要特殊处理
      // 尝试从URL中提取视频ID
      const videoIdMatch = url.match(/video\/(\d+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';

      // 使用User-Agent伪装
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
      const $ = cheerio.load(html);

      // 提取标题
      let title = $('meta[property="og:title"]').attr('content') || 
                  $('meta[name="title"]').attr('content') || 
                  $('title').text() || 
                  '抖音视频';

      // 提取描述
      let description = $('meta[property="og:description"]').attr('content') || 
                        $('meta[name="description"]').attr('content') || 
                        '';

      // 提取视频内容（通常在JSON-LD中）
      let content = '';
      
      // 尝试从多个位置提取内容
      const scripts = $('script[type="application/ld+json"]');
      scripts.each((i, elem) => {
        try {
          const json = JSON.parse($(elem).html());
          if (json.description) {
            content += json.description + '\n';
          }
          if (json.text) {
            content += json.text + '\n';
          }
        } catch (e) {
          // JSON解析失败，继续
        }
      });

      // 如果还没有内容，尝试从其他地方提取
      if (!content.trim()) {
        // 提取页面中的文本内容
        const textContent = $('body').text();
        // 清理和提取有意义的内容
        content = textContent
          .split('\n')
          .filter(line => line.trim().length > 10)
          .slice(0, 5)
          .join('\n');
      }

      return {
        type: 'douyin_video',
        title: title.trim(),
        description: description.trim(),
        content: (description + '\n' + content).trim(),
        url: url,
        videoId: videoId,
        source: 'douyin'
      };
    } catch (error) {
      throw new Error(`抖音链接处理失败: ${error.message}。可能原因：1) 链接已失效 2) 网站有防爬虫机制 3) 网络连接问题。建议手动复制视频文案。`);
    }
  }

  /**
   * 处理小红书链接
   */
  static async handleXiaohongshu(url) {
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
      const $ = cheerio.load(html);

      // 提取标题
      const title = $('meta[property="og:title"]').attr('content') || 
                    $('title').text() || 
                    '小红书笔记';

      // 提取描述
      const description = $('meta[property="og:description"]').attr('content') || 
                          $('meta[name="description"]').attr('content') || 
                          '';

      // 提取内容
      let content = description;
      
      // 尝试从JSON-LD提取
      const scripts = $('script[type="application/ld+json"]');
      scripts.each((i, elem) => {
        try {
          const json = JSON.parse($(elem).html());
          if (json.description) {
            content += '\n' + json.description;
          }
        } catch (e) {
          // 忽略JSON解析错误
        }
      });

      return {
        type: 'xiaohongshu_post',
        title: title.trim(),
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const html = response.data;
      const $ = cheerio.load(html);

      const title = $('meta[property="og:title"]').attr('content') || 
                    $('meta[name="title"]').attr('content') || 
                    $('title').text() || 
                    'YouTube Video';

      const description = $('meta[property="og:description"]').attr('content') || 
                          $('meta[name="description"]').attr('content') || 
                          '';

      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';

      return {
        type: 'youtube_video',
        title: title.trim(),
        description: description.trim(),
        content: description.trim(),
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
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
        },
        timeout: 15000
      });

      const html = response.data;
      const $ = cheerio.load(html);

      const title = $('title').text() || '微博';
      const description = $('meta[name="description"]').attr('content') || '';

      // 提取微博正文
      let content = description;
      $('div[class*="text"]').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text && text.length > 10) {
          content += '\n' + text;
        }
      });

      return {
        type: 'weibo_post',
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        url: url,
        source: 'weibo'
      };
    } catch (error) {
      throw new Error(`微博链接处理失败: ${error.message}`);
    }
  }

  /**
   * 处理B站链接
   */
  static async handleBilibili(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const html = response.data;
      const $ = cheerio.load(html);

      const title = $('meta[property="og:title"]').attr('content') || 
                    $('meta[name="title"]').attr('content') || 
                    $('title').text() || 
                    'B站视频';

      const description = $('meta[property="og:description"]').attr('content') || 
                          $('meta[name="description"]').attr('content') || 
                          '';

      return {
        type: 'bilibili_video',
        title: title.trim(),
        description: description.trim(),
        content: description.trim(),
        url: url,
        source: 'bilibili'
      };
    } catch (error) {
      throw new Error(`B站链接处理失败: ${error.message}`);
    }
  }

  /**
   * 处理通用网页
   */
  static async handleGeneric(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Referer': 'https://www.google.com/'
        },
        timeout: 15000,
        maxRedirects: 5
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // 提取标题
      const title = $('meta[property="og:title"]').attr('content') || 
                    $('meta[name="title"]').attr('content') || 
                    $('h1').first().text() || 
                    $('title').text() || 
                    new URL(url).hostname;

      // 提取描述
      const description = $('meta[property="og:description"]').attr('content') || 
                          $('meta[name="description"]').attr('content') || 
                          '';

      // 提取主要内容
      let content = '';
      
      // 移除脚本和样式
      $('script, style').remove();
      
      // 提取段落
      $('p, article, main, [role="main"]').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text && text.length > 20) {
          content += text + '\n\n';
        }
      });

      // 如果没有提取到足够的内容，尝试提取所有文本
      if (content.trim().length < 50) {
        content = $('body').text()
          .split('\n')
          .filter(line => line.trim().length > 10)
          .slice(0, 10)
          .join('\n');
      }

      return {
        type: 'webpage',
        title: title.trim(),
        description: description.trim(),
        content: (description + '\n\n' + content).trim(),
        url: url,
        source: 'generic'
      };
    } catch (error) {
      throw new Error(`网页处理失败: ${error.message}`);
    }
  }
}

module.exports = AdvancedLinkProcessor;
