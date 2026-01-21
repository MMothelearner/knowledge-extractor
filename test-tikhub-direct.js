#!/usr/bin/env node

/**
 * 直接测试TikHub API
 */

const axios = require('axios');

const API_KEY = 'vp88JYY1mU+TxzPCNIem5ErhLTqtVZBD+gfmuneZTu2XpwSTHWCRTjmHMw==';
const BASE_URL = 'https://api.tikhub.io/api/v1';

async function testTikHub() {
  console.log('=== 直接测试TikHub API ===\n');
  
  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  const testUrl = 'https://v.douyin.com/XuFwigSIw8A/';
  
  console.log(`测试URL: ${testUrl}\n`);
  
  // 第一步：提取视频ID
  console.log('1. 提取视频ID...');
  const patterns = [
    /v\.douyin\.com\/([A-Za-z0-9]+)/,
    /douyin\.com\/video\/(\d+)/,
  ];
  
  let videoId = null;
  for (const pattern of patterns) {
    const match = testUrl.match(pattern);
    if (match) {
      videoId = match[1];
      break;
    }
  }
  
  console.log(`   提取的视频ID: ${videoId}\n`);
  
  if (!videoId || videoId.length < 20) {
    console.log('2. 这是短链接，需要解析重定向...');
    try {
      const redirectResponse = await axios.head(testUrl, {
        maxRedirects: 5,
        timeout: 10000,
        validateStatus: () => true,
      });
      
      if (redirectResponse.request && redirectResponse.request.path) {
        const redirectUrl = redirectResponse.request.path;
        console.log(`   重定向路径: ${redirectUrl}`);
        
        for (const pattern of patterns) {
          const match = redirectUrl.match(pattern);
          if (match) {
            videoId = match[1];
            break;
          }
        }
        console.log(`   解析后的视频ID: ${videoId}\n`);
      }
    } catch (error) {
      console.error(`   HTTP重定向失败: ${error.message}\n`);
    }
  }
  
  if (!videoId) {
    console.error('❌ 无法提取视频ID');
    return;
  }
  
  // 第三步：调用TikHub API获取视频信息
  console.log('3. 调用TikHub API获取视频信息...');
  try {
    const response = await client.get('/douyin/app/v3/fetch_one_video', {
      params: {
        video_id: videoId,
      },
    });
    
    console.log('   ✅ API调用成功！\n');
    console.log('   响应数据:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error(`   ❌ API调用失败: ${error.message}`);
    if (error.response) {
      console.error(`   状态码: ${error.response.status}`);
      console.error(`   响应: ${JSON.stringify(error.response.data)}`);
    }
  }
}

testTikHub().catch(console.error);
