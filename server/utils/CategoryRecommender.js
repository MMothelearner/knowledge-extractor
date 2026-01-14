/**
 * 智能分类推荐系统
 * 基于多维度评分算法，根据内容智能推荐分类
 */

class CategoryRecommender {
  constructor() {
    // 分类定义和关键词库
    this.categoryDefinitions = {
      1: {
        name: '语法',
        nameEn: 'Grammar',
        coreKeywords: ['语法', 'grammar', 'tense', 'verb', '动词', '时态', '句式', '结构'],
        relatedKeywords: ['句子', 'sentence', 'clause', '从句', '主语', 'predicate', '宾语', 'object'],
        highWeightKeywords: ['语法规则', '语法讲解', '语法分析', '语法错误', '语法修正'],
        weight: 1.0
      },
      2: {
        name: '词汇',
        nameEn: 'Vocabulary',
        coreKeywords: ['词汇', 'vocabulary', 'word', '单词', '短语', 'phrase', '词'],
        relatedKeywords: ['词义', 'meaning', '同义词', 'synonym', '反义词', 'antonym', '词根'],
        highWeightKeywords: ['词汇学习', '词汇扩展', '词汇记忆', '词汇积累', '常用词汇'],
        weight: 1.0
      },
      3: {
        name: '听力',
        nameEn: 'Listening',
        coreKeywords: ['听力', 'listening', 'audio', '音频', '听', '发音', 'pronunciation'],
        relatedKeywords: ['音频', 'sound', '口音', 'accent', '语速', 'speed', '听懂'],
        highWeightKeywords: ['听力训练', '听力理解', '听力技巧', '听力材料', '听力练习'],
        weight: 1.0
      },
      4: {
        name: '阅读',
        nameEn: 'Reading',
        coreKeywords: ['阅读', 'reading', 'read', '文章', 'article', '阅读'],
        relatedKeywords: ['文本', 'text', '段落', 'paragraph', '理解', 'comprehension', '内容'],
        highWeightKeywords: ['阅读理解', '阅读技巧', '阅读速度', '阅读材料', '阅读练习'],
        weight: 1.0
      },
      5: {
        name: '写作',
        nameEn: 'Writing',
        coreKeywords: ['写作', 'writing', 'write', '作文', 'essay', '写'],
        relatedKeywords: ['段落', 'paragraph', '结构', 'structure', '表达', 'expression', '组织'],
        highWeightKeywords: ['写作技巧', '写作训练', '写作指南', '写作范文', '写作模板'],
        weight: 1.0
      },
      6: {
        name: '口语',
        nameEn: 'Speaking',
        coreKeywords: ['口语', 'speaking', 'speak', '说', '对话', 'conversation', '交流'],
        relatedKeywords: ['发音', 'pronunciation', '流利', 'fluency', '表达', 'expression', '沟通'],
        highWeightKeywords: ['口语训练', '口语表达', '口语技巧', '口语练习', '日常口语'],
        weight: 1.0
      },
      7: {
        name: '教学',
        nameEn: 'Teaching',
        coreKeywords: ['教学', 'teaching', 'teach', '教学', '方法', 'method', '课堂'],
        relatedKeywords: ['课程', 'course', '教师', 'teacher', '学习方法', '教学资源'],
        highWeightKeywords: ['教学方法', '教学策略', '课堂管理', '教学技巧', '教学经验'],
        weight: 1.0
      },
      8: {
        name: '教材',
        nameEn: 'Textbook',
        coreKeywords: ['教材', 'textbook', '教科书', '教学资源', '教材'],
        relatedKeywords: ['教科书', '教学资源', '学习资料', '课本', '教学材料'],
        highWeightKeywords: ['教材选择', '教材推荐', '教材对比', '教材分析', '教材评价'],
        weight: 1.0
      },
      9: {
        name: '用法',
        nameEn: 'Usage',
        coreKeywords: ['用法', 'usage', '用法', '使用', '应用', 'application'],
        relatedKeywords: ['应用', 'application', '实践', 'practice', '场景', 'scenario', '例子'],
        highWeightKeywords: ['实际应用', '使用场景', '用法对比', '用法区别', '用法指南'],
        weight: 1.0
      },
      10: {
        name: '人群',
        nameEn: 'Audience',
        coreKeywords: ['人群', 'audience', '学生', '初学者', 'beginner', '高级', 'advanced'],
        relatedKeywords: ['水平', 'level', '年龄', 'age', '儿童', 'children', '成人', 'adult'],
        highWeightKeywords: ['初学者指南', '高级技巧', '儿童英语', '成人英语', '青少年英语'],
        weight: 1.0
      },
      11: {
        name: '考试',
        nameEn: 'Exam',
        coreKeywords: ['考试', 'exam', 'test', 'FCE', 'IELTS', 'TOEFL', '考试'],
        relatedKeywords: ['准备', 'preparation', '技巧', 'tip', '策略', 'strategy', '真题'],
        highWeightKeywords: ['考试准备', '考试技巧', '真题讲解', '考试策略', '考试经验'],
        weight: 1.0
      }
    };
  }

