#!/usr/bin/env node

const axios = require('axios');

const API_KEY = 'vp88JYY1mU+TxzPCNIem5ErhLTqtVZBD+gfmuneZTu2XpwSTHWCRTjmHMw==';
const BASE_URL = 'https://api.tikhub.io/api/v1';

async function testEndpoints() {
  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });

  // 测试小红书链接
  const xiaohongshuUrl = 'https://www.xiaohongshu.com/explore/67a4e7c4000000001f01e1d8';
  
  const endpoints = [
    { method: 'get', path: '/xiaohongshu/web/v1/fetch', params: { url: xiaohongshuUrl } },
    { method: 'get', path: '/xiaohongshu/app/v1/fetch', params: { url: xiaohongshuUrl } },
    { method: 'post', path: '/fetch_url_content', data: { url: xiaohongshuUrl } },
    { method: 'get', path: '/fetch_url_content', params: { url: xiaohongshuUrl } },
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n尝试: ${endpoint.method.toUpperCase()} ${endpoint.path}`);
      
      const config = endpoint.method === 'get' ? { params: endpoint.params } : { data: endpoint.data };
      const response = await client[endpoint.method](endpoint.path, config);
      
      console.log(`✅ 成功! 状态: ${response.status}`);
      console.log(`响应摘要: ${JSON.stringify(response.data).substring(0, 200)}`);
      break;
    } catch (error) {
      console.log(`❌ 失败: ${error.response?.status || error.message}`);
    }
  }
}

testEndpoints().catch(console.error);
