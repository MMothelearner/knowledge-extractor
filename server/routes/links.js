const express = require('express');
const router = express.Router();
const Link = require('../models/Link');
const LinkProcessor = require('../utils/linkProcessor');
const Deduplicator = require('../utils/deduplicator');
const KnowledgePoint = require('../models/KnowledgePoint');

/**
 * 提交链接
 */
router.post('/submit', async (req, res) => {
  try {
    const { url, title, description } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    if (!LinkProcessor.isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL'
      });
    }

    // 创建链接记录
    const link = Link.create({
      url: url,
      title: title || url,
      description: description || '',
      status: 'processing'
    });

    // 异步处理链接
    setImmediate(async () => {
      try {
        // 第一步：获取链接内容
        const content = await LinkProcessor.fetchLinkContent(url);
        
        // 第二步：使用LLM分析内容
        const llmAnalysis = await LinkProcessor.analyzeLinkWithLLM(content);
        
        // 第三步：从分析结果中提取知识点
        const knowledge = [];
        if (llmAnalysis.problems && Array.isArray(llmAnalysis.problems)) {
          knowledge.push(...llmAnalysis.problems);
        }
        if (llmAnalysis.keyPoints && Array.isArray(llmAnalysis.keyPoints)) {
          knowledge.push({
            problem: '关键知识点',
            methods: llmAnalysis.keyPoints
          });
        }

        // 第四步：检测重复
        const existingKnowledge = KnowledgePoint.findAll();
        const deduplicationResult = Deduplicator.detectDuplicates(knowledge, existingKnowledge);

        // 第五步：更新链接记录
        Link.update(link.id, {
          title: content.title || link.title,
          description: content.description || link.description,
          content: content.content,
          contentType: content.type,
          status: 'completed',
          llmAnalysis: llmAnalysis,
          extractedKnowledge: {
            total: knowledge.length,
            new: deduplicationResult.new.length,
            identical: deduplicationResult.identical.length,
            similar: deduplicationResult.similar.length,
            differentMethods: deduplicationResult.differentMethods.length,
            deduplicationResult: deduplicationResult
          }
        });
      } catch (error) {
        console.error('Error processing link:', error);
        Link.update(link.id, {
          status: 'failed',
          error: error.message
        });
      }
    });

    res.status(201).json({
      success: true,
      data: link,
      message: 'Link submitted and processing started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取所有链接
 */
router.get('/', (req, res) => {
  try {
    const links = Link.findAll();
    res.json({
      success: true,
      data: links,
      count: links.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取单个链接
 */
router.get('/:id', (req, res) => {
  try {
    const link = Link.findById(req.params.id);
    if (!link) {
      return res.status(404).json({
        success: false,
        error: 'Link not found'
      });
    }
    res.json({
      success: true,
      data: link
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 删除链接
 */
router.delete('/:id', (req, res) => {
  try {
    const link = Link.findById(req.params.id);
    if (!link) {
      return res.status(404).json({
        success: false,
        error: 'Link not found'
      });
    }

    Link.delete(req.params.id);

    res.json({
      success: true,
      message: 'Link deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 从链接中导入知识点
 */
router.post('/:id/import-knowledge', (req, res) => {
  try {
    const link = Link.findById(req.params.id);
    if (!link) {
      return res.status(404).json({
        success: false,
        error: 'Link not found'
      });
    }

    if (!link.extractedKnowledge || !link.extractedKnowledge.deduplicationResult) {
      return res.status(400).json({
        success: false,
        error: 'Link has not been processed yet'
      });
    }

    const { items } = req.body; // 要导入的知识点索引
    const result = link.extractedKnowledge.deduplicationResult;
    const imported = [];

    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.type === 'new' && result.new[item.index]) {
          const knowledge = result.new[item.index];
          const point = KnowledgePoint.create({
            problem: knowledge.problem,
            methods: knowledge.methods,
            sources: [{
              type: 'link',
              title: link.title,
              url: link.url,
              date: new Date().toISOString()
            }],
            tags: ['imported', link.contentType]
          });
          imported.push(point);
        }
      }
    }

    res.json({
      success: true,
      data: imported,
      message: `${imported.length} knowledge points imported`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取链接处理统计
 */
router.get('/stats/summary', (req, res) => {
  try {
    const links = Link.findAll();
    const stats = {
      total: links.length,
      completed: links.filter(l => l.status === 'completed').length,
      processing: links.filter(l => l.status === 'processing').length,
      failed: links.filter(l => l.status === 'failed').length,
      byType: {}
    };

    // 按类型统计
    links.forEach(link => {
      const type = link.contentType || 'unknown';
      if (!stats.byType[type]) {
        stats.byType[type] = 0;
      }
      stats.byType[type]++;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
