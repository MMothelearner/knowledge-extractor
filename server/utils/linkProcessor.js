const axios = require('axios');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const LLMAnalyzer = require('./llmAnalyzer');

// 使用stealth插件
puppeteer.use(StealthPlugin());

let browser = null;

// 初始化浏览器
async function getBrowser() {
  if (!browser) {
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
      });
    } catch (error) {
      console.error('Failed to launch browser:', error);
      throw error;
    }
  }
  return browser;
}

class LinkProcessor {
  /**
   * 获取链接内容
   */
  static async fetchLinkContent(url) {
    try {
      // 检测特殊网站
      const siteType = this.detectSiteType(url);
      
      let response;
      if (siteType === 'xiaohongshu') {
        return await this.handleXiaohongshu(url);
      } else if (siteType === 'youtube') {
        return await this.handleYouTube(url);
      } else if (siteType === 'weibo') {
        return await this.handleWeibo(url);
      } else if (siteType === 'bilibili') {
        return await this.handleBilibili(url);
      } else {
        // 通用网页处理
        response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': 'https://www.google.com/'
          },
          timeout: 15000,
          maxRedirects: 5
        });

        const contentType = response.headers['content-type'] || '';
        
        if (contentType.includes('text/html')) {
          return this.extractWebpageContent(response.data, url);
        } else if (contentType.includes('application/pdf')) {
          return this.handlePDFLink(response.data);
        } else if (contentType.includes('text/plain')) {
          return {
            type: 'text',
            title: new URL(url).hostname,
            content: response.data,
            url: url
          };
        } else {
          return {
            type: 'unknown',
            title: new URL(url).hostname,
            content: response.data.toString().substring(0, 2000),
            url: url
          };
        }
      }
    } catch (error) {
      throw new Error(`Error fetching link: ${error.message}`);
    }
  }

  /**
   * 检测网站类型
   */
  static detectSiteType(url) {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('xiaohongshu') || urlLower.includes('xhslink')) {
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
   * 处理小红书链接 - 使用Puppeteer执行JavaScript
   */
  static async handleXiaohongshu(url) {
    let page = null;
    try {
      const browser = await getBrowser();
      page = await browser.newPage();
      
      // 设置浏览器上下文
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15');
      await page.setViewport({ width: 375, height: 812 });
      
      // 导航到页面
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // 等待内容加载
      await page.waitForTimeout(2000);
      
      // 提取页面信息
      const pageData = await page.evaluate(() => {
        // 提取标题
        const titleEl = document.querySelector('title');
        const title = titleEl ? titleEl.textContent.replace(' - 小红书', '').trim() : '小红书笔记';
        
        // 提取描述
        const descEl = document.querySelector('meta[name="description"]');
        const description = descEl ? descEl.getAttribute('content') : '';
        
        // 提取笔记文本内容
        let content = '';
        
        // 尝试从各种可能的元素提取内容
        const selectors = [
          '.desc',
          '.content',
          '[class*="desc"]',
          '[class*="content"]',
          'p',
          'span[class*="text"]'
        ];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          for (const el of elements) {
            const text = el.textContent.trim();
            if (text && text.length > 5 && !text.includes('javascript')) {
              content += text + '\\n';
            }
          }
          if (content.length > 50) break;
        }
        
        return { title, description, content };
      });
      
      return {
        type: 'xiaohongshu_post',
        title: pageData.title,
        description: pageData.description,
        content: pageData.content.trim() || pageData.description,
        url: url,
        source: 'xiaohongshu'
      };
    } catch (error) {
      console.error('Xiaohongshu processing error:', error);
      // 失败时，回退到静态爬虫方法
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': 'https://www.xiaohongshu.com/',
          },
          timeout: 15000,
          maxRedirects: 10
        });
        
        const html = response.data;
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].replace(' - 小红书', '').trim() : '小红书笔记';
        const descMatch = html.match(/<meta\s+name=['"]description['"][^>]*content=['"]([^'"]*)['"][^>]*>/i);
        const description = descMatch ? descMatch[1] : '';
        
        return {
          type: 'xiaohongshu_post',
          title: title,
          description: description,
          content: description,
          url: url,
          source: 'xiaohongshu'
        };
      } catch (fallbackError) {
        throw new Error(`Error handling Xiaohongshu link: ${error.message}`);
      }
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  // ... 其他方法保持不变 ...
  
  static async handleYouTube(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const html = response.data;
      
      // 提取视频标题
      const titleMatch = html.match(/<meta\s+name=['"]title['"][^>]*content=['"]([^'"]*)['"]/i) ||
                         html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : 'YouTube Video';

      // 提取描述
      const descMatch = html.match(/<meta\s+name=['"]description['"][^>]*content=['"]([^'"]*)['"]/i);
      const description = descMatch ? descMatch[1] : '';

      // 提取视频ID
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';

      return {
        type: 'youtube_video',
        title: title,
        description: description,
        content: `YouTube视频: ${title}\n\n${description}\n\n视频ID: ${videoId}`,
        url: url,
        videoId: videoId,
        source: 'youtube'
      };
    } catch (error) {
      throw new Error(`Error handling YouTube link: ${error.message}`);
    }
  }

  static async handleWeibo(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
        },
        timeout: 15000
      });

      const html = response.data;
      
      // 提取微博内容
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '微博';

      // 提取正文
      let content = '';
      const textMatches = html.match(/<div[^>]*class=['"][^"]*text[^"]*['"][^>]*>([^<]+)<\/div>/gi) || [];
      textMatches.forEach(match => {
        const text = match.replace(/<[^>]+>/g, '').trim();
        if (text && text.length > 5) {
          content += text + '\n';
        }
      });

      return {
        type: 'weibo_post',
        title: title,
        content: content.trim() || '微博内容',
        url: url,
        source: 'weibo'
      };
    } catch (error) {
      throw new Error(`Error handling Weibo link: ${error.message}`);
    }
  }

  static async handleBilibili(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const html = response.data;
      
      // 提取视频标题
      const titleMatch = html.match(/<meta\s+property=['"]og:title['"][^>]*content=['"]([^'"]*)['"]/i) ||
                         html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace('_哔哩哔哩_bilibili', '').trim() : 'Bilibili Video';

      // 提取描述
      const descMatch = html.match(/<meta\s+property=['"]og:description['"][^>]*content=['"]([^'"]*)['"]/i);
      const description = descMatch ? descMatch[1] : '';

      return {
        type: 'bilibili_video',
        title: title,
        description: description,
        content: `B站视频: ${title}\n\n${description}`,
        url: url,
        source: 'bilibili'
      };
    } catch (error) {
      throw new Error(`Error handling Bilibili link: ${error.message}`);
    }
  }

  static extractWebpageContent(html, url) {
    try {
      // 移除脚本、样式和注释
      let cleanHtml = html.replace(/<script[^>]*>.*?<\/script>/gis, '');
      cleanHtml = cleanHtml.replace(/<style[^>]*>.*?<\/style>/gis, '');
      cleanHtml = cleanHtml.replace(/<!--.*?-->/gis, '');

      // 提取标题
      const titleMatch = cleanHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
      const h1Match = cleanHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const ogTitleMatch = cleanHtml.match(/<meta\s+property=['"]og:title['"][^>]*content=['"]([^'"]*)['"]/i);
      const title = ogTitleMatch ? ogTitleMatch[1] : (titleMatch ? titleMatch[1] : (h1Match ? h1Match[1] : 'Untitled'));

      // 提取元描述
      const descMatch = cleanHtml.match(/<meta\s+name=['"]description['"][^>]*content=['"]([^'"]*)['"]/i) ||
                        cleanHtml.match(/<meta\s+property=['"]og:description['"][^>]*content=['"]([^'"]*)['"]/i);
      const description = descMatch ? descMatch[1] : '';

      // 提取主要文本内容
      let content = '';
      const contentSelectors = [
        /<article[^>]*>(.+?)<\/article>/gis,
        /<main[^>]*>(.+?)<\/main>/gis,
        /<div[^>]*class=['"][^"]*content[^"]*['"][^>]*>(.+?)<\/div>/gis,
        /<(p|h[1-6]|li|blockquote)[^>]*>([^<]+)<\/\1>/gi,
        /<(div|span)[^>]*class=['"][^"]*text[^"]*['"][^>]*>([^<]+)<\/(div|span)>/gi
      ];

      for (const selector of contentSelectors) {
        let match;
        while ((match = selector.exec(cleanHtml)) !== null) {
          const text = match[match.length - 1] || match[1];
          const cleanText = text.replace(/<[^>]+>/g, '').trim();
          if (cleanText && cleanText.length > 3 && !cleanText.match(/^(javascript|function|var|const|let)/i)) {
            content += cleanText + '\n';
          }
        }
      }

      return {
        type: 'webpage',
        title: title,
        description: description,
        content: content.trim() || description,
        url: url
      };
    } catch (error) {
      return {
        type: 'webpage',
        title: 'Unknown',
        description: '',
        content: 'Unable to extract content',
        url: url
      };
    }
  }

  static async handlePDFLink(data) {
    return {
      type: 'pdf',
      title: 'PDF Document',
      content: 'PDF content',
      url: 'pdf'
    };
  }
}

module.exports = LinkProcessor;
