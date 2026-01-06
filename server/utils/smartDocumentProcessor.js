/**
 * 智能文档处理器 - 集成LLM分析
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
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
   * 提取PDF内容 - 使用pdftotext命令行工具
   */
  async extractPDF(filePath) {
    try {
      // 使用pdftotext命令行工具提取文本
      const text = execSync(`pdftotext "${filePath}" -`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024  // 10MB缓冲区
      });
      
      return text;
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
        content: '链接处理功能开发中',
        processedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Link Processing Error:', error);
      throw error;
    }
  }
}

module.exports = SmartDocumentProcessor;
