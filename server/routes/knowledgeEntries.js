const express = require('express');
const router = express.Router();
const KnowledgeEntry = require('../models/KnowledgeEntry');
const CategoryRecommender = require('../utils/CategoryRecommender');

const categoryRecommender = new CategoryRecommender();

// 获取所有知识库条目（支持搜索、筛选、排序）
router.get('/', async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      sourceType: req.query.sourceType,
      categoryIds: req.query.categoryIds ? JSON.parse(req.query.categoryIds) : [],
      sortBy: req.query.sortBy || 'date'
    };

    const entries = await KnowledgeEntry.getAll(filters);
    res.json({
      success: true,
      entries: entries,
      count: entries.length
    });
  } catch (error) {
    console.error('Error fetching knowledge entries:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取单个知识库条目
router.get('/:id', async (req, res) => {
  try {
    const entry = await KnowledgeEntry.getById(req.params.id);
    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }
    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error fetching knowledge entry:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 自动分类建议 - 使用智能推荐系统
router.post('/suggest-categories', async (req, res) => {
  try {
    const { title, summary, llmAnalysis, contentType, source } = req.body;

    const result = categoryRecommender.recommendCategories(
      title,
      summary,
      llmAnalysis,
      contentType,
      source
    );

    res.json({
      success: true,
      suggestedCategories: result.recommended.map(cat => ({
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        categoryNameEn: cat.categoryNameEn,
        score: cat.score,
        confidence: cat.confidence
      })),
      details: {
        totalRecommended: result.recommendedCount,
        totalCategories: result.totalCategories,
        allScores: result.allScores
      }
    });
  } catch (error) {
    console.error('Error suggesting categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 创建知识库条目
router.post('/', async (req, res) => {
  try {
    const { title, source, sourceType, summary, content, llmAnalysis, userNotes, categoryIds } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    const entry = await KnowledgeEntry.create({
      title,
      source,
      sourceType: sourceType || 'link',
      summary,
      content,
      llmAnalysis,
      userNotes: userNotes || null,
      categoryIds: categoryIds || []
    });

    res.status(201).json({
      success: true,
      data: entry,
      message: 'Knowledge entry created successfully'
    });
  } catch (error) {
    console.error('Error creating knowledge entry:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 更新知识库条目
router.put('/:id', async (req, res) => {
  try {
    const { title, summary, userNotes, categoryIds } = req.body;

    const entry = await KnowledgeEntry.update(req.params.id, {
      title,
      summary,
      userNotes,
      categoryIds
    });

    res.json({
      success: true,
      data: entry,
      message: 'Knowledge entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating knowledge entry:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 删除知识库条目
router.delete('/:id', async (req, res) => {
  try {
    await KnowledgeEntry.delete(req.params.id);
    res.json({
      success: true,
      message: 'Knowledge entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting knowledge entry:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// 批量删除知识库条目
router.post('/batch-delete', async (req, res) => {
  try {
    const { entryIds } = req.body;
    
    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'entryIds must be a non-empty array'
      });
    }
    
    const deletedEntries = await KnowledgeEntry.batchDelete(entryIds);
    
    res.json({
      success: true,
      message: `Successfully deleted ${deletedEntries.length} entries`,
      deletedCount: deletedEntries.length,
      deletedEntries: deletedEntries
    });
  } catch (error) {
    console.error('Error batch deleting knowledge entries:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
module.exports = router;
