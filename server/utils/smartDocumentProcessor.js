/**
 * 智能文档处理器 - 集成LLM分析
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const LLMAnalyzer = require('./llmAnalyzer');

class SmartDocumentProcessor {
  constructor() {
    this.llmAnalyzer = new LLMAnalyzer();
  }

  /**
   * 处理上传的文档
   */
  async processDocument(filePath, fileName) {
    try {
      // 1. 提取文本内容
      const content = await this.extractContent(filePath);
      
      if (!content || content.trim().length === 0) {
        throw new Error('无法提取文档内容');
      }

      // 2. 使用LLM进行智能分析
      const analysis = await this.llmAnalyzer.analyzContent(content, 'document');

      // 3. 返回结构化结果
      return {
        fileName: fileName,
        contentLength: content.length,
        analysis: analysis,
        processedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Document Processing Error:', error);
      throw error;
    }
  }

  /**
   * 提取文档内容
   */
  async extractContent(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.pdf':
        return await this.extractPDF(filePath);
      case '.txt':
        return fs.readFileSync(filePath, 'utf-8');
      case '.md':
        return fs.readFileSync(filePath, 'utf-8');
      default:
        throw new Error(`不支持的文件格式: ${ext}`);
    }
  }

  /**
   * 提取PDF内容
   */
  async extractPDF(filePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(fileBuffer);
      return pdfData.text;
    } catch (error) {
      throw new Error(`PDF提取失败: ${error.message}`);
    }
  }

  /**
   * 处理链接内容
   */
  async processLink(url) {
    try {
      // 这里可以集成网页爬虫逻辑
      // 暂时返回占位符
      return {
        url: url,
        analysis: {
          problem: '链接处理功能开发中',
          methods: [],
          mindmap: '',
          keywords: [],
          summary: '请稍候'
        }
      };
    } catch (error) {
      throw new Error(`链接处理失败: ${error.message}`);
    }
  }

  /**
   * 分段处理大型文档
   */
  async processLargeDocument(filePath, fileName, chunkSize = 5000) {
    try {
      const content = await this.extractContent(filePath);
      const chunks = this.splitContent(content, chunkSize);
      
      const analyses = [];
      for (let i = 0; i < chunks.length; i++) {
        const analysis = await this.llmAnalyzer.analyzContent(chunks[i], `document-part-${i + 1}`);
        analyses.push({
          part: i + 1,
          analysis: analysis
        });
      }

      return {
        fileName: fileName,
        totalChunks: chunks.length,
        analyses: analyses,
        processedAt: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 分割内容
   */
  splitContent(content, chunkSize) {
    const chunks = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.substring(i, i + chunkSize));
    }
    return chunks;
  }
}

module.exports = SmartDocumentProcessor;
