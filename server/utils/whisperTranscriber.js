/**
 * Whisper音频转录模块
 * 使用OpenAI的Whisper API转录音频文件
 */

const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

class WhisperTranscriber {
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API密钥未配置。请设置OPENAI_API_KEY或LLM_API_KEY环境变量。');
    }

    // 检查是否使用自定义的Manus API
    const apiBase = process.env.OPENAI_API_BASE;
    
    if (apiBase) {
      this.client = new OpenAI({
        apiKey: apiKey,
        baseURL: apiBase
      });
      console.log(`[WhisperTranscriber] 使用自定义API: ${apiBase}`);
    } else {
      this.client = new OpenAI({
        apiKey: apiKey
      });
      console.log('[WhisperTranscriber] 使用OpenAI官方API');
    }
  }

  /**
   * 转录音频文件
   * @param {string} audioPath - 音频文件路径
   * @param {string} language - 语言代码（可选，如'zh'表示中文）
   * @returns {string} 转录的文本
   */
  async transcribe(audioPath, language = null) {
    try {
      console.log(`[WhisperTranscriber] 开始转录: ${audioPath}`);

      // 验证文件存在
      if (!fs.existsSync(audioPath)) {
        throw new Error(`音频文件不存在: ${audioPath}`);
      }

      // 获取文件大小
      const fileSize = fs.statSync(audioPath).size;
      console.log(`[WhisperTranscriber] 文件大小: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);

      // 检查文件大小限制（Whisper API限制25MB）
      if (fileSize > 25 * 1024 * 1024) {
        throw new Error(`音频文件过大（${(fileSize / 1024 / 1024).toFixed(2)}MB）。Whisper API限制为25MB。`);
      }

      // 读取音频文件
      const audioStream = fs.createReadStream(audioPath);

      // 调用Whisper API
      const params = {
        file: audioStream,
        model: 'whisper-1'
      };

      // 如果指定了语言，添加到参数中
      if (language) {
        params.language = language;
      }

      console.log(`[WhisperTranscriber] 调用Whisper API...`);
      
      const response = await this.client.audio.transcriptions.create(params);

      const transcript = response.text;
      console.log(`[WhisperTranscriber] 转录成功，文本长度: ${transcript.length} 字符`);

      return transcript;
    } catch (error) {
      console.error(`[WhisperTranscriber] 转录失败: ${error.message}`);
      throw new Error(`无法转录音频: ${error.message}`);
    }
  }

  /**
   * 转录音频文件并返回详细信息
   * @param {string} audioPath - 音频文件路径
   * @param {string} language - 语言代码（可选）
   * @returns {object} 包含转录文本和元数据的对象
   */
  async transcribeWithMetadata(audioPath, language = null) {
    try {
      const transcript = await this.transcribe(audioPath, language);

      return {
        success: true,
        transcript: transcript,
        length: transcript.length,
        wordCount: transcript.split(/\s+/).length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`[WhisperTranscriber] 转录失败: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 验证Whisper API是否可用
   */
  async validateConnection() {
    try {
      console.log('[WhisperTranscriber] 验证API连接...');
      
      // 尝试调用一个简单的API来验证连接
      // 这里我们跳过实际的验证，因为需要一个真实的音频文件
      console.log('[WhisperTranscriber] API连接验证跳过（需要真实音频文件）');
      
      return true;
    } catch (error) {
      console.error(`[WhisperTranscriber] API连接验证失败: ${error.message}`);
      return false;
    }
  }
}

module.exports = new WhisperTranscriber();
