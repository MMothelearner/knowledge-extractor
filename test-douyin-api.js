/**
 * 测试DouyinApiClient
 * 用于验证Douyin API集成是否正常工作
 */

const DouyinApiClient = require('./server/utils/douyinApiClient');

// 测试链接
const testUrl = 'https://v.douyin.com/XuFwigSIw8A/';

async function runTest() {
  console.log('========== Douyin API 测试开始 ==========\n');
  
  const client = new DouyinApiClient();
  
  try {
    // 测试1: 提取视频ID
    console.log('测试1: 提取视频ID');
    console.log(`输入: ${testUrl}`);
    try {
      const videoId = client.extractVideoId(testUrl);
      console.log(`✅ 提取成功: ${videoId}\n`);
    } catch (error) {
      console.log(`⚠️  提取失败 (预期): ${error.message}`);
      console.log('   原因: 短链接需要通过API解析\n');
    }
    
    // 测试2: 检查API配置
    console.log('测试2: 检查API配置');
    const apiUrl = process.env.DOUYIN_API_URL;
    if (apiUrl) {
      console.log(`✅ API地址已配置: ${apiUrl}\n`);
      
      // 测试3: 获取视频信息
      console.log('测试3: 获取视频信息');
      console.log(`正在调用: ${apiUrl}/api/douyin/web/fetch_one_video`);
      try {
        const videoInfo = await client.fetchVideoInfo(testUrl);
        console.log('✅ 视频信息获取成功:');
        console.log(`   标题: ${videoInfo.title}`);
        console.log(`   作者: ${videoInfo.author}`);
        console.log(`   时长: ${videoInfo.duration}秒`);
        console.log(`   点赞: ${videoInfo.likeCount}`);
        console.log(`   评论: ${videoInfo.commentCount}\n`);
      } catch (error) {
        console.log(`❌ 获取失败: ${error.message}\n`);
      }
    } else {
      console.log('⚠️  API地址未配置 (DOUYIN_API_URL)');
      console.log('   请设置环境变量: export DOUYIN_API_URL=http://localhost:8000\n');
    }
    
    // 测试4: 生成ID
    console.log('测试4: 生成唯一ID');
    const id1 = client.generateId();
    const id2 = client.generateId();
    console.log(`✅ ID生成成功:`);
    console.log(`   ID1: ${id1}`);
    console.log(`   ID2: ${id2}`);
    console.log(`   是否唯一: ${id1 !== id2 ? '✅ 是' : '❌ 否'}\n`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
  
  console.log('========== 测试完成 ==========');
}

// 运行测试
runTest().catch(console.error);
