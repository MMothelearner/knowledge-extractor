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
const DOCUMENTS_FILE = path.join(DATA_DIR, 'documents.json');

class Document {
  constructor(data = {}) {
    this.id = data.id || generateUUID();
    this.title = data.title || '';
    this.description = data.description || '';
    this.fileName = data.fileName || '';
    this.filePath = data.filePath || '';
    this.fileType = data.fileType || '';
    this.fileSize = data.fileSize || 0;
    this.content = data.content || '';
    this.status = data.status || 'processing'; // processing, completed, failed
    this.extractedKnowledge = data.extractedKnowledge || [];
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
    if (!fs.existsSync(DOCUMENTS_FILE)) {
      return [];
    }
    try {
      const data = fs.readFileSync(DOCUMENTS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading documents:', error);
      return [];
    }
  }

  static saveAll(documents) {
    this.ensureDataDir();
    fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(documents, null, 2));
  }

  static create(data) {
    const doc = new Document(data);
    const documents = this.loadAll();
    documents.push(doc);
    this.saveAll(documents);
    return doc;
  }

  static findById(id) {
    const documents = this.loadAll();
    return documents.find(d => d.id === id);
  }

  static findAll() {
    return this.loadAll();
  }

  static getAll() {
    return this.loadAll();
  }

  static update(id, data) {
    const documents = this.loadAll();
    const index = documents.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error('Document not found');
    }
    const updated = {
      ...documents[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    documents[index] = updated;
    this.saveAll(documents);
    return updated;
  }

  static delete(id) {
    const documents = this.loadAll();
    const filtered = documents.filter(d => d.id !== id);
    this.saveAll(filtered);
  }

  static search(query) {
    const documents = this.loadAll();
    const lowerQuery = query.toLowerCase();
    return documents.filter(d =>
      d.title.toLowerCase().includes(lowerQuery) ||
      d.description.toLowerCase().includes(lowerQuery) ||
      d.content.toLowerCase().includes(lowerQuery)
    );
  }

  static findByStatus(status) {
    const documents = this.loadAll();
    return documents.filter(d => d.status === status);
  }
}

module.exports = Document;
