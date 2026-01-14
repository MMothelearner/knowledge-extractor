const axios = require('axios');

const testLinks = [
  {
    name: 'Bilibili',
    url: 'https://www.bilibili.com/video/BV1S94y1y7WN'
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  },
  {
    name: '小红书',
    url: 'https://www.xiaohongshu.com/explore/6524f5e30000000014000d2d'
  }
];

async function testLink(link) {
  try {
    console.log(`\n📝 测试 ${link.name}: ${link.url}`);
    
    const response = await axios.post('http://localhost:3000/api/smart-analysis/link', 
      { url: link.url },
      { timeout: 180000 }
    );
    
    if (response.data.success) {
      const data = response.data.data;
      console.log(`✅ 成功`);
      console.log(`   标题: ${data.title.substring(0, 50)}...`);
      console.log(`   内容长度: ${data.content.length} 字符`);
      console.log(`   来源: ${data.source}`);
      console.log(`   分析状态: ${data.analysis ? '已分析' : '未分析'}`);
      return true;
    } else {
      console.log(`❌ 失败: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 开始测试所有平台...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const link of testLinks) {
    const result = await testLink(link);
    if (result) passed++;
    else failed++;
    
    // 等待2秒再进行下一个测试
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n📊 测试结果: ${passed}/${testLinks.length} 通过`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
