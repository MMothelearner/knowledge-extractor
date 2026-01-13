const axios = require('axios');
const cheerio = require('cheerio');

/**
 * 链接处理器 - 处理不同平台的链接内容提取
 */
class LinkProcessor {
  /**
   * 处理YouTube链接
   */
  static async handleYoutube(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // 提取标题
      const title = $('meta[name="title"]').attr('content') || 
                   $('meta[property="og:title"]').attr('content') || 
                   $('title').text();

      // 提取描述
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || '';

      // 提取视频ID
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';

      return {
        type: 'youtube_video',
        title: title,
        description: description,
        videoId: videoId,
        url: url,
        source: 'youtube'
      };
    } catch (error) {
      console.error('YouTube error:', error.message);
      throw new Error(`Error handling YouTube link: ${error.message}`);
    }
  }

  /**
   * 处理Bilibili链接
   */
  static async handleBilibili(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // 提取标题
      const title = $('meta[name="title"]').attr('content') || 
                   $('meta[property="og:title"]').attr('content') || 
                   $('title').text();

      // 提取描述
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || '';

      // 提取视频ID
      const videoIdMatch = url.match(/\/video\/(BV[^/?]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';

      return {
        type: 'bilibili_video',
        title: title,
        description: description,
        videoId: videoId,
        url: url,
        source: 'bilibili'
      };
    } catch (error) {
      console.error('Bilibili error:', error.message);
      throw new Error(`Error handling Bilibili link: ${error.message}`);
    }
  }

  /**
   * 处理小红书链接 - 使用ScrapeOps Proxy API
   */
  static async handleXiaohongshu(url) {
    try {
      const apiKey = process.env.SCRAPEOPS_API_KEY;
      if (!apiKey) {
        throw new Error('SCRAPEOPS_API_KEY not configured');
      }

      // 使用ScrapeOps Proxy API获取页面内容
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

      const html = response.data;
      
      // 提取标题
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(' - 小红书', '').trim() : '小红书笔记';

      // 提取描述 - 优先使用og:description
      let description = '';
      const ogDescMatch = html.match(/<meta\s+property=['"]og:description['"\s][^>]*content=['"]([^'"]*)['"][^>]*>/i);
      if (ogDescMatch) {
        description = ogDescMatch[1];
      } else {
        const descMatch = html.match(/<meta\s+name=['"]description['"\s][^>]*content=['"]([^'"]*)['"][^>]*>/i);
        if (descMatch) {
          description = descMatch[1];
        }
      }

      // 提取主要内容
      let content = '';
      
      // 方法一：直接从标题中提取（标题就是笔记内容）
      if (title && title.length > 5) {
        content = title;
      }
      
      // 方法二：从JavaScript数据中提取其他内容
      if (!content.trim()) {
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
      }
      
      // 方法三：传统正则提取（后备）
      if (!content.trim()) {
        const contentPatterns = [
          /<div[^>]*class=['"]([^'"]*desc[^'"]*)['"\s][^>]*>([^<]+)<\/div>/gi,
          /<div[^>]*class=['"]([^'"]*content[^'"]*)['"\s][^>]*>([^<]+)<\/div>/gi,
          /<p[^>]*>([^<]+)<\/p>/gi
        ];

        for (const pattern of contentPatterns) {
          let match;
          while ((match = pattern.exec(html)) !== null) {
            const text = (match[2] || match[1] || '').trim();
            if (text && text.length > 5 && !text.match(/^<|>$/) && !text.match(/javascript|function|var|const/i)) {
              content += text + '\n';
            }
          }
          if (content.length > 100) break;
        }
      }

      // 如果没有提取到内容，使用通用方法
      if (!content.trim()) {
        const result = this.extractWebpageContent(html, url);
        return {
          ...result,
          type: 'xiaohongshu_post',
          title: title || result.title,
          description: description || result.description
        };
      }

      return {
        type: 'xiaohongshu_post',
        title: title,
        description: description,
        content: content.trim(),
        url: url,
        source: 'xiaohongshu'
      };
    } catch (error) {
      console.error('Xiaohongshu error:', error.message);
      throw new Error(`Error handling Xiaohongshu link: ${error.message}`);
    }
  }

  /**
   * 处理通用网页链接
   */
  static async handleWebpage(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      return this.extractWebpageContent(response.data, url);
    } catch (error) {
      console.error('Webpage error:', error.message);
      throw new Error(`Error handling webpage link: ${error.message}`);
    }
  }

  /**
   * 从网页HTML中提取内容
   */
  static extractWebpageContent(html, url) {
    const $ = cheerio.load(html);
    
    // 提取标题
    const title = $('meta[name="title"]').attr('content') || 
                 $('meta[property="og:title"]').attr('content') || 
                 $('title').text() || 
                 'Untitled';

    // 提取描述
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || '';

    // 提取主要内容
    let content = '';
    
    // 移除脚本和样式
    $('script, style').remove();
    
    // 尝试从article、main、content等主要内容容器中提取
    const mainContent = $('article, main, [role="main"], .content, .post-content, .entry-content');
    if (mainContent.length > 0) {
      content = mainContent.text().trim();
    } else {
      // 回退到提取所有文本
      content = $('body').text().trim();
    }

    // 清理内容
    content = content
      .replace(/\s+/g, ' ')
      .substring(0, 500)
      .trim();

    return {
      type: 'webpage',
      title: title,
      description: description,
      content: content,
      url: url,
      source: 'webpage'
    };
  }

  /**
   * 根据URL类型路由到相应的处理器
   */
  static async processLink(url) {
    try {
      // 识别URL类型
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return await this.handleYoutube(url);
      } else if (url.includes('bilibili.com') || url.includes('b23.tv')) {
        return await this.handleBilibili(url);
      } else if (url.includes('xiaohongshu.com') || url.includes('xhslink.com')) {
        return await this.handleXiaohongshu(url);
      } else {
        return await this.handleWebpage(url);
      }
    } catch (error) {
      console.error('Link processing error:', error.message);
      throw error;
    }
  }
}

module.exports = LinkProcessor;
