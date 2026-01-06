/**
 * LLM分析器 - 集成Manus LLM服务
 * 使用Manus平台提供的LLM API进行内容分析
 */

const fetch = require('node-fetch');

class LLMAnalyzer {
  constructor() {
    this.apiUrl = process.env.LLM_API_ENDPOINT || 'https://forge.manus.im/v1/chat/completions';
    this.apiKey = process.env.LLM_API_KEY || process.env.MANUS_LLM_API_KEY;
    this.model = 'gemini-2.5-flash';
  }

  /**
   * 调用LLM API进行分析
   */
  async invokeLLM(messages, responseFormat = null) {
    if (!this.apiKey) {
      throw new Error('LLM API Key not configured. Please set MANUS_LLM_API_KEY environment variable.');
    }

    const payload = {
      model: this.model,
      messages: messages,
      max_tokens: 4096,
      temperature: 0.7
    };

    if (responseFormat) {
      payload.response_format = responseFormat;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('LLM Invocation Error:', error);
      throw error;
    }
  }

  /**
   * 分析内容 - 识别问题和方法
   */
  async analyzContent(content, contentType = 'text') {
    try {
      // 第一步：识别问题和方法
      const analysisPrompt = `
你是一个专业的知识提炼专家。请分析以下${contentType}内容，并按照要求输出结构化的知识。

内容：
${content}

请按照以下JSON格式输出，不要包含任何其他文字：
{
  "problem": "这个内容解决的核心问题是什么？（一句话，简洁准确）",
  "methods": ["具体方法1", "具体方法2", "具体方法3"],
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "summary": "内容总结（2-3句话，精炼准确）"
}

要求：
1. problem字段必须简洁明确，不超过20个字
2. methods数组中每个方法都要具体可操作，不要有废话
3. keywords应该是最核心的3-5个关键词
4. summary要精炼，不要冗长
`;

      const analysisResponse = await this.invokeLLM(
        [{ role: 'user', content: analysisPrompt }],
        { type: 'json_object' }
      );

      let analysis;
      try {
        analysis = JSON.parse(analysisResponse);
      } catch (e) {
        // 如果JSON解析失败，尝试提取JSON
        const jsonMatch = analysisResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse LLM response as JSON');
        }
      }

      // 第二步：生成思维导图
      const mindmapPrompt = `
基于以下内容，生成一个Mermaid格式的思维导图：

问题：${analysis.problem}
方法：${analysis.methods.join('、')}

请生成Mermaid思维导图代码（只输出代码，不要其他文字）：
mindmap
  root((${analysis.problem}))
    方法
      ${analysis.methods.map((m, i) => `方法${i + 1}\n        ${m}`).join('\n      ')}
    关键点
      ${analysis.keywords.map(k => `${k}`).join('\n      ')}
`;

      let mindmap = '';
      try {
        mindmap = await this.invokeLLM([{ role: 'user', content: mindmapPrompt }]);
        // 清理mindmap输出
        mindmap = mindmap.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '').trim();
      } catch (error) {
        console.warn('Failed to generate mindmap:', error);
        mindmap = `mindmap
  root((${analysis.problem}))
    方法
${analysis.methods.map((m, i) => `      方法${i + 1}: ${m}`).join('\n')}
    关键点
${analysis.keywords.map(k => `      ${k}`).join('\n')}`;
      }

      return {
        problem: analysis.problem,
        methods: analysis.methods,
        keywords: analysis.keywords,
        summary: analysis.summary,
        mindmap: mindmap,
        contentType: contentType,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Content Analysis Error:', error);
      throw error;
    }
  }

  /**
   * 检测重复和相似内容
   */
  async detectSimilarity(content1, content2) {
    try {
      const similarityPrompt = `
请分析以下两段内容的相似度：

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
}
`;

      const response = await this.invokeLLM(
        [{ role: 'user', content: similarityPrompt }],
        { type: 'json_object' }
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
