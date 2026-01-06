const fs = require('fs');
const path = require('path');

class Exporter {
  /**
   * 导出为Markdown格式
   */
  static toMarkdown(knowledgePoints) {
    let markdown = '# 知识库\n\n';
    markdown += `生成时间: ${new Date().toLocaleString()}\n\n`;
    markdown += `总计: ${knowledgePoints.length} 个知识点\n\n`;
    markdown += '---\n\n';

    for (const point of knowledgePoints) {
      markdown += `## ${point.problem}\n\n`;

      if (point.methods && point.methods.length > 0) {
        markdown += '### 解决方法\n\n';
        for (let i = 0; i < point.methods.length; i++) {
          markdown += `${i + 1}. ${point.methods[i]}\n`;
        }
        markdown += '\n';
      }

      if (point.tags && point.tags.length > 0) {
        markdown += `**标签**: ${point.tags.join(', ')}\n\n`;
      }

      if (point.sources && point.sources.length > 0) {
        markdown += '### 来源\n\n';
        for (const source of point.sources) {
          markdown += `- ${source.title}`;
          if (source.url) {
            markdown += ` ([链接](${source.url}))`;
          }
          markdown += `\n`;
        }
        markdown += '\n';
      }

      markdown += '---\n\n';
    }

    return markdown;
  }

  /**
   * 导出为JSON格式
   */
  static toJSON(knowledgePoints) {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      totalCount: knowledgePoints.length,
      knowledgePoints: knowledgePoints
    }, null, 2);
  }

  /**
   * 导出为CSV格式
   */
  static toCSV(knowledgePoints) {
    let csv = '问题,解决方法,标签,来源,创建时间\n';

    for (const point of knowledgePoints) {
      const problem = this.escapeCSV(point.problem);
      const methods = this.escapeCSV(point.methods ? point.methods.join('; ') : '');
      const tags = this.escapeCSV(point.tags ? point.tags.join(', ') : '');
      const sources = this.escapeCSV(
        point.sources ? point.sources.map(s => s.title).join('; ') : ''
      );
      const createdAt = point.createdAt || '';

      csv += `"${problem}","${methods}","${tags}","${sources}","${createdAt}"\n`;
    }

    return csv;
  }

  /**
   * 导出为HTML格式
   */
  static toHTML(knowledgePoints) {
    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>知识库</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .knowledge-point {
            background-color: #fff;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .problem {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .methods {
            margin: 15px 0;
        }
        .method {
            padding: 10px;
            margin: 5px 0;
            background-color: #f9f9f9;
            border-left: 3px solid #0066cc;
            border-radius: 4px;
        }
        .tags {
            margin: 10px 0;
        }
        .tag {
            display: inline-block;
            background-color: #e0e0e0;
            padding: 4px 8px;
            margin: 2px;
            border-radius: 4px;
            font-size: 12px;
        }
        .sources {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>知识库</h1>
        <p>生成时间: ${new Date().toLocaleString()}</p>
        <p>总计: ${knowledgePoints.length} 个知识点</p>
    </div>
`;

    for (const point of knowledgePoints) {
      html += `<div class="knowledge-point">
        <div class="problem">${this.escapeHTML(point.problem)}</div>
`;

      if (point.methods && point.methods.length > 0) {
        html += '<div class="methods">';
        for (const method of point.methods) {
          html += `<div class="method">${this.escapeHTML(method)}</div>`;
        }
        html += '</div>';
      }

      if (point.tags && point.tags.length > 0) {
        html += '<div class="tags">';
        for (const tag of point.tags) {
          html += `<span class="tag">${this.escapeHTML(tag)}</span>`;
        }
        html += '</div>';
      }

      if (point.sources && point.sources.length > 0) {
        html += '<div class="sources"><strong>来源:</strong> ';
        const sourceTexts = point.sources.map(s => 
          s.url ? `<a href="${s.url}">${this.escapeHTML(s.title)}</a>` : this.escapeHTML(s.title)
        );
        html += sourceTexts.join(', ');
        html += '</div>';
      }

      html += '</div>';
    }

    html += `
</body>
</html>`;

    return html;
  }

  /**
   * 保存文件
   */
  static saveFile(content, fileName, format) {
    const filePath = path.join(process.env.DATA_DIR || './data', `${fileName}.${format}`);
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  /**
   * 转义CSV字段
   */
  static escapeCSV(field) {
    if (!field) return '';
    return field.replace(/"/g, '""');
  }

  /**
   * 转义HTML字符
   */
  static escapeHTML(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

module.exports = Exporter;
