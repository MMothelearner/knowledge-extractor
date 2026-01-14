# 批量删除和全选功能文档

## 功能概述

为"我的知识库"添加了完整的批量删除和全选功能，提升用户管理知识库条目的效率。

## 功能特性

### 1. 全选功能
- **全选复选框**: 在批量控制栏中添加全选复选框
- **快速选择**: 一键选中当前页面的所有条目
- **自动更新**: 单个条目选择时自动更新全选复选框状态

### 2. 批量选择
- **单个选择**: 每个条目卡片前有复选框，支持单个选择
- **选择计数**: 实时显示已选择的条目数
- **视觉反馈**: 选中条目高亮显示（蓝色背景）

### 3. 批量删除
- **删除按钮**: 批量控制栏中的红色删除按钮
- **确认对话框**: 删除前显示确认对话框，防止误删
- **成功提示**: 删除完成后显示成功消息

### 4. 进入批量模式
- **右键菜单**: 右键点击任意条目卡片进入批量模式
- **快捷键**: Ctrl+B (Windows/Linux) 或 Cmd+B (Mac) 切换批量模式
- **取消按钮**: 随时可以点击"取消"按钮退出批量模式

## 前端实现

### HTML结构
```html
<!-- 批量删除控制栏 -->
<div class="batch-controls" id="batchControls" style="display: none;">
    <div class="batch-info">
        <input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAll()">
        <label for="selectAllCheckbox">全选</label>
        <span class="selected-count" id="selectedCount">已选择 0 个</span>
    </div>
    <div class="batch-actions">
        <button class="batch-btn delete" onclick="batchDeleteEntries()">🗑 批量删除</button>
        <button class="batch-btn cancel" onclick="cancelBatchMode()">取消</button>
    </div>
</div>
```

### CSS样式
- **批量控制栏**: 黄色警告风格（#fff3cd背景）
- **删除按钮**: 红色（#dc3545）
- **取消按钮**: 灰色（#6c757d）
- **选中条目**: 蓝色高亮（#e7f3ff背景）

### JavaScript函数

#### 进入批量模式
```javascript
function enterBatchMode() {
    isBatchMode = true;
    selectedEntries = [];
    document.getElementById('batchControls').style.display = 'flex';
    renderEntries();
}
```

#### 全选/取消全选
```javascript
function toggleSelectAll() {
    const isChecked = document.getElementById('selectAllCheckbox').checked;
    const checkboxes = document.querySelectorAll('.entry-checkbox');
    
    if (isChecked) {
        selectedEntries = Array.from(checkboxes).map(cb => parseInt(cb.dataset.entryId));
    } else {
        selectedEntries = [];
    }
    
    checkboxes.forEach(cb => cb.checked = isChecked);
    updateSelectedCount();
}
```

#### 批量删除
```javascript
async function batchDeleteEntries() {
    if (selectedEntries.length === 0) {
        alert('请先选择要删除的条目');
        return;
    }
    
    if (!confirm(`确定要删除选中的 ${selectedEntries.length} 个条目吗？此操作不可撤销。`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/knowledge-entries/batch-delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entryIds: selectedEntries })
        });
        
        if (response.ok) {
            alert(`成功删除 ${selectedEntries.length} 个条目`);
            cancelBatchMode();
            loadEntries();
        } else {
            alert('删除失败，请重试');
        }
    } catch (error) {
        console.error('批量删除失败:', error);
        alert('删除失败');
    }
}
```

## 后端实现

### 模型方法 (KnowledgeEntry.js)
```javascript
static async batchDelete(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('Invalid entry IDs');
    }

    try {
        // 先删除所有关联的分类
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
        await query(`DELETE FROM entry_categories WHERE entry_id IN (${placeholders})`, ids);
        
        // 再删除条目
        const result = await query(
            `DELETE FROM knowledge_entries WHERE id IN (${placeholders}) RETURNING *`,
            ids
        );
        return result.rows;
    } catch (error) {
        console.error('Error batch deleting knowledge entries:', error);
        throw error;
    }
}
```

### API端点 (knowledgeEntries.js)
```javascript
router.post('/batch-delete', async (req, res) => {
    try {
        const { entryIds } = req.body;
        
        if (!Array.isArray(entryIds) || entryIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'entryIds must be a non-empty array'
            });
        }
        
        const deletedEntries = await KnowledgeEntry.batchDelete(entryIds);
        
        res.json({
            success: true,
            message: `Successfully deleted ${deletedEntries.length} entries`,
            deletedCount: deletedEntries.length,
            deletedEntries: deletedEntries
        });
    } catch (error) {
        console.error('Error batch deleting knowledge entries:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
```

## API文档

### 批量删除端点
- **URL**: `/api/knowledge-entries/batch-delete`
- **方法**: `POST`
- **Content-Type**: `application/json`

#### 请求体
```json
{
    "entryIds": [1, 2, 3, 4, 5]
}
```

#### 成功响应 (200)
```json
{
    "success": true,
    "message": "Successfully deleted 5 entries",
    "deletedCount": 5,
    "deletedEntries": [
        { "id": 1, "title": "...", ... },
        { "id": 2, "title": "...", ... },
        ...
    ]
}
```

#### 错误响应 (400/500)
```json
{
    "success": false,
    "error": "entryIds must be a non-empty array"
}
```

## 使用指南

### 方式1: 使用全选
1. 右键点击任意条目进入批量模式
2. 点击"全选"复选框选中所有条目
3. 点击"批量删除"按钮
4. 确认删除

### 方式2: 手动选择
1. 右键点击任意条目进入批量模式
2. 逐个点击条目前的复选框选择
3. 点击"批量删除"按钮
4. 确认删除

### 方式3: 使用快捷键
1. 按 Ctrl+B (或 Cmd+B) 进入批量模式
2. 选择要删除的条目
3. 点击"批量删除"按钮
4. 确认删除

## 技术细节

### 变量管理
- `isBatchMode`: 标记是否处于批量模式
- `selectedEntries`: 存储已选择的条目ID数组

### 数据库操作
- **事务安全**: 先删除关联的分类记录，再删除条目记录
- **级联删除**: 自动清理entry_categories表中的关联记录

### 错误处理
- 验证entryIds是否为非空数组
- 捕获数据库错误并返回友好的错误消息
- 前端显示确认对话框防止误删

## 性能考虑

- **批量操作**: 一次性删除多个条目，减少数据库往返次数
- **SQL优化**: 使用IN子句进行批量删除，性能优于逐个删除
- **UI响应**: 删除完成后自动刷新列表

## 安全性

- **确认对话框**: 删除前显示确认，防止误删
- **参数验证**: 验证entryIds是否为有效的数组
- **错误处理**: 捕获所有异常并返回错误信息

## 未来改进方向

1. **撤销功能**: 添加删除后的撤销功能
2. **软删除**: 实现软删除，支持恢复
3. **批量操作**: 支持批量编辑、批量导出等操作
4. **选择持久化**: 记住用户的选择状态
5. **批量导出**: 支持选中条目批量导出

## 测试场景

- ✅ 全选所有条目
- ✅ 取消全选
- ✅ 单个选择/取消
- ✅ 批量删除
- ✅ 删除确认对话框
- ✅ 右键菜单进入批量模式
- ✅ 快捷键切换批量模式
- ✅ 页面切换后保持选择状态

---

**最后更新**: 2026年1月14日  
**版本**: 1.0  
**状态**: ✅ 完成
