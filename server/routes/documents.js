const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const DocumentProcessor = require('../utils/documentProcessor');
const Deduplicator = require('../utils/deduplicator');
const KnowledgePoint = require('../models/KnowledgePoint');

// 配置上传
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || 50000000)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt,png,jpg,jpeg,gif').split(',');
    const ext = path.extname(file.originalname).substring(1).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${ext}`));
    }
  }
});

/**
 * 上传文档
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const fileType = path.extname(req.file.originalname).substring(1).toLowerCase();
    const { title, description } = req.body;

    // 创建文档记录
    const doc = Document.create({
      title: title || req.file.originalname,
      description: description || '',
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: fileType,
      fileSize: req.file.size,
      status: 'processing'
    });

    // 异步处理文档
    setImmediate(async () => {
      try {
        const processed = await DocumentProcessor.processDocument(req.file.path, fileType);
        const knowledge = DocumentProcessor.extractKnowledge(processed.text);

        // 检测重复
        const existingKnowledge = KnowledgePoint.findAll();
        const deduplicationResult = Deduplicator.detectDuplicates(knowledge, existingKnowledge);

        // 更新文档
        Document.update(doc.id, {
          content: processed.text,
          status: 'completed',
          extractedKnowledge: {
            total: knowledge.length,
            new: deduplicationResult.new.length,
            identical: deduplicationResult.identical.length,
            similar: deduplicationResult.similar.length,
            differentMethods: deduplicationResult.differentMethods.length,
            deduplicationResult: deduplicationResult
          }
        });
      } catch (error) {
        Document.update(doc.id, {
          status: 'failed',
          error: error.message
        });
      }
    });

    res.status(201).json({
      success: true,
      data: doc,
      message: 'Document uploaded and processing started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取所有文档
 */
router.get('/', (req, res) => {
  try {
    const documents = Document.findAll();
    res.json({
      success: true,
      data: documents,
      count: documents.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取单个文档
 */
router.get('/:id', (req, res) => {
  try {
    const doc = Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 删除文档
 */
router.delete('/:id', (req, res) => {
  try {
    const doc = Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // 删除文件
    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    // 删除记录
    Document.delete(req.params.id);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 从文档中导入知识点
 */
router.post('/:id/import-knowledge', (req, res) => {
  try {
    const doc = Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    if (!doc.extractedKnowledge || !doc.extractedKnowledge.deduplicationResult) {
      return res.status(400).json({
        success: false,
        error: 'Document has not been processed yet'
      });
    }

    const { items } = req.body; // 要导入的知识点索引
    const result = doc.extractedKnowledge.deduplicationResult;
    const imported = [];

    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.type === 'new' && result.new[item.index]) {
          const knowledge = result.new[item.index];
          const point = KnowledgePoint.create({
            problem: knowledge.problem,
            methods: knowledge.methods,
            sources: [{
              type: 'document',
              title: doc.title,
              date: new Date().toISOString()
            }],
            tags: ['imported']
          });
          imported.push(point);
        }
      }
    }

    res.json({
      success: true,
      data: imported,
      message: `${imported.length} knowledge points imported`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
