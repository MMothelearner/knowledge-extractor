const AdvancedLinkProcessor = require('./server/utils/advancedLinkProcessor');
const fs = require('fs');

async function test() {
  try {
    console.log('=== 直接测试AdvancedLinkProcessor ===\n');
    
    // 读取保存的HTML
    const html = fs.readFileSync('/tmp/xiaohongshu.html', 'utf-8');
    
    // 模拟handleXiaohongshu的逻辑
    console.log('1. 提取标题:');
    let title = AdvancedLinkProcessor.extractMetaContent(html, 'og:title') || 
                AdvancedLinkProcessor.extractTitle(html) || 
                '小红书笔记';
    console.log(`   原始标题: ${title}`);
    
    // 清理标题
    title = title.replace(/\s*-\s*小红书\s*$/, '').trim();
    console.log(`   清理后标题: ${title}\n`);
    
    console.log('2. 提取描述:');
    const description = AdvancedLinkProcessor.extractMetaContent(html, 'og:description', 'description') || '';
    console.log(`   描述: ${description}\n`);
    
    console.log('3. 提取内容:');
    let content = title;
    console.log(`   初始内容: ${content} (长度: ${content.length})`);
    
    if (content.length < 10) {
      console.log('   内容太短，尝试其他方法...');
      
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
      
      // 方法二：从JSON-LD中提取
      if (content.length < 10) {
        const jsonLdContent = AdvancedLinkProcessor.extractJsonLd(html);
        if (jsonLdContent.length > 20) {
          console.log(`   从JSON-LD提取内容: ${jsonLdContent.substring(0, 60)}`);
          content = jsonLdContent;
        }
      }
    }
    
    console.log(`\n最终内容: ${content}`);
    console.log(`最终内容长度: ${content.length}`);
    
    // 检查是否会通过验证
    console.log(`\n通过验证: ${content.trim().length >= 20 ? '✓ 是' : '✗ 否'}`);
    
  } catch (error) {
    console.error('错误:', error.message);
  }
}

test();
