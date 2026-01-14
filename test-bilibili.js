const AdvancedLinkProcessor = require('./server/utils/advancedLinkProcessor');

// 测试Bilibili链接
const testUrls = [
  'https://www.bilibili.com/video/BV1xx411c7mD',
  'https://b23.tv/BV1xx411c7mD',
  'https://www.bilibili.com/video/BV1GJ411x7h7'
];

async function test() {
  for (const url of testUrls) {
    console.log(`\n测试: ${url}`);
    try {
      const result = await AdvancedLinkProcessor.fetchLinkContent(url);
      console.log('✓ 成功');
      console.log('标题:', result.title);
      console.log('描述:', result.description.substring(0, 100));
      console.log('内容长度:', result.content.length);
    } catch (error) {
      console.log('✗ 失败:', error.message);
    }
  }
}

test();