  /**
   * 计算关键词匹配分数
   */
  calculateKeywordScore(text, keywords, baseScore = 1) {
    let score = 0;
    const textLower = text.toLowerCase();
    
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      // 计算关键词出现次数
      const matches = (textLower.match(new RegExp(keywordLower, 'g')) || []).length;
      score += matches * baseScore;
    }
    
    return score;
  }

  /**
   * 计算标题匹配分数 (权重: 40%)
   */
  calculateTitleScore(title, categoryId) {
    const category = this.categoryDefinitions[categoryId];
    let score = 0;

    // 核心关键词: 10分/个
    score += this.calculateKeywordScore(title, category.coreKeywords, 10);

    // 相关关键词: 5分/个
    score += this.calculateKeywordScore(title, category.relatedKeywords, 5);

    // 高权重关键词: 15分/个
    score += this.calculateKeywordScore(title, category.highWeightKeywords, 15);

    return score * 0.4; // 应用权重
  }

  /**
   * 计算摘要/描述匹配分数 (权重: 30%)
   */
  calculateSummaryScore(summary, categoryId) {
    if (!summary) return 0;

    const category = this.categoryDefinitions[categoryId];
    let score = 0;

    // 核心关键词: 2分/个
    score += this.calculateKeywordScore(summary, category.coreKeywords, 2);

    // 相关关键词: 1分/个
    score += this.calculateKeywordScore(summary, category.relatedKeywords, 1);

    // 高权重关键词: 5分/个
    score += this.calculateKeywordScore(summary, category.highWeightKeywords, 5);

    return score * 0.3; // 应用权重
  }

  /**
   * 计算LLM分析结果匹配分数 (权重: 20%)
   */
  calculateLLMScore(llmAnalysis, categoryId) {
    if (!llmAnalysis) return 0;

    const category = this.categoryDefinitions[categoryId];
    let score = 0;

    // topic字段: 5分
    if (llmAnalysis.topic) {
      score += this.calculateKeywordScore(llmAnalysis.topic, category.coreKeywords, 5);
    }

    // keywords字段: 3分/个
    if (llmAnalysis.keywords && Array.isArray(llmAnalysis.keywords)) {
      const keywordsText = llmAnalysis.keywords.join(' ');
      score += this.calculateKeywordScore(keywordsText, category.coreKeywords, 3);
      score += this.calculateKeywordScore(keywordsText, category.highWeightKeywords, 5);
    }

    // methods字段: 2分/个
    if (llmAnalysis.methods && Array.isArray(llmAnalysis.methods)) {
      const methodsText = llmAnalysis.methods.join(' ');
      score += this.calculateKeywordScore(methodsText, category.coreKeywords, 2);
    }

    // summary字段: 1分/个
    if (llmAnalysis.summary) {
      score += this.calculateKeywordScore(llmAnalysis.summary, category.coreKeywords, 1);
    }

    return score * 0.2; // 应用权重
  }

  /**
   * 计算内容相关性分数 (权重: 10%)
   */
  calculateContentScore(contentType, source, categoryId) {
    let score = 0;

    // 基于内容类型的匹配
    if (contentType) {
      const contentTypeLower = contentType.toLowerCase();
      
      // 视频内容更适合听力、口语、阅读
      if (contentTypeLower.includes('video')) {
        if ([3, 4, 6].includes(categoryId)) score += 5;
      }
      
      // 文章内容更适合阅读、写作
      if (contentTypeLower.includes('article') || contentTypeLower.includes('post')) {
        if ([4, 5].includes(categoryId)) score += 5;
      }
    }

    // 基于来源平台的匹配
    if (source) {
      const sourceLower = source.toLowerCase();
      
      // Bilibili视频更适合听力、口语
      if (sourceLower.includes('bilibili')) {
        if ([3, 6].includes(categoryId)) score += 3;
      }
      
      // YouTube视频更适合听力
      if (sourceLower.includes('youtube')) {
        if ([3].includes(categoryId)) score += 3;
      }
    }

    return score * 0.1; // 应用权重
  }

  /**
   * 计算总分数
   */
  calculateTotalScore(title, summary, llmAnalysis, contentType, source, categoryId) {
    const titleScore = this.calculateTitleScore(title, categoryId);
    const summaryScore = this.calculateSummaryScore(summary, categoryId);
    const llmScore = this.calculateLLMScore(llmAnalysis, categoryId);
    const contentScore = this.calculateContentScore(contentType, source, categoryId);

    const totalScore = titleScore + summaryScore + llmScore + contentScore;
    
    return {
      total: totalScore,
      titleScore,
      summaryScore,
      llmScore,
      contentScore
    };
  }

  /**
   * 计算置信度 (0-100%)
   */
  calculateConfidence(score, maxScore = 50) {
    const confidence = Math.min((score / maxScore) * 100, 100);
    return Math.round(confidence);
  }

  /**
   * 推荐分类
   */
  recommendCategories(title, summary, llmAnalysis, contentType, source) {
    const scores = {};

    // 计算每个分类的分数
    for (const categoryId of Object.keys(this.categoryDefinitions)) {
      const categoryIdNum = parseInt(categoryId);
      const scoreData = this.calculateTotalScore(
        title,
        summary,
        llmAnalysis,
        contentType,
        source,
        categoryIdNum
      );
      
      scores[categoryIdNum] = {
        score: scoreData.total,
        confidence: this.calculateConfidence(scoreData.total),
        details: scoreData
      };
    }

    // 按分数排序
    const sortedCategories = Object.entries(scores)
      .filter(([_, data]) => data.score > 0)
      .sort((a, b) => b[1].score - a[1].score);

    // 动态决定推荐数量
    let recommendCount = 3;
    if (sortedCategories.length > 0) {
      const maxScore = sortedCategories[0][1].score;
      
      if (maxScore > 30) {
        recommendCount = 1;
      } else if (maxScore > 20) {
        recommendCount = 2;
      } else if (maxScore > 10) {
        recommendCount = 3;
      } else if (maxScore > 5) {
        recommendCount = Math.min(5, sortedCategories.length);
      } else {
        recommendCount = sortedCategories.length;
      }
    }

    // 获取推荐的分类
    const recommended = sortedCategories
      .slice(0, recommendCount)
      .map(([categoryId, data]) => ({
        categoryId: parseInt(categoryId),
        categoryName: this.categoryDefinitions[categoryId].name,
        categoryNameEn: this.categoryDefinitions[categoryId].nameEn,
        score: Math.round(data.score * 10) / 10,
        confidence: data.confidence,
        details: data.details
      }));

    return {
      recommended,
      allScores: scores,
      totalCategories: Object.keys(this.categoryDefinitions).length,
      recommendedCount: recommended.length
    };
  }

  /**
   * 获取分类信息
   */
  getCategoryInfo(categoryId) {
    return this.categoryDefinitions[categoryId] || null;
  }

  /**
   * 获取所有分类
   */
  getAllCategories() {
    const categories = [];
    for (const [id, def] of Object.entries(this.categoryDefinitions)) {
      categories.push({
        id: parseInt(id),
        name: def.name,
        nameEn: def.nameEn
      });
    }
    return categories;
  }
}

module.exports = CategoryRecommender;
