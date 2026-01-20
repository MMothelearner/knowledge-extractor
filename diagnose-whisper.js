/**
 * Whisper转录诊断脚本
 * 用于逐步诊断视频下载、音频提取和Whisper转录的问题
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
require('dotenv').config();

const videoDownloader = require('./server/utils/videoDownloader');
const whisperTranscriber = require('./server/utils/whisperTranscriber');

// 测试配置
const testConfig = {
  // 替换为实际的抖音链接
  testUrl: process.argv[2] || 'https://v.douyin.com/cgVeMXV7-iM/',
  verbose: true
};

async function diagnose() {
  console.log('='.repeat(80));
  console.log('Whisper转录诊断工具');
  console.log('='.repeat(80));
  
  console.log(`\n📋 测试URL: ${testConfig.testUrl}`);
  console.log(`\n🔍 开始诊断...\n`);
  
  // 步骤1: 检查系统依赖
  console.log('【步骤1】检查系统依赖');
  console.log('-'.repeat(80));
  try {
    videoDownloader.checkDependencies();
    console.log('✅ ffmpeg: 已安装');
    console.log('✅ yt-dlp: 已安装');
  } catch (error) {
    console.error('❌ 依赖检查失败:', error.message);
    return;
  }
  
  // 步骤2: 检查环境变量
  console.log('\n【步骤2】检查环境变量');
  console.log('-'.repeat(80));
  if (process.env.OPENAI_API_KEY) {
    console.log('✅ OPENAI_API_KEY: 已配置');
  } else {
    console.error('❌ OPENAI_API_KEY: 未配置');
    return;
  }
  
  // 步骤3: 获取视频信息
  console.log('\n【步骤3】获取视频信息');
  console.log('-'.repeat(80));
  let videoInfo;
  try {
    videoInfo = await videoDownloader.getVideoInfo(testConfig.testUrl);
    console.log('✅ 视频信息获取成功');
    console.log(`  标题: ${videoInfo.title}`);
    console.log(`  时长: ${videoInfo.duration}秒`);
    console.log(`  上传者: ${videoInfo.uploader}`);
  } catch (error) {
    console.error('❌ 获取视频信息失败:', error.message);
    console.log('\n💡 可能的原因：');
    console.log('  1. yt-dlp无法访问该URL（反爬虫机制）');
    console.log('  2. URL格式不正确');
    console.log('  3. 网络连接问题');
    return;
  }
  
  // 步骤4: 下载视频
  console.log('\n【步骤4】下载视频');
  console.log('-'.repeat(80));
  const videoId = videoDownloader.generateId();
  let videoPath;
  try {
    console.log('⏳ 正在下载视频（可能需要30-60秒）...');
    videoPath = await videoDownloader.downloadVideo(testConfig.testUrl, videoId);
    const videoSize = fs.statSync(videoPath).size;
    console.log('✅ 视频下载成功');
    console.log(`  文件路径: ${videoPath}`);
    console.log(`  文件大小: ${(videoSize / 1024 / 1024).toFixed(2)}MB`);
  } catch (error) {
    console.error('❌ 视频下载失败:', error.message);
    console.log('\n💡 可能的原因：');
    console.log('  1. yt-dlp配置不正确（缺少反爬虫参数）');
    console.log('  2. 抖音的反爬虫机制过于严格');
    console.log('  3. 需要使用代理或VPN');
    console.log('  4. 视频已被删除或不可用');
    return;
  }
  
  // 步骤5: 提取音频
  console.log('\n【步骤5】提取音频');
  console.log('-'.repeat(80));
  const audioId = `audio_${videoId}`;
  let audioPath;
  try {
    console.log('⏳ 正在提取音频...');
    audioPath = await videoDownloader.extractAudio(videoPath, audioId);
    const audioSize = fs.statSync(audioPath).size;
    console.log('✅ 音频提取成功');
    console.log(`  文件路径: ${audioPath}`);
    console.log(`  文件大小: ${(audioSize / 1024 / 1024).toFixed(2)}MB`);
    
    // 检查音频大小
    if (audioSize > 25 * 1024 * 1024) {
      console.warn('⚠️  音频文件过大（>25MB），Whisper API可能会拒绝');
    }
  } catch (error) {
    console.error('❌ 音频提取失败:', error.message);
    console.log('\n💡 可能的原因：');
    console.log('  1. ffmpeg配置不正确');
    console.log('  2. 视频格式不兼容');
    console.log('  3. 视频没有音轨');
    
    // 清理视频文件
    if (videoPath && fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
    return;
  }
  
  // 步骤6: 转录音频
  console.log('\n【步骤6】转录音频（Whisper API）');
  console.log('-'.repeat(80));
  try {
    console.log('⏳ 正在调用Whisper API（可能需要30-60秒）...');
    const transcript = await whisperTranscriber.transcribe(audioPath, 'zh');
    
    console.log('✅ 音频转录成功');
    console.log(`  文本长度: ${transcript.length}字符`);
    console.log(`  单词数: ${transcript.split(/\s+/).length}个`);
    console.log('\n📝 转录文本预览（前500字符）：');
    console.log('-'.repeat(80));
    console.log(transcript.substring(0, 500));
    if (transcript.length > 500) {
      console.log('...');
    }
    console.log('-'.repeat(80));
    
    // 保存转录结果
    const outputFile = path.join('/tmp', `transcript_${videoId}.txt`);
    fs.writeFileSync(outputFile, transcript);
    console.log(`\n✅ 完整转录结果已保存到: ${outputFile}`);
    
  } catch (error) {
    console.error('❌ 音频转录失败:', error.message);
    console.log('\n💡 可能的原因：');
    console.log('  1. OPENAI_API_KEY不正确');
    console.log('  2. API配额已用尽');
    console.log('  3. 音频文件格式不兼容');
    console.log('  4. 网络连接问题');
  }
  
  // 清理临时文件
  console.log('\n【清理】删除临时文件');
  console.log('-'.repeat(80));
  videoDownloader.cleanupFiles(videoPath, audioPath);
  console.log('✅ 临时文件已清理');
  
  console.log('\n' + '='.repeat(80));
  console.log('诊断完成');
  console.log('='.repeat(80));
}

// 运行诊断
diagnose().catch(error => {
  console.error('诊断失败:', error);
  process.exit(1);
});
