const axios = require('axios');

async function debugBilibili() {
  const url = 'https://www.bilibili.com/video/BV1GJ411x7h7';
  
  try {
    console.log('正在获取Bilibili页面...');
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com/'
      },
      timeout: 15000
    });

    const html = response.data;
    console.log(`\n获取到HTML，长度: ${html.length}`);
    
    // 查找og:title
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
    console.log(`\nog:title: ${titleMatch ? titleMatch[1] : '未找到'}`);
    
    // 查找og:description
    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/);
    console.log(`og:description: ${descMatch ? descMatch[1].substring(0, 100) : '未找到'}`);
    
    // 查找title标签
    const titleTagMatch = html.match(/<title>([^<]+)<\/title>/);
    console.log(`title标签: ${titleTagMatch ? titleTagMatch[1] : '未找到'}`);
    
    // 查找JSON-LD
    const jsonLdMatch = html.match(/<script\s+type="application\/ld\+json">([^<]+)<\/script>/);
    console.log(`JSON-LD: ${jsonLdMatch ? '找到' : '未找到'}`);
    
    // 查找初始数据
    const initialDataMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[^;]+});/);
    console.log(`初始数据: ${initialDataMatch ? '找到' : '未找到'}`);
    
    // 保存HTML到文件以便检查
    const fs = require('fs');
    fs.writeFileSync('/tmp/bilibili.html', html);
    console.log('\nHTML已保存到 /tmp/bilibili.html');
    
  } catch (error) {
    console.error('错误:', error.message);
  }
}

debugBilibili();
