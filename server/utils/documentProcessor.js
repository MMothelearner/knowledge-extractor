const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DocumentProcessor {
  /**
   * 根据文件类型处理文档
   */
  static async processDocument(filePath, fileType) {
    try {
      switch (fileType.toLowerCase()) {
        case 'pdf':
          return await this.processPDF(filePath);
        case 'txt':
          return this.processTXT(filePath);
        case 'doc':
        case 'docx':
          return this.processDOCX(filePath);
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
          return this.processImage(filePath);
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      throw new Error(`Error processing document: ${error.message}`);
    }
  }

  /**
   * 处理PDF文件
   */
  static async processPDF(filePath) {
    try {
      const text = execSync(`pdftotext "${filePath}" -`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024
      });
      return {
        text: text,
        pages: 1,
        metadata: {}
      };
    } catch (error) {
      throw new Error(`Error parsing PDF: ${error.message}`);
    }
  }

  /**
   * 处理TXT文件
   */
  static processTXT(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return {
        text: content,
        pages: 1
      };
    } catch (error) {
      throw new Error(`Error reading TXT: ${error.message}`);
    }
  }

  /**
   * 处理DOCX文件（简单实现）
   */
  static processDOCX(filePath) {
    try {
      // 简单实现：读取文件内容
      // 实际应该使用 docx 库来解析
      const content = fs.readFileSync(filePath, 'utf-8');
      return {
        text: content,
        pages: 1
      };
    } catch (error) {
      throw new Error(`Error reading DOCX: ${error.message}`);
    }
  }

  /**
   * 处理图片文件（OCR）
   */
  static processImage(filePath) {
    // 简单实现：返回文件路径
    // 实际应该使用 OCR 库来识别文字
    return {
      text: `[Image: ${path.basename(filePath)}]`,
      pages: 1,
      note: 'OCR processing not implemented yet'
    };
  }

  /**
   * 从文本中提取问题和方法
   */
  static extractKnowledge(text) {
    // 这是一个简单的实现
    // 实际应该使用 NLP 或 LLM 来进行更复杂的提取
    const lines = text.split('\n').filter(line => line.trim());
    
    const knowledge = [];
    let currentProblem = '';
    let currentMethods = [];

    for (const line of lines) {
      // 简单的启发式规则
      if (line.match(/^(问题|Q:|Question:|What|How|为什么|怎样|如何)/i)) {
        if (currentProblem && currentMethods.length > 0) {
          knowledge.push({
            problem: currentProblem,
            methods: currentMethods
          });
        }
        currentProblem = line;
        currentMethods = [];
      } else if (line.match(/^(答案|A:|Answer:|Solution:|方法|步骤|步骤|做法)/i)) {
        currentMethods.push(line);
      } else if (currentProblem && line.trim()) {
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
   * 清理和规范化文本
   */
  static normalizeText(text) {
    return text
      .replace(/\s+/g, ' ') // 多个空格替换为单个
      .replace(/\n\s*\n/g, '\n') // 多个换行替换为单个
      .trim();
  }

  /**
   * 分段文本
   */
  static segmentText(text, maxLength = 500) {
    const segments = [];
    const lines = text.split('\n');
    let currentSegment = '';

    for (const line of lines) {
      if ((currentSegment + line).length > maxLength) {
        if (currentSegment) {
          segments.push(currentSegment.trim());
        }
        currentSegment = line;
      } else {
        currentSegment += (currentSegment ? '\n' : '') + line;
      }
    }

    if (currentSegment) {
      segments.push(currentSegment.trim());
    }

    return segments;
  }
}

module.exports = DocumentProcessor;
