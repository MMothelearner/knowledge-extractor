const express = require('express');
const router = express.Router();
const KnowledgeEntry = require('../models/KnowledgeEntry');

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

// 自动分类建议
router.post('/suggest-categories', async (req, res) => {
  try {
    const { title, summary, llmAnalysis } = req.body;

    // 分类关键词映射
    const categoryKeywords = {
      1: ['语法', 'grammar', 'tense', 'verb', '动词', '时态', '句式', '结构'],
      2: ['词汇', 'vocabulary', 'word', '单词', '词汇', '短语', 'phrase'],
      3: ['听力', 'listening', 'audio', '音频', '听', '发音'],
      4: ['阅读', 'reading', 'read', '阅读', '文章', 'article'],
      5: ['写作', 'writing', 'write', '写', '作文', 'essay'],
      6: ['口语', 'speaking', 'speak', '说', '对话', 'conversation'],
      7: ['教学', 'teaching', 'teach', '教学', '方法', 'method', '课堂'],
      8: ['教材', 'textbook', '教材', '教科书', '教学资源'],
      9: ['用法', 'usage', '用法', '使用', '应用'],
      10: ['人群', 'audience', '人群', '学生', '初学者', 'beginner', '高级'],
      11: ['考试', 'exam', 'test', '考试', 'FCE', 'IELTS', 'TOEFL']
    };

    const text = `${title} ${summary} ${JSON.stringify(llmAnalysis || {})}`.toLowerCase();
    const suggestedCategories = [];

    // 计算每个分类的匹配分数
    const categoryScores = {};
    for (const [catId, keywords] of Object.entries(categoryKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      if (score > 0) {
        categoryScores[catId] = score;
      }
    }

    // 获取得分最高的3个分类
    const topCategories = Object.entries(categoryScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([catId]) => parseInt(catId));

    res.json({
      success: true,
      suggestedCategories: topCategories
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

module.exports = router;
