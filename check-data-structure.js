#!/usr/bin/env node

const axios = require('axios');

const API_KEY = 'vp88JYY1mU+TxzPCNIem5ErhLTqtVZBD+gfmuneZTu2XpwSTHWCRTjmHMw==';
const BASE_URL = 'https://api.tikhub.io/api/v1';

async function checkStructure() {
  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  const videoId = '7304808510125002047';
  
  try {
    const response = await client.get('/douyin/app/v3/fetch_one_video', {
      params: {
        aweme_id: videoId,
      },
    });
    
    const actualData = response.data.data;
    
    console.log('=== 实际视频数据字段 ===\n');
    
    // 尝试提取各种可能的标题字段
    console.log('标题字段:');
    console.log(`  actualData.title: ${actualData.title}`);
    console.log(`  actualData.desc: ${actualData.desc}`);
    
    // 尝试提取作者信息
    console.log('\n作者字段:');
    console.log(`  actualData.author?.nickname: ${actualData.author?.nickname}`);
    console.log(`  actualData.author?.unique_id: ${actualData.author?.unique_id}`);
    
    // 尝试提取时长
    console.log('\n时长字段:');
    console.log(`  actualData.duration: ${actualData.duration}`);
    
    // 尝试提取统计信息
    console.log('\n统计字段:');
    console.log(`  actualData.statistics?.digg_count: ${actualData.statistics?.digg_count}`);
    console.log(`  actualData.statistics?.comment_count: ${actualData.statistics?.comment_count}`);
    console.log(`  actualData.statistics?.share_count: ${actualData.statistics?.share_count}`);
    console.log(`  actualData.statistics?.play_count: ${actualData.statistics?.play_count}`);
    
    // 检查顶级字段
    console.log('\n顶级字段:');
    const topLevelKeys = Object.keys(actualData).slice(0, 30);
    console.log(`  ${topLevelKeys.join(', ')}`);
    
  } catch (error) {
    console.error(`API调用失败: ${error.message}`);
  }
}

checkStructure().catch(console.error);
