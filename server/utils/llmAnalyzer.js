/**
 * LLM分析器 - 支持多个LLM提供商（DeepSeek、OpenAI等）
 * 默认使用DeepSeek API
 * 使用优化的提示词进行深度内容分析
 */

const axios = require('axios');

class LLMAnalyzer {
  constructor() {
    // 支持多个LLM提供商
    this.provider = process.env.LLM_PROVIDER || 'deepseek';
    
    if (this.provider === 'deepseek') {
      this.apiUrl = 'https://api.deepseek.com/chat/completions';
      this.model = 'deepseek-chat';
    } else if (this.provider === 'openai') {
      this.apiUrl = process.env.LLM_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
      this.model = process.env.LLM_MODEL || 'gpt-3.5-turbo';
    } else if (this.provider === 'manus') {
      this.apiUrl = 'https://api.manus.im/v1/chat/completions';
      this.model = 'gemini-2.5-flash';
    } else {
      // 自定义提供商
      this.apiUrl = process.env.LLM_API_ENDPOINT;
      this.model = process.env.LLM_MODEL || 'default';
    }
    
    this.apiKey = process.env.LLM_API_KEY;
    
    if (!this.apiKey) {
      throw new Error(`LLM API Key not configured. Please set LLM_API_KEY environment variable for ${this.provider} provider.`);
    }
    
    console.log(`LLM Analyzer initialized with provider: ${this.provider}, model: ${this.model}`);
  }

  /**
   * 调用LLM API进行分析
   */
  async invokeLLM(messages, responseFormat = null) {
    if (!this.apiKey) {
      throw new Error(`LLM API Key not configured for ${this.provider}`);
    }

    const payload = {
      model: this.model,
      messages: messages,
      max_tokens: 8192,
      temperature: 0.7
    };

    // 某些提供商可能不支持response_format
    if (responseFormat && this.provider !== 'deepseek') {
      payload.response_format = responseFormat;
    }

    try {
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 60000
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('LLM Invocation Error:', error.message);
      throw new Error(`LLM API Error: ${error.message}`);
    }
  }

  /**
   * 深度内容分析 - 使用优化的提示词
   */
  async analyzeContent(content, contentType = 'text') {
    try {
      // 优化的提示词 - 深度内容分析
      // 注意：没有自我介绍，仅有任务描述
      const analysisPrompt = `你是一个内容分析工具。你的任务是从提供的视频内容、字幕或文档中提取核心信息。

任务要求：
1. 识别内容的逻辑脚绛，划分为明确的章节
2. 为每个章节提取：
   - 核心论点（一句话概括）
   - 关键概念和定义
   - 具体的方法或步骤
   - 提到的工具、资源或案例
   - 金句或作者的总结
3. 过滤掉：开场白、自我介绍、口语废话、不相关的主题
4. 使用清晰的陈述句，不要照搬原话
5. 不要加入你的主观评价

输出格式（必须严格按照）：

## [时间戳] 章节标题
- **核心论点**：一句话概括
- **关键细节**：
  - [概念/方法]：具体解释
  - [工具/案例]：具体对象
  - [金句/结论]：作者总结

请对每个逻辑段落重复上述结构。

最后，用 3 个要点总结整个内容的最大价值。

---

现在分析以下内容：

${content}

输出分析结果。不要包含任何前缀语或自我介绍。`;

      const analysisResponse = await this.invokeLLM(
        [{ role: 'user', content: analysisPrompt }]
      );

      // 解析响应 - 提取结构化信息
      const analysis = this.parseDetailedAnalysis(analysisResponse);

      return analysis;
    } catch (error) {
      console.error('Content Analysis Error:', error);
      throw error;
    }
  }

  /**
   * 解析详细分析结果
   */
  parseDetailedAnalysis(response) {
    try {
      // 提取章节
      const sections = [];
      const sectionRegex = /^##\s+\[([^\]]+)\]\s+(.+)$/gm;
      let match;

      while ((match = sectionRegex.exec(response)) !== null) {
        const timeRange = match[1];
        const title = match[2];
        sections.push({
          timeRange,
          title,
          content: ''
        });
      }

      // 提取摘要（最后的3个要点）
      const summaryMatch = response.match(/# Summary\n([\s\S]*?)$/i) || 
                          response.match(/## Summary\n([\s\S]*?)$/i) ||
                          response.match(/### Summary\n([\s\S]*?)$/i);
      
      let summary = '';
      if (summaryMatch) {
        summary = summaryMatch[1].trim();
      }

      // 提取核心问题（从第一个章节标题推断）
      const firstSectionMatch = response.match(/^##\s+\[([^\]]+)\]\s+(.+)$/m);
      const problem = firstSectionMatch ? firstSectionMatch[2] : '内容分析';

      // 提取关键词（从内容中推断）
      const keywords = this.extractKeywords(response);

      return {
        title: problem,
        problem: problem,
        topic: this.detectTopic(response),
        sections: sections,
        fullContent: response,
        summary: summary,
        keywords: keywords,
        contentType: 'detailed_analysis',
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Parse Analysis Error:', error);
      // 返回原始内容作为备选
      return {
        title: '内容分析',
        problem: '内容分析',
        topic: '未知',
        sections: [],
        fullContent: response,
        summary: response.substring(0, 200),
        keywords: [],
        contentType: 'detailed_analysis',
        analyzedAt: new Date().toISOString()
      };
    }
  }

  /**
   * 检测主题
   */
  detectTopic(content) {
    const topics = ['英语语法', '英语词汇', '英语听力', '英语阅读', '英语写作', '英语口语', '英语学习'];
    for (const topic of topics) {
      if (content.includes(topic)) {
        return topic;
      }
    }
    return '英语学习';
  }

  /**
   * 提取关键词
   */
  extractKeywords(content) {
    // 简单的关键词提取 - 查找加粗的词
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const keywords = [];
    let match;
    
    while ((match = boldRegex.exec(content)) !== null) {
      const word = match[1];
      if (word.length > 2 && word.length < 20 && !word.includes('：')) {
        keywords.push(word);
      }
    }

    return keywords.slice(0, 10); // 最多10个关键词
  }

  /**
   * 检测重复和相似内容
   */
  async detectSimilarity(content1, content2) {
    try {
      const similarityPrompt = `请分析以下两段内容的相似度：

内容1：
${content1}

内容2：
${content2}

请返回JSON格式的结果（只输出JSON，不要其他文字）：
{
  "similarity_score": 0.0到1.0之间的数字,
  "is_duplicate": true/false,
  "relationship": "完全相同" | "相似但不同" | "相同问题不同方法" | "完全不同",
  "explanation": "简短说明"
}`;

      const response = await this.invokeLLM(
        [{ role: 'user', content: similarityPrompt }]
      );

      let result;
      try {
        result = JSON.parse(response);
      } catch (e) {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse similarity response');
        }
      }

      return result;
    } catch (error) {
      console.error('Similarity Detection Error:', error);
      throw error;
    }
  }
}

module.exports = LLMAnalyzer;
