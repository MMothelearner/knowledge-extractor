const { query, testConnection } = require('../config/database');

// 预设分类列表
const PRESET_CATEGORIES = [
  { name: 'Grammar', description: '语法' },
  { name: 'Vocabulary', description: '词汇' },
  { name: 'Listening', description: '听力' },
  { name: 'Reading', description: '阅读' },
  { name: 'Writing', description: '写作' },
  { name: 'Speaking', description: '口语' },
  { name: 'Teaching Methods', description: '教学方法' },
  { name: 'Textbook Introduction', description: '教材介绍' },
  { name: 'Textbook Usage', description: '教材用法' },
  { name: 'Target Audience', description: '教材适合人群' },
  { name: 'Exam Prep', description: '考试准备' },
];

async function initDatabase() {
  try {
    console.log('🔄 正在初始化数据库...');

    // 测试连接
    const connected = await testConnection();
    if (!connected) {
      console.warn('⚠️ 数据库连接失败，跳过初始化');
      return false;
    }

    // 创建categories表
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        is_custom BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ categories表已创建');

    // 创建knowledge_entries表
    await query(`
      CREATE TABLE IF NOT EXISTS knowledge_entries (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        source VARCHAR(1000),
        source_type VARCHAR(50) CHECK (source_type IN ('link', 'document')),
        summary TEXT,
        content TEXT,
        llm_analysis JSONB,
        user_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ knowledge_entries表已创建');

    // 创建entry_categories表（关联表）
    await query(`
      CREATE TABLE IF NOT EXISTS entry_categories (
        id SERIAL PRIMARY KEY,
        entry_id INTEGER NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(entry_id, category_id)
      )
    `);
    console.log('✅ entry_categories表已创建');

    // 创建索引以提高查询性能
    await query(`
      CREATE INDEX IF NOT EXISTS idx_knowledge_entries_title ON knowledge_entries(title);
      CREATE INDEX IF NOT EXISTS idx_knowledge_entries_source_type ON knowledge_entries(source_type);
      CREATE INDEX IF NOT EXISTS idx_entry_categories_entry_id ON entry_categories(entry_id);
      CREATE INDEX IF NOT EXISTS idx_entry_categories_category_id ON entry_categories(category_id);
    `);
    console.log('✅ 索引已创建');

    // 插入预设分类
    for (const category of PRESET_CATEGORIES) {
      try {
        await query(
          `INSERT INTO categories (name, description, is_custom) 
           VALUES ($1, $2, false)
           ON CONFLICT (name) DO NOTHING`,
          [category.name, category.description]
        );
      } catch (error) {
        // 忽略重复插入错误
        if (!error.message.includes('duplicate')) {
          throw error;
        }
      }
    }
    console.log('✅ 预设分类已初始化');

    console.log('✅ 数据库初始化完成！');
    return true;
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    return false;
  }
}

module.exports = { initDatabase };
