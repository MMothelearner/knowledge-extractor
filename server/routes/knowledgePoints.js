const express = require('express');
const router = express.Router();
const KnowledgePoint = require('../models/KnowledgePoint');
const Exporter = require('../utils/exporter');
const Deduplicator = require('../utils/deduplicator');

/**
 * 获取所有知识点
 */
router.get('/', (req, res) => {
  try {
    const points = KnowledgePoint.findAll();
    res.json({
      success: true,
      data: points,
      count: points.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取单个知识点
 */
router.get('/:id', (req, res) => {
  try {
    const point = KnowledgePoint.findById(req.params.id);
    if (!point) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge point not found'
      });
    }
    res.json({
      success: true,
      data: point
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 创建知识点
 */
router.post('/', (req, res) => {
  try {
    const { problem, methods, sources, tags, mindmap, status } = req.body;

    if (!problem) {
      return res.status(400).json({
        success: false,
        error: 'Problem is required'
      });
    }

    const point = KnowledgePoint.create({
      problem,
      methods: methods || [],
      sources: sources || [],
      tags: tags || [],
      mindmap: mindmap || null,
      status: status || 'draft'
    });

    res.status(201).json({
      success: true,
      data: point,
      message: 'Knowledge point created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 更新知识点
 */
router.put('/:id', (req, res) => {
  try {
    const point = KnowledgePoint.findById(req.params.id);
    if (!point) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge point not found'
      });
    }

    const updated = KnowledgePoint.update(req.params.id, req.body);
    res.json({
      success: true,
      data: updated,
      message: 'Knowledge point updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 删除知识点
 */
router.delete('/:id', (req, res) => {
  try {
    const point = KnowledgePoint.findById(req.params.id);
    if (!point) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge point not found'
      });
    }

    KnowledgePoint.delete(req.params.id);
    res.json({
      success: true,
      message: 'Knowledge point deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 搜索知识点
 */
router.get('/search/:query', (req, res) => {
  try {
    const results = KnowledgePoint.search(req.params.query);
    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 按标签查询
 */
router.get('/tag/:tag', (req, res) => {
  try {
    const results = KnowledgePoint.findByTag(req.params.tag);
    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 检测重复
 */
router.get('/duplicates/check', (req, res) => {
  try {
    const duplicates = KnowledgePoint.findDuplicates();
    res.json({
      success: true,
      data: duplicates,
      count: duplicates.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 导出知识点
 */
router.get('/export/:format', (req, res) => {
  try {
    const points = KnowledgePoint.findAll();
    const format = req.params.format.toLowerCase();

    let content, contentType, fileName;

    switch (format) {
      case 'markdown':
      case 'md':
        content = Exporter.toMarkdown(points);
        contentType = 'text/markdown';
        fileName = 'knowledge_points.md';
        break;
      case 'json':
        content = Exporter.toJSON(points);
        contentType = 'application/json';
        fileName = 'knowledge_points.json';
        break;
      case 'csv':
        content = Exporter.toCSV(points);
        contentType = 'text/csv';
        fileName = 'knowledge_points.csv';
        break;
      case 'html':
        content = Exporter.toHTML(points);
        contentType = 'text/html';
        fileName = 'knowledge_points.html';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported format. Supported: markdown, json, csv, html'
        });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(content);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
