/**
 * Whisper功能测试脚本
 * 用于本地测试视频下载、音频提取和Whisper转录功能
 */

const path = require('path');
require('dotenv').config();

// 测试配置
const testConfig = {
  // 测试视频链接（可以替换为实际的抖音、小红书、YouTube链接）
  testUrls: [
    // 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // YouTube示例
    // 'https://www.douyin.com/video/...', // 抖音示例
    // 'https://www.xiaohongshu.com/explore/...', // 小红书示例
  ],
  
  // 测试本地音频文件（如果有的话）
  testAudioFile: null,
};

async function runTests() {
  console.log('='.repeat(60));
  console.log('Whisper功能测试');
  console.log('='.repeat(60));
  
  // 检查环境变量
  console.log('\n1. 检查环境变量...');
  checkEnvironment();
  
  // 测试模块导入
  console.log('\n2. 测试模块导入...');
  try {
    const videoDownloader = require('./server/utils/videoDownloader');
    const whisperTranscriber = require('./server/utils/whisperTranscriber');
    const advancedLinkProcessor = require('./server/utils/advancedLinkProcessor');
    
    console.log('✅ 所有模块导入成功');
    
    // 测试系统依赖
    console.log('\n3. 检查系统依赖...');
    try {
      videoDownloader.checkDependencies();
      console.log('✅ 系统依赖检查通过');
    } catch (error) {
      console.error('❌ 系统依赖检查失败:', error.message);
      console.log('\n提示：请确保已安装以下工具：');
      console.log('  - ffmpeg: apt-get install ffmpeg');
      console.log('  - yt-dlp: pip3 install yt-dlp');
      return;
    }
    
    // 测试Whisper API连接
    console.log('\n4. 测试Whisper API连接...');
    const isConnected = await whisperTranscriber.validateConnection();
    if (isConnected) {
      console.log('✅ Whisper API连接成功');
    } else {
      console.log('⚠️  Whisper API连接验证跳过（需要真实音频文件）');
    }
    
    // 如果有测试URL，进行集成测试
    if (testConfig.testUrls.length > 0) {
      console.log('\n5. 集成测试...');
      for (const url of testConfig.testUrls) {
        console.log(`\n测试URL: ${url}`);
        try {
          const result = await advancedLinkProcessor.fetchLinkContent(url);
          console.log('✅ 处理成功');
          console.log(`  标题: ${result.title}`);
          console.log(`  内容长度: ${result.content.length} 字符`);
          if (result.transcriptionMethod) {
            console.log(`  转录方法: ${result.transcriptionMethod}`);
          }
        } catch (error) {
          console.error('❌ 处理失败:', error.message);
        }
      }
    } else {
      console.log('\n5. 集成测试');
      console.log('⚠️  未配置测试URL。请在test-whisper.js中添加testUrls来进行集成测试。');
    }
    
    // 测试本地音频文件
    if (testConfig.testAudioFile) {
      console.log('\n6. 本地音频文件转录测试...');
      try {
        const transcript = await whisperTranscriber.transcribe(testConfig.testAudioFile, 'zh');
        console.log('✅ 转录成功');
        console.log(`  文本长度: ${transcript.length} 字符`);
        console.log(`  文本预览: ${transcript.substring(0, 100)}...`);
      } catch (error) {
        console.error('❌ 转录失败:', error.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('测试完成');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ 模块导入失败:', error.message);
    console.error(error.stack);
  }
}

function checkEnvironment() {
  const requiredEnvVars = ['OPENAI_API_KEY'];
  const optionalEnvVars = ['SCRAPEOPS_API_KEY'];
  
  let hasErrors = false;
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar} 已配置`);
    } else {
      console.error(`❌ ${envVar} 未配置`);
      hasErrors = true;
    }
  }
  
  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar} 已配置`);
    } else {
      console.log(`⚠️  ${envVar} 未配置（可选）`);
    }
  }
  
  if (hasErrors) {
    console.log('\n提示：请在.env文件中配置必需的环境变量');
    console.log('参考.env.example文件获取更多信息');
  }
}

// 运行测试
runTests().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});
