#!/usr/bin/env node

/**
 * 测试TikHub API集成
 */

require('dotenv').config();

const TikHubApiClient = require('./server/utils/tikHubApiClient');

async function testTikHub() {
  console.log('=== TikHub API 测试 ===\n');
  
  // 检查环境变量
  const apiKey = process.env.TIKHUB_API_KEY;
  console.log('1. 检查环境变量');
  console.log(`   TIKHUB_API_KEY: ${apiKey ? '已配置' : '未配置'}`);
  
  if (!apiKey) {
    console.error('\n❌ 错误：TIKHUB_API_KEY未配置！');
    console.log('请在.env文件中设置TIKHUB_API_KEY环境变量');
    process.exit(1);
  }
  
  // 初始化客户端
  console.log('\n2. 初始化TikHub客户端');
  try {
    const client = new TikHubApiClient(apiKey);
    console.log('   ✓ 客户端初始化成功');
    
    // 测试链接
    const testUrls = [
      'https://v.douyin.com/XuFwigSIw8A/',
      'https://v.douyin.com/cgVeMXV7-iM/',
    ];
    
    for (const url of testUrls) {
      console.log(`\n3. 测试URL: ${url}`);
      try {
        console.log('   正在调用TikHub API...');
        const result = await client.getVideoFromUrl(url);
        
        if (result.success) {
          console.log('   ✓ API调用成功！');
          console.log(`   标题: ${result.title}`);
          console.log(`   作者: ${result.author}`);
          console.log(`   时长: ${result.duration}秒`);
          console.log(`   浏览: ${result.views}`);
        } else {
          console.error(`   ❌ API调用失败: ${result.error}`);
        }
      } catch (error) {
        console.error(`   ❌ 异常: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error(`\n❌ 初始化失败: ${error.message}`);
    process.exit(1);
  }
}

testTikHub().catch(console.error);
