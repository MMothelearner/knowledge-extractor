const axios = require('axios');

const testUrls = [
  { url: 'https://www.bilibili.com/video/BV1jJ411a7pL', name: 'Bilibili' },
  { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', name: 'YouTube' },
  { url: 'https://xhslink.com/o/n9cg7NeWIf', name: 'Xiaohongshu' },
];

async function testAll() {
  for (const test of testUrls) {
    console.log(`\n测试 ${test.name}: ${test.url}`);
    try {
      const response = await axios.post('http://localhost:3000/api/smart-analysis/link', {
        url: test.url
      }, { timeout: 30000 });
      
      if (response.data.success) {
        console.log('✓ 成功');
        console.log('  标题:', response.data.data.title.substring(0, 60));
        console.log('  来源:', response.data.data.source);
        console.log('  分析:', response.data.data.analysis.problem ? '✓ 有' : '✗ 无');
      } else {
        console.log('✗ 失败:', response.data.error);
      }
    } catch (error) {
      console.log('✗ 错误:', error.message);
    }
  }
}

testAll();
