const fs = require('fs');
const path = require('path');
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const DATA_DIR = process.env.DATA_DIR || './data';
const LINKS_FILE = path.join(DATA_DIR, 'links.json');

class Link {
  constructor(data = {}) {
    this.id = data.id || generateUUID();
    this.url = data.url || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.content = data.content || '';
    this.contentType = data.contentType || ''; // webpage, video, document, etc.
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
    if (!fs.existsSync(LINKS_FILE)) {
      return [];
    }
    try {
      const data = fs.readFileSync(LINKS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading links:', error);
      return [];
    }
  }

  static saveAll(links) {
    this.ensureDataDir();
    fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2));
  }

  static create(data) {
    const link = new Link(data);
    const links = this.loadAll();
    links.push(link);
    this.saveAll(links);
    return link;
  }

  static findById(id) {
    const links = this.loadAll();
    return links.find(l => l.id === id);
  }

  static findAll() {
    return this.loadAll();
  }

  static update(id, data) {
    const links = this.loadAll();
    const index = links.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error('Link not found');
    }
    const updated = {
      ...links[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    links[index] = updated;
    this.saveAll(links);
    return updated;
  }

  static delete(id) {
    const links = this.loadAll();
    const filtered = links.filter(l => l.id !== id);
    this.saveAll(filtered);
  }
}

module.exports = Link;
