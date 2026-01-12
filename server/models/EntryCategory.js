const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const KnowledgeEntry = require('./KnowledgeEntry');
const Category = require('./Category');

const EntryCategory = sequelize.define('EntryCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  entryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: KnowledgeEntry,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Category,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'entry_categories',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['entryId', 'categoryId'],
    },
  ],
});

// 定义关联
KnowledgeEntry.belongsToMany(Category, {
  through: EntryCategory,
  foreignKey: 'entryId',
  otherKey: 'categoryId',
});

Category.belongsToMany(KnowledgeEntry, {
  through: EntryCategory,
  foreignKey: 'categoryId',
  otherKey: 'entryId',
});

module.exports = EntryCategory;
