const { query } = require('../config/database');

class Category {
  // 获取所有分类
  static async getAll() {
    try {
      const result = await query(
        `SELECT * FROM categories ORDER BY id ASC`
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // 获取单个分类
  static async getById(id) {
    try {
      const result = await query(
        `SELECT * FROM categories WHERE id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }

  // 创建自定义分类
  static async create(name, description = '') {
    try {
      const result = await query(
        `INSERT INTO categories (name, description, is_custom, created_at)
         VALUES ($1, $2, true, NOW())
         RETURNING *`,
        [name, description]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // 更新分类
  static async update(id, name, description) {
    try {
      const result = await query(
        `UPDATE categories 
         SET name = $1, description = $2
         WHERE id = $3 AND is_custom = true
         RETURNING *`,
        [name, description, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  // 删除自定义分类
  static async delete(id) {
    try {
      // 先删除关联的条目
      await query(`DELETE FROM entry_categories WHERE category_id = $1`, [id]);
      
      // 再删除分类
      const result = await query(
        `DELETE FROM categories WHERE id = $1 AND is_custom = true RETURNING *`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // 获取预设分类
  static async getPresets() {
    try {
      const result = await query(
        `SELECT * FROM categories WHERE is_custom = false ORDER BY id ASC`
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching preset categories:', error);
      throw error;
    }
  }

  // 获取自定义分类
  static async getCustom() {
    try {
      const result = await query(
        `SELECT * FROM categories WHERE is_custom = true ORDER BY created_at DESC`
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching custom categories:', error);
      throw error;
    }
  }
}

module.exports = Category;
