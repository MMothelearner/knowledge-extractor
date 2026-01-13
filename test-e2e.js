const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testXiaohongshuExtraction() {
  try {
    console.log('=== 端到端测试：小红书链接提取 ===\n');
    
    // 测试链接
    const testUrl = 'http://xhslink.com/o/n9cg7NeWIf';
    console.log(`测试链接: ${testUrl}\n`);
    
    // 调用API
    console.log('1. 发送分析请求...');
    const response = await axios.post(`${API_URL}/api/smart-analysis/link`, {
      url: testUrl
    }, {
      timeout: 60000
    });
    
    console.log('✓ 请求成功\n');
    
    // 检查响应
    const result = response.data;
    if (result.success) {
      const data = result.data;
      console.log('2. 链接内容提取:');
      console.log(`   - 标题: ${data.title}`);
      console.log(`   - 描述: ${data.description}`);
      console.log(`   - 内容类型: ${data.contentType}`);
      console.log(`   - 来源: ${data.source}\n`);
      
      // 检查LLM分析
      if (data.analysis) {
        console.log('3. LLM分析结果:');
        console.log(`   - 生成标题: ${data.analysis.title}`);
        console.log(`   - 问题: ${data.analysis.problem}`);
        console.log(`   - 主题: ${data.analysis.topic}`);
        console.log(`   - 摘要: ${data.analysis.summary.substring(0, 100)}...`);
        
        // 安全处理keyPoints
        const keyPoints = data.analysis.keyPoints || [];
        if (Array.isArray(keyPoints) && keyPoints.length > 0) {
          console.log(`   - 关键点: ${keyPoints.join(', ')}\n`);
        } else {
          console.log(`   - 关键点: (无)\n`);
        }
      }
      
      console.log('✓ 测试完成！');
      console.log('✓ 小红书链接提取功能正常工作');
    } else {
      console.error('❌ API返回错误:', result.error);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:');
    if (error.response) {
      console.error(`   状态码: ${error.response.status}`);
      console.error(`   错误: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

testXiaohongshuExtraction();
