const AdvancedLinkProcessor = require('./server/utils/advancedLinkProcessor');
const fs = require('fs');

async function test() {
  try {
    console.log('=== 测试handleXiaohongshu方法 ===\n');
    
    // 保存原始的axios.get方法
    const axios = require('axios');
    const originalGet = axios.get;
    
    // 模拟axios.get以返回保存的HTML
    axios.get = async (url, config) => {
      console.log(`模拟请求: ${url}`);
      
      if (url.includes('proxy.scrapeops.io')) {
        // ScrapeOps代理请求
        const html = fs.readFileSync('/tmp/xiaohongshu.html', 'utf-8');
        return { data: html };
      } else {
        // 其他请求
        const html = fs.readFileSync('/tmp/xiaohongshu.html', 'utf-8');
        return { data: html };
      }
    };
    
    // 调用handleXiaohongshu
    const result = await AdvancedLinkProcessor.handleXiaohongshu('http://xhslink.com/o/n9cg7NeWIf');
    
    console.log('\n提取结果:');
    console.log(`- 类型: ${result.type}`);
    console.log(`- 标题: ${result.title}`);
    console.log(`- 描述: ${result.description}`);
    console.log(`- 内容: ${result.content}`);
    console.log(`- 内容长度: ${result.content.length}`);
    console.log(`- URL: ${result.url}`);
    console.log(`- 来源: ${result.source}`);
    
    // 恢复原始方法
    axios.get = originalGet;
    
  } catch (error) {
    console.error('错误:', error.message);
  }
}

test();
