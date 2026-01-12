const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const KnowledgeEntry = require('../models/KnowledgeEntry');
const Category = require('../models/Category');
const EntryCategory = require('../models/EntryCategory');

// 创建知识库条目
router.post('/', async (req, res) => {
  try {
    const {
      title,
      summary,
      sourceUrl,
      fileName,
      sourceType,
      llmAnalysis,
      userNotes,
      suggestedCategories,
      categoryIds,
    } = req.body;

    // 验证必填字段
    if (!title || !sourceType) {
      return res.status(400).json({
        success: false,
        error: '标题和来源类型是必填的',
      });
    }

    // 创建条目
    const entry = await KnowledgeEntry.create({
      title,
      summary,
      sourceUrl,
      fileName,
      sourceType,
      llmAnalysis,
      userNotes,
      suggestedCategories,
    });

    // 添加分类
    if (categoryIds && categoryIds.length > 0) {
      await entry.addCategories(categoryIds);
    }

    // 获取完整数据
    const fullEntry = await KnowledgeEntry.findByPk(entry.id, {
      include: [{ model: Category, through: { attributes: [] } }],
    });

    res.status(201).json({
      success: true,
      data: fullEntry,
    });
  } catch (error) {
    console.error('创建知识库条目失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 获取知识库条目列表（支持搜索、筛选、排序）
router.get('/', async (req, res) => {
  try {
    const {
      search,
      sourceType,
      categoryIds,
      sortBy = 'title',
      sortOrder = 'ASC',
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};
    const include = [{ model: Category, through: { attributes: [] } }];

    // 全文搜索
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { summary: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // 按来源类型筛选
    if (sourceType) {
      where.sourceType = sourceType;
    }

    // 按分类筛选
    if (categoryIds && categoryIds.length > 0) {
      const categoryArray = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
      include[0].where = { id: { [Op.in]: categoryArray } };
      include[0].required = true; // INNER JOIN
    }

    // 排序
    const order = [];
    if (sortBy === 'title') {
      order.push(['title', sortOrder]);
    } else if (sortBy === 'createdAt') {
      order.push(['createdAt', sortOrder]);
    }

    // 分页
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await KnowledgeEntry.findAndCountAll({
      where,
      include,
      order,
      offset,
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('获取知识库条目列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 获取单个知识库条目
router.get('/:id', async (req, res) => {
  try {
    const entry = await KnowledgeEntry.findByPk(req.params.id, {
      include: [{ model: Category, through: { attributes: [] } }],
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: '知识库条目不存在',
      });
    }

    res.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error('获取知识库条目失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 更新知识库条目
router.put('/:id', async (req, res) => {
  try {
    const { title, summary, userNotes, categoryIds } = req.body;

    const entry = await KnowledgeEntry.findByPk(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: '知识库条目不存在',
      });
    }

    // 更新字段
    if (title !== undefined) entry.title = title;
    if (summary !== undefined) entry.summary = summary;
    if (userNotes !== undefined) entry.userNotes = userNotes;

    await entry.save();

    // 更新分类
    if (categoryIds !== undefined) {
      await entry.setCategories(categoryIds);
    }

    // 获取完整数据
    const fullEntry = await KnowledgeEntry.findByPk(entry.id, {
      include: [{ model: Category, through: { attributes: [] } }],
    });

    res.json({
      success: true,
      data: fullEntry,
    });
  } catch (error) {
    console.error('更新知识库条目失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 删除知识库条目
router.delete('/:id', async (req, res) => {
  try {
    const entry = await KnowledgeEntry.findByPk(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: '知识库条目不存在',
      });
    }

    await entry.destroy();

    res.json({
      success: true,
      message: '知识库条目已删除',
    });
  } catch (error) {
    console.error('删除知识库条目失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
