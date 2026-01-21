#!/usr/bin/env node

const axios = require('axios');

const API_KEY = 'vp88JYY1mU+TxzPCNIem5ErhLTqtVZBD+gfmuneZTu2XpwSTHWCRTjmHMw==';
const BASE_URL = 'https://api.tikhub.io/api/v1';

async function testXiaohongshu() {
  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // 测试小红书链接
  const xiaohongshuUrl = 'https://www.xiaohongshu.com/explore/67a4e7c4000000001f01e1d8';
  
  try {
    console.log('=== 测试小红书链接 ===\n');
    console.log(`URL: ${xiaohongshuUrl}\n`);
    
    // 尝试直接调用TikHub API处理小红书链接
    const response = await client.post('/fetch_url_content', {
      url: xiaohongshuUrl,
    });
    
    console.log('API响应:');
    console.log(JSON.stringify(response.data, null, 2).substring(0, 1000));
    
  } catch (error) {
    console.error(`API调用失败: ${error.response?.data || error.message}`);
  }
}

testXiaohongshu().catch(console.error);
