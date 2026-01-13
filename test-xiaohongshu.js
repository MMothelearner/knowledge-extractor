const fs = require('fs');
const LinkProcessor = require('./server/utils/linkProcessor');

// 读取保存的HTML
const htmlContent = fs.readFileSync('/tmp/xiaohongshu.html', 'utf-8');

// 测试提取逻辑
console.log('=== 测试小红书内容提取 ===\n');

// 方法一：从JavaScript数据中提取
console.log('方法一：从JavaScript数据中提取');
const dataMatches = htmlContent.match(/"desc":"([^"]*)"|"title":"([^"]*)"|"content":"([^"]*)"/g);
if (dataMatches && dataMatches.length > 0) {
  console.log(`找到 ${dataMatches.length} 个匹配项`);
  for (let i = 0; i < Math.min(5, dataMatches.length); i++) {
    const match = dataMatches[i];
    const valueMatch = match.match(/"(?:desc|title|content)":"([^"]*)"/);  
    if (valueMatch && valueMatch[1]) {
      const text = valueMatch[1].trim();
      console.log(`  [${i+1}] 长度:${text.length}, 内容: ${text.substring(0, 60)}...`);
    }
  }
} else {
  console.log('未找到匹配项');
}

// 方法二：从文本节点中提取
console.log('\n方法二：从文本节点中提取');
const textMatches = htmlContent.match(/[\u4e00-\u9fff\w\s]{15,}(?=["',]|<\/|\\s*[}\]\\)])/g);
if (textMatches && textMatches.length > 0) {
  console.log(`找到 ${textMatches.length} 个匹配项`);
  const sorted = textMatches.sort((a, b) => b.length - a.length);
  for (let i = 0; i < Math.min(5, sorted.length); i++) {
    const text = sorted[i].trim();
    console.log(`  [${i+1}] 长度:${text.length}, 内容: ${text.substring(0, 60)}...`);
  }
} else {
  console.log('未找到匹配项');
}

// 方法三：查找og:description
console.log('\n方法三：og:description meta标签');
const ogDescMatch = htmlContent.match(/<meta\s+property=['"]og:description['"\s][^>]*content=['"]([^'"]*)['"][^>]*>/i);
if (ogDescMatch && ogDescMatch[1]) {
  console.log(`找到: ${ogDescMatch[1]}`);
} else {
  console.log('未找到');
}

// 方法四：查找标题
console.log('\n方法四：标题提取');
const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
if (titleMatch && titleMatch[1]) {
  const title = titleMatch[1].replace(' - 小红书', '').trim();
  console.log(`找到: ${title}`);
} else {
  console.log('未找到');
}

console.log('\n=== 测试完成 ===');
