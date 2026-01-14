const axios = require('axios');

async function test() {
  const url = 'https://www.bilibili.com/video/BV1S94y1y7WN';
  const apiKey = 'bdd9884c-1b9c-45e1-9f54-65e25ed004e3';
  
  try {
    const response = await axios.get('https://proxy.scrapeops.io/v1/', {
      params: {
        'api_key': apiKey,
        'url': url,
        'render_javascript': 'true',
        'timeout': '30'
      },
      timeout: 60000
    });
    
    const html = response.data;
    console.log('HTML长度:', html.length);
    
    // 查找og:title
    const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']*?)["']/i);
    console.log('og:title:', titleMatch ? titleMatch[1] : '未找到');
    
    // 查找og:description
    const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']*?)["']/i);
    console.log('og:description:', descMatch ? descMatch[1] : '未找到');
    
    // 查找title标签
    const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    console.log('title标签:', titleTagMatch ? titleTagMatch[1] : '未找到');
    
    // 查找initial_state
    const initialStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[^;]+});/);
    if (initialStateMatch) {
      console.log('找到__INITIAL_STATE__');
      try {
        const state = JSON.parse(initialStateMatch[1]);
        if (state.videoData) {
          console.log('videoData.title:', state.videoData.title);
          console.log('videoData.desc:', state.videoData.desc);
        }
      } catch (e) {
        console.log('解析__INITIAL_STATE__失败');
      }
    } else {
      console.log('未找到__INITIAL_STATE__');
    }
    
    // 保存HTML到文件用于检查
    require('fs').writeFileSync('/tmp/bilibili-scrapeops.html', html);
    console.log('\nHTML已保存到 /tmp/bilibili-scrapeops.html');
    
  } catch (error) {
    console.error('错误:', error.message);
  }
}

test();
