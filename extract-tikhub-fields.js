#!/usr/bin/env node

const axios = require('axios');

const API_KEY = 'vp88JYY1mU+TxzPCNIem5ErhLTqtVZBD+gfmuneZTu2XpwSTHWCRTjmHMw==';
const BASE_URL = 'https://api.tikhub.io/api/v1';

async function extractFields() {
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
    
    const data = response.data;
    
    console.log('=== 关键字段提取 ===\n');
    
    // 尝试提取各种可能的标题字段
    console.log('标题字段:');
    console.log(`  data.title: ${data.title}`);
    console.log(`  data.desc: ${data.desc}`);
    console.log(`  data.aweme_info?.title: ${data.aweme_info?.title}`);
    console.log(`  data.aweme_info?.desc: ${data.aweme_info?.desc}`);
    
    // 尝试提取作者信息
    console.log('\n作者字段:');
    console.log(`  data.author?.nickname: ${data.author?.nickname}`);
    console.log(`  data.aweme_info?.author?.nickname: ${data.aweme_info?.author?.nickname}`);
    
    // 尝试提取时长
    console.log('\n时长字段:');
    console.log(`  data.duration: ${data.duration}`);
    console.log(`  data.aweme_info?.duration: ${data.aweme_info?.duration}`);
    
    // 尝试提取统计信息
    console.log('\n统计字段:');
    console.log(`  data.statistics?.digg_count: ${data.statistics?.digg_count}`);
    console.log(`  data.aweme_info?.statistics?.digg_count: ${data.aweme_info?.statistics?.digg_count}`);
    
    // 检查顶级字段
    console.log('\n顶级字段:');
    const topLevelKeys = Object.keys(data).slice(0, 20);
    console.log(`  ${topLevelKeys.join(', ')}`);
    
    // 如果有aweme_info，检查它的字段
    if (data.aweme_info) {
      console.log('\naweme_info的字段:');
      const awemeKeys = Object.keys(data.aweme_info).slice(0, 20);
      console.log(`  ${awemeKeys.join(', ')}`);
    }
    
  } catch (error) {
    console.error(`API调用失败: ${error.message}`);
  }
}

extractFields().catch(console.error);
