#!/usr/bin/env node

const axios = require('axios');

const API_KEY = 'vp88JYY1mU+TxzPCNIem5ErhLTqtVZBD+gfmuneZTu2XpwSTHWCRTjmHMw==';
const BASE_URL = 'https://api.tikhub.io/api/v1';

async function testTikHub() {
  console.log('=== 测试修复后的TikHub API ===\n');
  
  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  const videoId = '7304808510125002047';
  
  console.log(`使用aweme_id: ${videoId}\n`);
  console.log('调用TikHub API...\n');
  
  try {
    const response = await client.get('/douyin/app/v3/fetch_one_video', {
      params: {
        aweme_id: videoId,
      },
    });
    
    console.log('✅ API调用成功！\n');
    console.log('视频信息:');
    console.log(`  标题: ${response.data.title || response.data.desc}`);
    console.log(`  作者: ${response.data.author?.nickname || 'Unknown'}`);
    console.log(`  时长: ${response.data.duration}秒`);
    console.log(`  点赞: ${response.data.statistics?.digg_count || 0}`);
    console.log(`  评论: ${response.data.statistics?.comment_count || 0}`);
    console.log(`  分享: ${response.data.statistics?.share_count || 0}`);
    console.log(`  浏览: ${response.data.statistics?.play_count || 0}`);
    
  } catch (error) {
    console.error(`❌ API调用失败: ${error.message}`);
    if (error.response) {
      console.error(`状态码: ${error.response.status}`);
      console.error(`响应: ${JSON.stringify(error.response.data)}`);
    }
  }
}

testTikHub().catch(console.error);
