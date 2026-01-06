require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// 导入路由
const knowledgePointsRoutes = require('./routes/knowledgePoints');
const documentsRoutes = require('./routes/documents');
const linksRoutes = require('./routes/links');
const smartAnalysisRoutes = require('./routes/smartAnalysis');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// API路由
app.use('/api/knowledge-points', knowledgePointsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/smart-analysis', smartAnalysisRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Knowledge Extractor is running',
    timestamp: new Date().toISOString()
  });
});

// 获取系统统计信息
app.get('/api/stats', (req, res) => {
  try {
    const KnowledgePoint = require('./models/KnowledgePoint');
    const Document = require('./models/Document');
    const Link = require('./models/Link');

    const knowledgePoints = KnowledgePoint.findAll();
    const documents = Document.findAll();
    const links = Link.findAll();

    res.json({
      success: true,
      stats: {
        knowledgePoints: knowledgePoints.length,
        documents: documents.length,
        links: links.length,
        documentsProcessing: documents.filter(d => d.status === 'processing').length,
        linksProcessing: links.filter(l => l.status === 'processing').length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Knowledge Extractor is running on http://localhost:${PORT}`);
  console.log(`API documentation: http://localhost:${PORT}/api/health`);
});
