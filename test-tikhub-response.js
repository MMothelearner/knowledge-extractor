#!/usr/bin/env node

const axios = require('axios');

const API_KEY = 'vp88JYY1mU+TxzPCNIem5ErhLTqtVZBD+gfmuneZTu2XpwSTHWCRTjmHMw==';
const BASE_URL = 'https://api.tikhub.io/api/v1';

async function testTikHub() {
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
    
    console.log('完整响应数据:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error(`API调用失败: ${error.message}`);
  }
}

testTikHub().catch(console.error);
