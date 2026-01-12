const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KnowledgeEntry = sequelize.define('KnowledgeEntry', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true,
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sourceUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sourceType: {
    type: DataTypes.ENUM('link', 'document'),
    allowNull: false,
    defaultValue: 'link',
  },
  // LLM分析结果
  llmAnalysis: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      questions: [],
      solutions: [],
      keywords: [],
      mindmap: null,
    },
  },
  // 用户笔记
  userNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // 自动建议的分类（JSON数组）
  suggestedCategories: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'knowledge_entries',
  timestamps: true,
});

module.exports = KnowledgeEntry;
