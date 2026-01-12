const { Sequelize } = require('sequelize');
require('dotenv').config();

// 从环境变量获取数据库连接信息
const databaseUrl = process.env.DATABASE_URL;

let sequelize;

if (databaseUrl) {
  // 使用Railway提供的DATABASE_URL
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
} else {
  // 本地开发环境
  sequelize = new Sequelize(
    process.env.DB_NAME || 'knowledge_extractor',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    }
  );
}

module.exports = sequelize;
