/**
 * 高级链接处理器 - 支持多平台
 * 视频平台使用Whisper音频转录，网页使用ScrapeOps爬虫
 */

const axios = require('axios');
const videoDownloader = require('./videoDownloader');
const whisperTranscriber = require('./whisperTranscriber');
const TikHubApiClient = require('./tikHubApiClient');
const LLMAnalyzer = require('./llmAnalyzer');

console.log('[AdvancedLinkProcessor] 模块初始化');
console.log('[AdvancedLinkProcessor] TIKHUB_API_KEY状态:', process.env.TIKHUB_API_KEY ? '已配置' : '未配置');

// 延迟初始化TikHub客户端 - 在需要时才创建
let tikHubClient = null;

function getTikHubClient() {
  if (!tikHubClient) {
    const apiKey = process.env.TIKHUB_API_KEY;
    if (!apiKey) {
      console.error('[TikHub] TIKHUB_API_KEY环境变量未配置！');
      return null;
    }
    console.log('[TikHub] 初始化TikHub客户端...');
    tikHubClient = new TikHubApiClient(apiKey);
    console.log('[TikHub] TikHub客户端已初始化');
  }
  return tikHubClient;
}

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
  static async fetchWithScrapeOps(url, siteType = null) {
    const scrapeOpsApiKey = process.env.SCRAPEOPS_API_KEY;
    
    if (!scrapeOpsApiKey) {
      throw new Error('ScrapeOps API密钥未配置');
    }

    try {
      console.log(`[ScrapeOps] 下载链接: ${url}`);
      
      // 使用ScrapeOps代理 - 正确的API端点
      const scrapeOpsUrl = 'https://proxy.scrapeops.io/v1/';
      
      // 对于抖音和小红书，需要特殊的爬虫配置
      const params = {
        'api_key': scrapeOpsApiKey,
        'url': url,
        'render_javascript': 'true',
        'timeout': '30',
        'country': 'cn'  // 使用中国IP
      };
      
      // 对于抖音，增加额外的配置
      if (siteType === 'douyin') {
        params['render_javascript'] = 'true';
        params['wait_for_selector'] = 'div[data-testid="video-desc"]';  // 等待视频描述加载
      }
      
      // 对于小红书，增加额外的配置
      if (siteType === 'xiaohongshu') {
        params['render_javascript'] = 'true';
        params['wait_for_selector'] = 'div[class*="desc"]';  // 等待描述加载
      }
      
      const response = await axios.get(scrapeOpsUrl, {
        params: params,
        timeout: 60000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          'Referer': 'https://www.douyin.com/' // 对于抖音
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
   * 获取链接内容 - 视频使用Whisper转录，网页使用ScrapeOps
   */
  static async fetchLinkContent(url) {
    try {
      // 检测网站类型
      const siteType = this.detectSiteType(url);
      console.log(`[LinkProcessor] 检测到网站类型: ${siteType}`);

      let result;
      
      // 对于抖音视频，优先使用Douyin API获取视频信息
      if (siteType === 'douyin') {
        console.log(`[LinkProcessor] 抖音视频检测，使用Douyin API处理...`);
        try {
          result = await this.handleDouyinWithApi(url);
          console.log(`[LinkProcessor] Douyin API处理成功`);
          return result;
        } catch (apiError) {
          console.warn(`[LinkProcessor] Douyin API处理失败: ${apiError.message}，降级到ScrapeOps...`);
          // 降级到ScrapeOps
        }
      }
      
      // 使用ScrapeOps爬虫处理所有类型的链接
      console.log(`[LinkProcessor] 使用ScrapeOps爬虫处理: ${siteType}`);
      const html = await this.fetchWithScrapeOps(url, siteType);
      
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
        case 'bilibili':
          result = await this.handleBilibili(url, html);
          break;
        case 'weibo':
          result = await this.handleWeibo(url, html);
          break;
        default:
          result = await this.handleGeneric(url, html);
      }

      // 验证内容 - 即使内容很少，也继续处理而不是抛出错误
      // 只有当完全无法提取任何内容时才抛出错误
      if (!result.content || result.content.trim().length === 0) {
        console.warn(`警告：无法提取任何内容。网站类型: ${siteType}`);
        // 返回一个最小的结果，让LLM去处理
        result.content = result.title || '无法提取内容';
      }
      
      console.log(`[LinkProcessor] 成功提取内容，长度: ${result.content.trim().length} 字符`);

      return result;
    } catch (error) {
      console.error('Error fetching link:', error.message);
      throw error;
    }
  }

  /**
   * 使用Whisper音频转录处理视频
   */
  static async handleVideoWithWhisper(url, siteType) {
    let videoPath = null;
    let audioPath = null;
    
    try {
      console.log(`[Whisper] ========== 开始处理视频 ==========`);
      console.log(`[Whisper] URL: ${url}`);
      console.log(`[Whisper] 网站类型: ${siteType}`);
      
      // 检查依赖
      console.log(`[Whisper] 检查系统依赖...`);
      try {
        videoDownloader.checkDependencies();
        console.log(`[Whisper] 系统依赖检查通过`);
      } catch (depError) {
        console.error(`[Whisper] 系统依赖检查失败: ${depError.message}`);
        throw depError;
      }
      
      // 生成ID
      const videoId = videoDownloader.generateId();
      const audioId = `audio_${videoId}`;
      
      // 获取视频信息
      const videoInfo = await videoDownloader.getVideoInfo(url);
      console.log(`[Whisper] 视频信息: ${videoInfo.title} (${videoInfo.duration}秒)`);
      
      // 下载视频
      console.log(`[Whisper] 步骤2: 下载视频...`);
      videoPath = await videoDownloader.downloadVideo(url, videoId);
      
      // 提取音频
      console.log(`[Whisper] 步骤3: 提取音频...`);
      audioPath = await videoDownloader.extractAudio(videoPath, audioId);
      
      // 转录音频
      console.log(`[Whisper] 步骤4: 转录音频...`);
      const transcript = await whisperTranscriber.transcribe(audioPath, 'zh');
      
      // 清理临时文件
      videoDownloader.cleanupFiles(videoPath, audioPath);
      
      // 构建结果
      const result = {
        type: `${siteType}_video`,
        title: videoInfo.title,
        description: videoInfo.description,
        content: transcript,
        url: url,
        source: siteType,
        duration: videoInfo.duration,
        uploader: videoInfo.uploader,
        transcriptionMethod: 'whisper'
      };
      
      console.log(`[Whisper] 转录成功，文本长度: ${transcript.length} 字符`);
      return result;
    } catch (error) {
      // 清理临时文件
      if (videoPath || audioPath) {
        videoDownloader.cleanupFiles(videoPath, audioPath);
      }
      
      console.error(`[Whisper] 处理失败: ${error.message}`);
      console.error(`[Whisper] 错误堆栈: ${error.stack}`);
      
      // 如果Whisper方案失败，降级到ScrapeOps爬虫
      console.log(`[Whisper] 降级到ScrapeOps爬虫...`);
      try {
        const html = await this.fetchWithScrapeOps(url, siteType);
        
        switch (siteType) {
          case 'douyin':
            return await this.handleDouyin(url, html);
          case 'xiaohongshu':
            return await this.handleXiaohongshu(url, html);
          case 'youtube':
            return await this.handleYouTube(url, html);
          case 'bilibili':
            return await this.handleBilibili(url, html);
          default:
            return await this.handleGeneric(url, html);
        }
      } catch (fallbackError) {
        console.error(`[Whisper] 降级方案也失败: ${fallbackError.message}`);
        throw new Error(`无法处理视频: ${error.message}。降级方案也失败: ${fallbackError.message}`);
      }
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
   * 处理抖音链接（ScrapeOps爬虫方案）
   */
  static async handleDouyin(url, html) {
    try {
      const title = this.extractMetaContent(html, 'og:title') || 
                    this.extractTitle(html) || 
                    '抖音视频';

      const description = this.extractMetaContent(html, 'og:description', 'description') || '';
      const jsonLdContent = this.extractJsonLd(html);
      
      // 尝试从HTML中提取更多内容
      let extraContent = '';
      
      // 方法1: 查找video-desc相关的内容
      const videoDescMatch = html.match(/data-testid=["']video-desc["'][^>]*>([^<]+)</i);
      if (videoDescMatch && videoDescMatch[1]) {
        extraContent += videoDescMatch[1] + '\n';
      }
      
      // 方法2: 查找desc字段
      const descMatch = html.match(/["']desc["']\s*:\s*["']([^"]*?)["']/i);
      if (descMatch && descMatch[1]) {
        extraContent += descMatch[1] + '\n';
      }
      
      // 方法3: 查找content字段
      const contentMatch = html.match(/["']content["']\s*:\s*["']([^"]*?)["']/i);
      if (contentMatch && contentMatch[1]) {
        extraContent += contentMatch[1] + '\n';
      }
      
      // 如果description为空，尝试从纯文本中提取
      let plainText = '';
      if (!description && !jsonLdContent && !extraContent) {
        plainText = this.extractPlainText(html);
      }
      
      // 构建content - 优先使用title和description
      const content = (title + '\n' + description + '\n' + jsonLdContent + '\n' + extraContent + '\n' + plainText)
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
   * 处理小红书链接（ScrapeOps爬虫方案）
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
      
      // 方法1: 查找desc字段（多种格式）
      let descMatch = html.match(/["']desc["']\s*:\s*["']([^"]*?)["']/i);
      if (descMatch && descMatch[1]) {
        jsContent = descMatch[1];
      }
      
      // 方法1b: 查找desc字段（转义引号）
      if (!jsContent) {
        descMatch = html.match(/\\["']desc\\["']\s*:\s*\\["']([^\\]*?)\\["']/i);
        if (descMatch && descMatch[1]) {
          jsContent = descMatch[1];
        }
      }
      
      // 方法2: 查找content字段
      if (!jsContent) {
        const contentMatch = html.match(/["']content["']\s*:\s*["']([^"]*?)["']/i);
        if (contentMatch && contentMatch[1]) {
          jsContent = contentMatch[1];
        }
      }
      
      // 方法3: 查找text字段
      if (!jsContent) {
        const textMatch = html.match(/["']text["']\s*:\s*["']([^"]*?)["']/i);
        if (textMatch && textMatch[1]) {
          jsContent = textMatch[1];
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
   * 处理YouTube链接（ScrapeOps爬虫方案）
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
   * 处理Bilibili链接（ScrapeOps爬虫方案）
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
   * 使用Douyin爬虫处理抖音视频
   */
  static async handleDouyinWithApi(url) {
    try {
      console.log(`[TikHub] 开始使用TikHub API处理抖音链接: ${url}`);
      
      if (!process.env.TIKHUB_API_KEY) {
        console.error('[TikHub] TIKHUB_API_KEY环境变量未配置');
        throw new Error('TikHub API密钥未配置');
      }
      
      // 获取或初始化TikHub客户端
      const client = getTikHubClient();
      if (!client) {
        throw new Error('无法初始化TikHub客户端');
      }
      
      console.log('[TikHub] 调用TikHub API...');
      // 使用TikHub API获取视频信息
      const videoInfo = await client.getVideoFromUrl(url);
      
      if (!videoInfo.success) {
        throw new Error(videoInfo.error || 'TikHub API调用失败');
      }
      
      console.log(`[TikHub] 成功获取视频信息`);
      console.log(`  标题: ${videoInfo.title}`);
      console.log(`  作者: ${videoInfo.author}`);
      console.log(`  时长: ${videoInfo.duration}秒`);
      
      // 构建返回结果
      const content = [
        `标题: ${videoInfo.title}`,
        `作者: ${videoInfo.author}`,
        `描述: ${videoInfo.description}`,
        `时长: ${videoInfo.duration}秒`,
        `点赞: ${videoInfo.likes}`,
        `评论: ${videoInfo.comments}`,
        `分享: ${videoInfo.shares}`,
        `浏览: ${videoInfo.views}`
      ].filter(line => line.trim()).join('\n');
      
      return {
        type: 'douyin_video',
        title: videoInfo.title,
        description: videoInfo.description,
        content: content,
        url: url,
        videoId: videoInfo.videoId,
        author: videoInfo.author,
        duration: videoInfo.duration,
        stats: {
          likes: videoInfo.likes,
          comments: videoInfo.comments,
          shares: videoInfo.shares,
          views: videoInfo.views
        },
        source: 'tikhub_api'
      };
    } catch (error) {
      console.error(`[TikHub] 处理失败: ${error.message}`);
      throw new Error(`TikHub API处理失败: ${error.message}`);
    }
  }
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

  /**
   * 使用LLM分析链接内容
   */
  static async analyzeLinkWithLLM(linkContent) {
    try {
      const analyzer = new LLMAnalyzer();
      const analysis = await analyzer.analyzeContent(linkContent.content, 'link');
      
      // 转换为LLM分析结果格式
      return {
        title: linkContent.title,
        summary: analysis.summary || '',
        keyPoints: analysis.keywords || [],
        problems: analysis.problem ? [{
          problem: analysis.problem,
          solutions: analysis.methods || []
        }] : [],
        learningNotes: analysis.methods || [],
        tags: analysis.keywords || [],
        difficulty: '中等',
        mindmap: analysis.mindmap || '',
        rawAnalysis: analysis
      };
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

module.exports = AdvancedLinkProcessor;
