const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// 获取所有分类
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['isPreset', 'DESC'], ['name', 'ASC']],
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 创建自定义分类
router.post('/', async (req, res) => {
  try {
    const { name, displayName, description } = req.body;

    // 验证必填字段
    if (!name || !displayName) {
      return res.status(400).json({
        success: false,
        error: '分类名称和显示名称是必填的',
      });
    }

    // 检查是否已存在
    const existing = await Category.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: '分类已存在',
      });
    }

    const category = await Category.create({
      name,
      displayName,
      description,
      isPreset: false,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('创建分类失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 更新分类
router.put('/:id', async (req, res) => {
  try {
    const { displayName, description } = req.body;

    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: '分类不存在',
      });
    }

    // 预设分类不能修改
    if (category.isPreset) {
      return res.status(403).json({
        success: false,
        error: '预设分类不能修改',
      });
    }

    if (displayName !== undefined) category.displayName = displayName;
    if (description !== undefined) category.description = description;

    await category.save();

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('更新分类失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 删除分类
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: '分类不存在',
      });
    }

    // 预设分类不能删除
    if (category.isPreset) {
      return res.status(403).json({
        success: false,
        error: '预设分类不能删除',
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: '分类已删除',
    });
  } catch (error) {
    console.error('删除分类失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
