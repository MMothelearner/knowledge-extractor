class Deduplicator {
  /**
   * 检测重复的知识点
   */
  static detectDuplicates(newKnowledge, existingKnowledge) {
    const results = {
      identical: [],
      similar: [],
      differentMethods: [],
      new: []
    };

    for (const newItem of newKnowledge) {
      let found = false;

      for (const existingItem of existingKnowledge) {
        const comparison = this.compareKnowledgePoints(newItem, existingItem);

        if (comparison.type === 'identical') {
          results.identical.push({
            new: newItem,
            existing: existingItem,
            similarity: comparison.score
          });
          found = true;
          break;
        } else if (comparison.type === 'different_methods') {
          results.differentMethods.push({
            new: newItem,
            existing: existingItem,
            similarity: comparison.score
          });
          found = true;
          break;
        } else if (comparison.type === 'similar') {
          results.similar.push({
            new: newItem,
            existing: existingItem,
            similarity: comparison.score
          });
          found = true;
          break;
        }
      }

      if (!found) {
        results.new.push(newItem);
      }
    }

    return results;
  }

  /**
   * 比较两个知识点
   */
  static compareKnowledgePoints(point1, point2) {
    // 提取问题（处理不同的数据格式）
    const problem1 = this.extractProblem(point1);
    const problem2 = this.extractProblem(point2);

    // 提取方法
    const methods1 = this.extractMethods(point1);
    const methods2 = this.extractMethods(point2);

    // 完全相同
    if (this.problemsAreIdentical(problem1, problem2) &&
        this.methodsAreIdentical(methods1, methods2)) {
      return { type: 'identical', score: 1 };
    }

    // 相同问题但不同方法
    if (this.problemsAreIdentical(problem1, problem2)) {
      return { type: 'different_methods', score: 0.9 };
    }

    // 相似问题
    const similarity = this.calculateSimilarity(problem1, problem2);
    if (similarity > 0.7) {
      return { type: 'similar', score: similarity };
    }

    return { type: 'different', score: 0 };
  }

  /**
   * 提取问题
   */
  static extractProblem(point) {
    if (typeof point === 'string') {
      return point;
    }
    if (point.problem) {
      return point.problem;
    }
    if (point.title) {
      return point.title;
    }
    return '';
  }

  /**
   * 提取方法
   */
  static extractMethods(point) {
    if (Array.isArray(point)) {
      return point;
    }
    if (point.methods && Array.isArray(point.methods)) {
      return point.methods;
    }
    if (point.content) {
      return [point.content];
    }
    return [];
  }

  /**
   * 检查问题是否完全相同
   */
  static problemsAreIdentical(problem1, problem2) {
    const normalized1 = this.normalizeProblem(problem1);
    const normalized2 = this.normalizeProblem(problem2);
    return normalized1 === normalized2;
  }

  /**
   * 检查方法是否完全相同
   */
  static methodsAreIdentical(methods1, methods2) {
    if (methods1.length !== methods2.length) {
      return false;
    }

    const normalized1 = methods1.map(m => this.normalizeMethod(m)).sort();
    const normalized2 = methods2.map(m => this.normalizeMethod(m)).sort();

    return JSON.stringify(normalized1) === JSON.stringify(normalized2);
  }

  /**
   * 规范化问题
   */
  static normalizeProblem(problem) {
    return problem
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[?？]/g, '')
      .trim();
  }

  /**
   * 规范化方法
   */
  static normalizeMethod(method) {
    return method
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 计算文本相似度
   */
  static calculateSimilarity(str1, str2) {
    const normalized1 = this.normalizeProblem(str1);
    const normalized2 = this.normalizeProblem(str2);

    if (normalized1 === normalized2) {
      return 1;
    }

    const longer = normalized1.length > normalized2.length ? normalized1 : normalized2;
    const shorter = normalized1.length > normalized2.length ? normalized2 : normalized1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * 计算编辑距离（Levenshtein距离）
   */
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

  /**
   * 合并重复的知识点
   */
  static mergeIdentical(newItem, existingItem) {
    return {
      ...existingItem,
      sources: [
        ...(existingItem.sources || []),
        ...(newItem.sources || [])
      ],
      tags: [...new Set([
        ...(existingItem.tags || []),
        ...(newItem.tags || [])
      ])]
    };
  }

  /**
   * 合并不同方法的知识点
   */
  static mergeDifferentMethods(newItem, existingItem) {
    return {
      ...existingItem,
      methods: [
        ...(existingItem.methods || []),
        ...(newItem.methods || [])
      ],
      sources: [
        ...(existingItem.sources || []),
        ...(newItem.sources || [])
      ]
    };
  }
}

module.exports = Deduplicator;
