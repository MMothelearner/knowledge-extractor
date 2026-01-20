/**
 * Douyin爬虫包装器
 * 通过Node.js调用Python爬虫脚本获取抖音视频信息
 */

const { spawn } = require('child_process');
const path = require('path');

class DouyinCrawlerWrapper {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, 'douyin_crawler.py');
  }

  /**
   * 调用Python爬虫获取视频信息
   * @param {string} url - 抖音视频链接
   * @returns {Promise<Object>} 视频信息
   */
  async fetchVideoInfo(url) {
    return new Promise((resolve, reject) => {
      console.log(`[DouyinCrawlerWrapper] 调用Python爬虫: ${url}`);

      // 启动Python子进程
      const python = spawn('python3', [this.pythonScriptPath, url], {
        cwd: path.dirname(this.pythonScriptPath),
        timeout: 60000, // 60秒超时
      });

      let stdout = '';
      let stderr = '';

      // 收集标准输出
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // 收集标准错误
      python.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log(`[DouyinCrawlerWrapper] stderr: ${data.toString()}`);
      });

      // 处理进程结束
      python.on('close', (code) => {
        console.log(`[DouyinCrawlerWrapper] Python进程退出，代码: ${code}`);

        if (code !== 0) {
          reject(new Error(`Python脚本执行失败: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          if (result.success) {
            console.log(`[DouyinCrawlerWrapper] 成功获取视频信息`);
            resolve(result);
          } else {
            reject(new Error(`爬虫错误: ${result.error}`));
          }
        } catch (error) {
          reject(new Error(`JSON解析失败: ${error.message}\nstdout: ${stdout}`));
        }
      });

      // 处理进程错误
      python.on('error', (error) => {
        reject(new Error(`启动Python进程失败: ${error.message}`));
      });
    });
  }

  /**
   * 从短链接提取视频ID
   * @param {string} url - 抖音视频链接
   * @returns {string} 视频ID
   */
  extractVideoId(url) {
    try {
      // 处理短链接 https://v.douyin.com/XuFwigSIw8A/
      const shortMatch = url.match(/v\.douyin\.com\/([A-Za-z0-9]+)/);
      if (shortMatch) {
        return shortMatch[1];
      }

      // 处理长链接 https://www.douyin.com/video/7123456789
      const longMatch = url.match(/\/video\/(\d+)/);
      if (longMatch) {
        return longMatch[1];
      }

      throw new Error('无法从URL提取视频ID');
    } catch (error) {
      console.error(`[DouyinCrawlerWrapper] 提取视频ID失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  generateId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `${timestamp}_${random}`;
  }
}

module.exports = DouyinCrawlerWrapper;
