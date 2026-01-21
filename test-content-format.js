#!/usr/bin/env node

const axios = require('axios');

const API_KEY = 'vp88JYY1mU+TxzPCNIem5ErhLTqtVZBD+gfmuneZTu2XpwSTHWCRTjmHMw==';
const BASE_URL = 'https://api.tikhub.io/api/v1';

async function testContentFormat() {
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
    
    // 模拟getVideoFromUrl返回的数据
    const videoInfo = {
      title: awemeDetail.desc || 'Untitled',
      description: awemeDetail.desc || '',
      author: awemeDetail.author?.nickname || 'Unknown',
      duration: Math.floor((awemeDetail.duration || 0) / 1000),
      likes: awemeDetail.statistics?.digg_count || 0,
      comments: awemeDetail.statistics?.comment_count || 0,
      shares: awemeDetail.statistics?.share_count || 0,
      views: awemeDetail.statistics?.play_count || 0,
    };
    
    // 模拟handleDouyinWithApi构建的content
    const content = [
      `标题: ${videoInfo.title}`,
      `作者: ${videoInfo.author}`,
      `描述: ${videoInfo.description}`,
      `时长: ${videoInfo.duration}秒`,
      `点赞: ${videoInfo.likes}`,
      `评论: ${videoInfo.comments}`,
      `分享: ${videoInfo.shares}`,
      `浏览: ${videoInfo.views}`
    ].filter(line => line.trim()).join('\n');
    
    console.log('=== 传给LLM的content ===\n');
    console.log(content);
    console.log('\n=== 长度 ===');
    console.log(`字符数: ${content.length}`);
    
  } catch (error) {
    console.error(`API调用失败: ${error.message}`);
  }
}

testContentFormat().catch(console.error);
