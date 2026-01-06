const axios = require('axios');
const fs = require('fs');
const path = require('path');
const LLMAnalyzer = require('./llmAnalyzer');

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
   * 处理小红书链接
   */
  static async handleXiaohongshu(url) {
    try {
      // 小红书链接通常需要特殊处理
      // 这里我们尝试获取页面内容
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
        },
        timeout: 15000
      });

      const html = response.data;
      
      // 提取标题
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(' - 小红书', '').trim() : '小红书笔记';

      // 提取描述（小红书的内容通常在meta标签中）
      const descMatch = html.match(/<meta\s+name=['"]description['"][^>]*content=['"]([^'"]*)['"]/i);
      const description = descMatch ? descMatch[1] : '';

      // 提取主要内容
      let content = '';
      
      // 尝试从多个可能的位置提取内容
      const contentPatterns = [
        /<div[^>]*class=['"]desc[^>]*>([^<]+)<\/div>/gi,
        /<div[^>]*class=['"]content[^>]*>([^<]+)<\/div>/gi,
        /<p[^>]*>([^<]+)<\/p>/gi,
        /<span[^>]*class=['"][^"]*text[^"]*['"][^>]*>([^<]+)<\/span>/gi
      ];

      for (const pattern of contentPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const text = match[1].trim();
          if (text && text.length > 5) {
            content += text + '\n';
          }
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
      throw new Error(`Error handling Xiaohongshu link: ${error.message}`);
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

  /**
   * 提取网页内容 - 改进版本
   */
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

      // 提取主要文本内容 - 更全面的选择器
      let content = '';
      const contentSelectors = [
        // 主要内容容器
        /<article[^>]*>(.+?)<\/article>/gis,
        /<main[^>]*>(.+?)<\/main>/gis,
        /<div[^>]*class=['"][^"]*content[^"]*['"][^>]*>(.+?)<\/div>/gis,
        // 段落和标题
        /<(p|h[1-6]|li|blockquote)[^>]*>([^<]+)<\/\1>/gi,
        // 其他文本元素
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

      // 如果内容太少，尝试提取所有文本
      if (content.trim().length < 100) {
        const allText = cleanHtml.replace(/<[^>]+>/g, ' ').trim();
        const lines = allText.split('\n').filter(line => line.trim().length > 10);
        content = lines.slice(0, 50).join('\n');
      }

      return {
        type: 'webpage',
        title: title,
        description: description,
        content: content.trim() || '无法提取内容',
        url: url
      };
    } catch (error) {
      throw new Error(`Error extracting webpage content: ${error.message}`);
    }
  }

  /**
   * 处理PDF链接
   */
  static async handlePDFLink(data) {
    return {
      type: 'pdf',
      content: '[PDF content - requires processing]',
      note: 'PDF processing from links not fully implemented'
    };
  }

  /**
   * 从网页内容中提取知识 - 改进版本
   */
  static extractKnowledgeFromWebpage(content) {
    const lines = content.split('\n').filter(line => line.trim().length > 5);
    
    const knowledge = [];
    let currentProblem = '';
    let currentMethods = [];

    for (const line of lines) {
      // 检测问题行
      if (line.match(/^(问题|Q:|Question:|What|How|为什么|怎样|如何|问:|疑问|Why|How to)/i) || 
          line.match(/[?？]$/) ||
          line.match(/^(一、|二、|三、|四、|五、|1\.|2\.|3\.|4\.|5\.)/)) {
        
        if (currentProblem && currentMethods.length > 0) {
          knowledge.push({
            problem: currentProblem,
            methods: currentMethods
          });
        }
        currentProblem = line;
        currentMethods = [];
      } else if (line.match(/^(答案|A:|Answer:|Solution:|方法|步骤|做法|解决|答:|建议|技巧|Tips|Note|要点)/i)) {
        currentMethods.push(line);
      } else if (currentProblem && line.trim().length > 5) {
        currentMethods.push(line);
      }
    }

    if (currentProblem && currentMethods.length > 0) {
      knowledge.push({
        problem: currentProblem,
        methods: currentMethods
      });
    }

    return knowledge;
  }

  /**
   * 使用LLM分析链接内容并生成知识点
   */
  static async analyzeLinkWithLLM(linkContent) {
    try {
      const prompt = `请分析以下内容，提取关键知识点、问题、解决方案和学习要点。

内容标题: ${linkContent.title}
内容描述: ${linkContent.description || '无'}
内容类型: ${linkContent.type}

主要内容:
${linkContent.content}

请按照以下格式返回JSON:
{
  "title": "主题标题",
  "summary": "内容摘要",
  "keyPoints": ["关键点1", "关键点2", ...],
  "problems": [
    {
      "problem": "问题描述",
      "solutions": ["解决方案1", "解决方案2", ...]
    }
  ],
  "learningNotes": ["学习笔记1", "学习笔记2", ...],
  "tags": ["标签1", "标签2", ...],
  "difficulty": "简单|中等|困难"
}`;

      const analyzer = new LLMAnalyzer();
      const analysis = await analyzer.analyzeContent(prompt, 'link');
      
      try {
        // 从分析结果中提取JSON
        if (typeof analysis === 'string') {
          return JSON.parse(analysis);
        } else if (analysis && analysis.analysis) {
          return JSON.parse(analysis.analysis);
        } else {
          return analysis;
        }
      } catch (e) {
        // 如果JSON解析失败，返回原始文本
        return {
          title: linkContent.title,
          summary: typeof analysis === 'string' ? analysis : JSON.stringify(analysis),
          keyPoints: [],
          problems: [],
          learningNotes: [],
          tags: [],
          difficulty: '中等'
        };
      }
    } catch (error) {
      console.error('Error analyzing link with LLM:', error);
      // 返回默认分析结果而不是抛出错误
      return {
        title: linkContent.title,
        summary: '内容分析中...',
        keyPoints: [],
        problems: [],
        learningNotes: [],
        tags: [],
        difficulty: '中等'
      };
    }
  }

  /**
   * 验证URL
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = LinkProcessor;
