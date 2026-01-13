const fs = require('fs');
const AdvancedLinkProcessor = require('./server/utils/advancedLinkProcessor');

async function debug() {
  try {
    console.log('=== 调试小红书内容提取 ===\n');
    
    // 读取保存的HTML
    const html = fs.readFileSync('/tmp/xiaohongshu.html', 'utf-8');
    console.log(`HTML大小: ${html.length} 字节\n`);
    
    // 测试提取方法
    console.log('1. 提取标题:');
    const title = AdvancedLinkProcessor.extractTitle(html);
    console.log(`   标题: ${title}\n`);
    
    console.log('2. 提取描述:');
    const description = AdvancedLinkProcessor.extractMetaContent(html, 'og:description', 'description');
    console.log(`   描述: ${description}\n`);
    
    console.log('3. 提取JSON-LD:');
    const jsonLd = AdvancedLinkProcessor.extractJsonLd(html);
    console.log(`   JSON-LD内容长度: ${jsonLd.length}`);
    console.log(`   内容: ${jsonLd.substring(0, 100)}...\n`);
    
    console.log('4. 提取纯文本:');
    const plainText = AdvancedLinkProcessor.extractPlainText(html);
    console.log(`   纯文本长度: ${plainText.length}`);
    console.log(`   内容: ${plainText.substring(0, 100)}...\n`);
    
    // 模拟handleXiaohongshu逻辑
    console.log('5. 模拟handleXiaohongshu逻辑:');
    let content = title;
    console.log(`   初始内容: ${content} (长度: ${content.length})`);
    
    if (content.length < 20) {
      console.log('   标题太短，尝试其他方法...');
      
      // 方法一：从JavaScript数据中提取
      const dataMatches = html.match(/"desc":"([^"]*)"|"content":"([^"]*)"/g);
      if (dataMatches && dataMatches.length > 0) {
        console.log(`   找到 ${dataMatches.length} 个数据匹配`);
        for (const match of dataMatches) {
          const valueMatch = match.match(/"(?:desc|content)":"([^"]*)"/);  
          if (valueMatch && valueMatch[1]) {
            const text = valueMatch[1].trim();
            if (text.length > 10 && !text.match(/^\d+$/) && !text.match(/javascript|function|小红书/i)) {
              console.log(`   找到有效内容: ${text.substring(0, 60)}`);
              content = text;
              break;
            }
          }
        }
      }
    }
    
    console.log(`\n最终内容: ${content}`);
    console.log(`最终内容长度: ${content.length}`);
    
  } catch (error) {
    console.error('错误:', error.message);
  }
}

debug();
