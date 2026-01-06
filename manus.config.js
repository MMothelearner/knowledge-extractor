module.exports = {
  name: 'Knowledge Extractor',
  description: 'Intelligent knowledge extraction and organization platform',
  version: '1.0.0',
  type: 'web',
  port: 3000,
  environment: {
    NODE_ENV: 'production',
    UPLOAD_DIR: './uploads',
    DATA_DIR: './data',
    MAX_FILE_SIZE: '50000000',
    ALLOWED_FILE_TYPES: 'pdf,txt,md'
  }
};
