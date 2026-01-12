const sequelize = require('../config/database');
const KnowledgeEntry = require('../models/KnowledgeEntry');
const Category = require('../models/Category');
const EntryCategory = require('../models/EntryCategory');

// 预设分类列表
const PRESET_CATEGORIES = [
  { name: 'grammar', displayName: 'Grammar', description: '语法相关内容' },
  { name: 'vocabulary', displayName: 'Vocabulary', description: '词汇相关内容' },
  { name: 'listening', displayName: 'Listening', description: '听力相关内容' },
  { name: 'reading', displayName: 'Reading', description: '阅读相关内容' },
  { name: 'writing', displayName: 'Writing', description: '写作相关内容' },
  { name: 'speaking', displayName: 'Speaking', description: '口语相关内容' },
  { name: 'teaching_methods', displayName: 'Teaching Methods', description: '教学方法相关内容' },
  { name: 'textbook_introduction', displayName: 'Textbook Introduction', description: '教材介绍' },
  { name: 'textbook_usage', displayName: 'Textbook Usage', description: '教材用法' },
  { name: 'target_audience', displayName: 'Target Audience', description: '教材适合人群' },
  { name: 'exam_prep', displayName: 'Exam Prep', description: '考试准备相关内容' },
];

async function initDatabase() {
  try {
    console.log('🔄 正在初始化数据库...');

    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 同步模型
    await sequelize.sync({ alter: false });
    console.log('✅ 数据库表创建/更新成功');

    // 初始化预设分类
    for (const category of PRESET_CATEGORIES) {
      const [cat, created] = await Category.findOrCreate({
        where: { name: category.name },
        defaults: {
          ...category,
          isPreset: true,
          color: generateRandomColor(),
        },
      });

      if (created) {
        console.log(`✅ 创建预设分类: ${category.displayName}`);
      }
    }

    console.log('✅ 数据库初始化完成！');
    return true;
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    return false;
  }
}

function generateRandomColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#52C41A',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

module.exports = { initDatabase, PRESET_CATEGORIES };
