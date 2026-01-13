const { query } = require('../config/database');

class KnowledgeEntry {
  // 创建知识库条目
  static async create(data) {
    const {
      title,
      source,
      sourceType, // 'link' 或 'document'
      summary,
      content,
      llmAnalysis, // JSON格式：{problems, solutions, keywords, mindmap}
      userNotes,
      categoryIds = []
    } = data;

    try {
      const result = await query(
        `INSERT INTO knowledge_entries (title, source, source_type, summary, content, llm_analysis, user_notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [title, source, sourceType, summary, content, JSON.stringify(llmAnalysis), userNotes]
      );

      const entryId = result.rows[0].id;

      // 添加分类关联
      if (categoryIds && categoryIds.length > 0) {
        for (const categoryId of categoryIds) {
          await query(
            `INSERT INTO entry_categories (entry_id, category_id) VALUES ($1, $2)`,
            [entryId, categoryId]
          );
        }
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error creating knowledge entry:', error);
      throw error;
    }
  }

  // 获取所有条目（支持搜索、筛选、排序）
  static async getAll(filters = {}) {
    try {
      let query_text = `
        SELECT ke.*, 
               array_agg(json_build_object('id', c.id, 'name', c.name)) as categories
        FROM knowledge_entries ke
        LEFT JOIN entry_categories ec ON ke.id = ec.entry_id
        LEFT JOIN categories c ON ec.category_id = c.id
        WHERE 1=1
      `;
      
      // 如果指定了分类过滤，需要改用INNER JOIN以确保只返回有分类的条目
      if (filters.categoryIds && filters.categoryIds.length > 0) {
        query_text = `
          SELECT ke.*, 
                 array_agg(json_build_object('id', c.id, 'name', c.name)) as categories
          FROM knowledge_entries ke
          INNER JOIN entry_categories ec ON ke.id = ec.entry_id
          INNER JOIN categories c ON ec.category_id = c.id
          WHERE 1=1
        `;
      }
      const params = [];
      let paramCount = 1;

      // 搜索过滤
      if (filters.search) {
        query_text += ` AND (ke.title ILIKE $${paramCount} OR ke.summary ILIKE $${paramCount} OR ke.content ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
        paramCount++;
      }

      // 类型过滤
      if (filters.sourceType) {
        query_text += ` AND ke.source_type = $${paramCount}`;
        params.push(filters.sourceType);
        paramCount++;
      }

      // 分类过滤
      if (filters.categoryIds && filters.categoryIds.length > 0) {
        query_text += ` AND ec.category_id = ANY($${paramCount}::int[])`;
        params.push(filters.categoryIds);
        paramCount++;
      }

      // 分组 - 如果使用INNER JOIN需要包括c.id
      if (filters.categoryIds && filters.categoryIds.length > 0) {
        query_text += ` GROUP BY ke.id, c.id`;
      } else {
        query_text += ` GROUP BY ke.id`;
      }

      // 排序
      if (filters.sortBy === 'title') {
        query_text += ` ORDER BY ke.title ASC`;
      } else {
        query_text += ` ORDER BY ke.created_at DESC`;
      }

      const result = await query(query_text, params);
      return result.rows;
    } catch (error) {
      console.error('Error fetching knowledge entries:', error);
      throw error;
    }
  }

  // 获取单个条目
  static async getById(id) {
    try {
      const result = await query(
        `SELECT ke.*, 
                array_agg(json_build_object('id', c.id, 'name', c.name)) as categories
         FROM knowledge_entries ke
         LEFT JOIN entry_categories ec ON ke.id = ec.entry_id
         LEFT JOIN categories c ON ec.category_id = c.id
         WHERE ke.id = $1
         GROUP BY ke.id`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching knowledge entry:', error);
      throw error;
    }
  }

  // 更新条目
  static async update(id, data) {
    try {
      const { title, summary, userNotes, categoryIds } = data;
      
      const result = await query(
        `UPDATE knowledge_entries 
         SET title = COALESCE($1, title),
             summary = COALESCE($2, summary),
             user_notes = COALESCE($3, user_notes),
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [title, summary, userNotes, id]
      );

      // 更新分类
      if (categoryIds) {
        // 删除旧的分类关联
        await query(`DELETE FROM entry_categories WHERE entry_id = $1`, [id]);
        
        // 添加新的分类关联
        for (const categoryId of categoryIds) {
          await query(
            `INSERT INTO entry_categories (entry_id, category_id) VALUES ($1, $2)`,
            [id, categoryId]
          );
        }
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error updating knowledge entry:', error);
      throw error;
    }
  }

  // 删除条目
  static async delete(id) {
    try {
      // 先删除关联的分类
      await query(`DELETE FROM entry_categories WHERE entry_id = $1`, [id]);
      
      // 再删除条目
      const result = await query(
        `DELETE FROM knowledge_entries WHERE id = $1 RETURNING *`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting knowledge entry:', error);
      throw error;
    }
  }

  // 按分类获取条目数
  static async getCountByCategory() {
    try {
      const result = await query(
        `SELECT c.id, c.name, COUNT(ke.id) as count
         FROM categories c
         LEFT JOIN entry_categories ec ON c.id = ec.category_id
         LEFT JOIN knowledge_entries ke ON ec.entry_id = ke.id
         GROUP BY c.id, c.name
         ORDER BY c.id`
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting count by category:', error);
      throw error;
    }
  }
}

module.exports = KnowledgeEntry;
