const AdvancedLinkProcessor = require('./server/utils/advancedLinkProcessor');

// 使用一些有效的Bilibili视频链接进行测试
const testUrls = [
  'https://www.bilibili.com/video/BV1jJ411a7pL',  // 一个常见的视频
  'https://www.bilibili.com/video/BV1zJ411x7kA',  // 另一个视频
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
      console.log('视频ID:', result.videoId);
    } catch (error) {
      console.log('✗ 失败:', error.message);
    }
  }
}

test();
