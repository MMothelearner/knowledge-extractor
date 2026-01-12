const { Pool } = require('pg');
require('dotenv').config();

// 创建连接池
let pool = null;

// 初始化数据库连接
function initializePool() {
  if (pool) return pool;

  const connectionConfig = process.env.DATABASE_URL 
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'knowledge_extractor',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      };

  pool = new Pool(connectionConfig);

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  return pool;
}

// 获取连接池
function getPool() {
  if (!pool) {
    initializePool();
  }
  return pool;
}

// 执行查询
async function query(text, params = []) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 测试连接
async function testConnection() {
  try {
    const result = await query('SELECT NOW()');
    console.log('✅ PostgreSQL连接成功:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL连接失败:', error.message);
    return false;
  }
}

module.exports = {
  getPool,
  query,
  testConnection,
  initializePool
};
