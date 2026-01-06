const fs = require('fs');
const path = require('path');

// 简单的UUID生成方法 - 不依赖任何外部包
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const DATA_DIR = process.env.DATA_DIR || './data';
const KNOWLEDGE_POINTS_FILE = path.join(DATA_DIR, 'knowledge_points.json');

class KnowledgePoint {
  constructor(data = {}) {
    this.id = data.id || generateUUID();
    this.problem = data.problem || '';
    this.methods = data.methods || [];
    this.sources = data.sources || [];
    this.tags = data.tags || [];
    this.mindmap = data.mindmap || null;
    this.status = data.status || 'draft'; // draft, reviewed, published
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  static ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  static loadAll() {
    this.ensureDataDir();
    if (!fs.existsSync(KNOWLEDGE_POINTS_FILE)) {
      return [];
    }
    try {
      const data = fs.readFileSync(KNOWLEDGE_POINTS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading knowledge points:', error);
      return [];
    }
  }

  static saveAll(points) {
    this.ensureDataDir();
    fs.writeFileSync(KNOWLEDGE_POINTS_FILE, JSON.stringify(points, null, 2));
  }

  static create(data) {
    const point = new KnowledgePoint(data);
    const points = this.loadAll();
    points.push(point);
    this.saveAll(points);
    return point;
  }

  static findById(id) {
    const points = this.loadAll();
    return points.find(p => p.id === id);
  }

  static findAll() {
    return this.loadAll();
  }

  static update(id, data) {
    const points = this.loadAll();
    const index = points.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Knowledge point not found');
    }
    const updated = {
      ...points[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    points[index] = updated;
    this.saveAll(points);
    return updated;
  }

  static delete(id) {
    const points = this.loadAll();
    const filtered = points.filter(p => p.id !== id);
    this.saveAll(filtered);
  }

  static search(query) {
    const points = this.loadAll();
    const lowerQuery = query.toLowerCase();
    return points.filter(p =>
      p.problem.toLowerCase().includes(lowerQuery) ||
      p.methods.some(m => m.toLowerCase().includes(lowerQuery)) ||
      p.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }

  static findByTag(tag) {
    const points = this.loadAll();
    return points.filter(p => p.tags.includes(tag));
  }

  static findDuplicates() {
    const points = this.loadAll();
    const duplicates = [];

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const similarity = this.calculateSimilarity(points[i], points[j]);
        if (similarity.type !== 'different') {
          duplicates.push({
            type: similarity.type,
            point1: points[i],
            point2: points[j],
            similarity: similarity.score
          });
        }
      }
    }

    return duplicates;
  }

  static calculateSimilarity(point1, point2) {
    // 完全相同
    if (point1.problem === point2.problem &&
        JSON.stringify(point1.methods.sort()) === JSON.stringify(point2.methods.sort())) {
      return { type: 'identical', score: 1 };
    }

    // 相同问题但不同方法
    if (point1.problem === point2.problem) {
      return { type: 'different_methods', score: 0.9 };
    }

    // 相似问题（简单的文本相似度）
    const similarity = this.textSimilarity(point1.problem, point2.problem);
    if (similarity > 0.7) {
      return { type: 'similar', score: similarity };
    }

    return { type: 'different', score: 0 };
  }

  static textSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  static levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

module.exports = KnowledgePoint;
