#!/usr/bin/env node

const axios = require('axios');

const API_KEY = 'vp88JYY1mU+TxzPCNIem5ErhLTqtVZBD+gfmuneZTu2XpwSTHWCRTjmHMw==';
const BASE_URL = 'https://api.tikhub.io/api/v1';

async function checkAwemeDetail() {
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
    
    const awemeDetail = response.data.data.aweme_detail;
    
    console.log('=== aweme_detail 字段 ===\n');
    
    // 尝试提取各种可能的标题字段
    console.log('标题字段:');
    console.log(`  awemeDetail.title: ${awemeDetail.title}`);
    console.log(`  awemeDetail.desc: ${awemeDetail.desc}`);
    
    // 尝试提取作者信息
    console.log('\n作者字段:');
    console.log(`  awemeDetail.author?.nickname: ${awemeDetail.author?.nickname}`);
    console.log(`  awemeDetail.author?.unique_id: ${awemeDetail.author?.unique_id}`);
    
    // 尝试提取时长
    console.log('\n时长字段:');
    console.log(`  awemeDetail.duration: ${awemeDetail.duration}`);
    
    // 尝试提取统计信息
    console.log('\n统计字段:');
    console.log(`  awemeDetail.statistics?.digg_count: ${awemeDetail.statistics?.digg_count}`);
    console.log(`  awemeDetail.statistics?.comment_count: ${awemeDetail.statistics?.comment_count}`);
    console.log(`  awemeDetail.statistics?.share_count: ${awemeDetail.statistics?.share_count}`);
    console.log(`  awemeDetail.statistics?.play_count: ${awemeDetail.statistics?.play_count}`);
    
    // 检查顶级字段
    console.log('\n顶级字段:');
    const topLevelKeys = Object.keys(awemeDetail).slice(0, 30);
    console.log(`  ${topLevelKeys.join(', ')}`);
    
  } catch (error) {
    console.error(`API调用失败: ${error.message}`);
  }
}

checkAwemeDetail().catch(console.error);
