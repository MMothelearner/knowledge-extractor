const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class LinkProcessor {
  /**
   * 获取链接内容
   */
  static async fetchLinkContent(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const contentType = response.headers['content-type'];
      
      if (contentType.includes('text/html')) {
        return this.extractWebpageContent(response.data, url);
      } else if (contentType.includes('application/pdf')) {
        return this.handlePDFLink(response.data);
      } else if (contentType.includes('text/plain')) {
        return {
          type: 'text',
          content: response.data,
          url: url
        };
      } else {
        return {
          type: 'unknown',
          content: response.data,
          url: url
        };
      }
    } catch (error) {
      throw new Error(`Error fetching link: ${error.message}`);
    }
  }

  /**
   * 提取网页内容
   */
  static extractWebpageContent(html, url) {
    try {
      const $ = cheerio.load(html);

      // 移除脚本和样式
      $('script').remove();
      $('style').remove();

      // 提取标题
      const title = $('title').text() || $('h1').first().text();

      // 提取主要内容
      let content = '';
      
      // 优先提取 article 或 main 标签
      const mainContent = $('article').length > 0 ? $('article') : 
                         $('main').length > 0 ? $('main') : 
                         $('body');

      mainContent.find('p, h1, h2, h3, h4, h5, h6, li').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text) {
          content += text + '\n';
        }
      });

      // 提取元描述
      const description = $('meta[name="description"]').attr('content') || '';

      // 检测是否为视频页面
      const isVideo = html.includes('youtube') || 
                     html.includes('vimeo') || 
                     html.includes('video') ||
                     $('video').length > 0;

      return {
        type: isVideo ? 'video' : 'webpage',
        title: title,
        description: description,
        content: content.trim(),
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
    // 这里可以保存PDF并处理
    return {
      type: 'pdf',
      content: '[PDF content - requires processing]',
      note: 'PDF processing from links not fully implemented'
    };
  }

  /**
   * 从网页内容中提取知识
   */
  static extractKnowledgeFromWebpage(content) {
    // 简单的启发式规则
    const lines = content.split('\n').filter(line => line.trim());
    
    const knowledge = [];
    let currentProblem = '';
    let currentMethods = [];

    for (const line of lines) {
      // 检测问题行
      if (line.match(/^(问题|Q:|Question:|What|How|为什么|怎样|如何|问:|疑问)/i) || 
          line.match(/[?？]$/)) {
        if (currentProblem && currentMethods.length > 0) {
          knowledge.push({
            problem: currentProblem,
            methods: currentMethods
          });
        }
        currentProblem = line;
        currentMethods = [];
      } else if (line.match(/^(答案|A:|Answer:|Solution:|方法|步骤|做法|解决|答:|建议|技巧)/i)) {
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

  /**
   * 获取视频字幕（简单实现）
   */
  static async getVideoSubtitles(url) {
    // 这是一个占位符实现
    // 实际应该使用 youtube-dl 或其他工具
    return {
      subtitles: '[Video subtitles extraction not implemented]',
      note: 'Requires additional tools like youtube-dl'
    };
  }
}

module.exports = LinkProcessor;
