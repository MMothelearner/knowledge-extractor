/**
 * 智能分析API路由
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const SmartDocumentProcessor = require('../utils/smartDocumentProcessor');
const AdvancedLinkProcessor = require('../utils/advancedLinkProcessor');
const router = express.Router();
const processor = new SmartDocumentProcessor();
const advancedLinkProcessor = new AdvancedLinkProcessor();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

/**
 * 上传并分析文档
 * POST /api/smart-analysis/upload
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有文件被上传' });
    }

    console.log(`开始处理文件: ${req.file.filename}`);

    // 处理文档
    const result = await processor.processDocument(
      req.file.path,
      req.file.originalname
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 分析文本内容
 * POST /api/smart-analysis/text
 */
router.post('/text', async (req, res) => {
  try {
    const { content, contentType = 'text' } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '内容不能为空' });
    }

    console.log(`开始分析文本内容，长度: ${content.length}`);

    const analysis = await processor.llmAnalyzer.analyzeContent(content, contentType);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Text Analysis Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 分析链接
 * POST /api/smart-analysis/link
 */
router.post('/link', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL不能为空' });
    }

    console.log(`开始处理链接: ${url}`);

    // 使用改进的爬虫系统
    const linkContent = await AdvancedLinkProcessor.fetchLinkContent(url);
    console.log(`链接内容提取成功，内容长度: ${linkContent.content.length}`);

    // 即使内容很少也继续处理 - 让LLM去判断内容是否足够
    const contentLength = linkContent.content.trim().length;
    if (contentLength > 0) {
      console.log(`内容长度: ${contentLength}字符，继续进行LLM分析`);
    } else {
      console.warn(`警告：无法提取任何内容`);
    }

    // 进行LLM分析 - 无论内容多少都进行分析
    const analysis = await processor.llmAnalyzer.analyzeContent(linkContent.content, linkContent.type);

    const result = {
      url: url,
      title: analysis.title || linkContent.title,
      description: linkContent.description,
      contentType: linkContent.type,
      source: linkContent.source,
      analysis: analysis,
      processedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Link Processing Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 分析大型文档（分段处理）
 * POST /api/smart-analysis/large-document
 */
router.post('/large-document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有文件被上传' });
    }

    const chunkSize = req.body.chunkSize || 5000;

    console.log(`开始分段处理大型文件: ${req.file.filename}`);

    const result = await processor.processLargeDocument(
      req.file.path,
      req.file.originalname,
      parseInt(chunkSize)
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Large Document Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取分析历史
 * GET /api/smart-analysis/history
 */
router.get('/history', (req, res) => {
  try {
    // 这里可以从数据库获取历史记录
    res.json({
      success: true,
      data: {
        message: '历史记录功能开发中'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
