const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    trim: true,
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isPreset: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否为预设分类',
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '分类标签的颜色（十六进制）',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'categories',
  timestamps: false,
});

module.exports = Category;
