const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// 获取所有分类
router.get('/', async (req, res) => {
  try {
    const categories = await Category.getAll();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取预设分类
router.get('/presets', async (req, res) => {
  try {
    const categories = await Category.getPresets();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching preset categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取自定义分类
router.get('/custom', async (req, res) => {
  try {
    const categories = await Category.getCustom();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching custom categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取单个分类
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.getById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 创建自定义分类
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    const category = await Category.create(name, description);
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 更新分类
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    const category = await Category.update(req.params.id, name, description);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found or cannot update preset categories'
      });
    }

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 删除分类
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.delete(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found or cannot delete preset categories'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
