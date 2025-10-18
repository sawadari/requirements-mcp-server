/**
 * View Server - ブラウザでビューを表示するWebサーバー
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import chokidar from 'chokidar';
import { marked } from 'marked';
import { OperationLogger } from './operation-logger.js';
import { RequirementsStorage } from './storage.js';
import { TreeBuilder } from './tree-view.js';

const app = express();
const PORT = 5002;
const storage = new RequirementsStorage('./data');

// CORS有効化
app.use(cors());
app.use(express.json());

// 静的ファイル提供
app.use('/views', express.static(path.join(process.cwd(), 'views')));

// ビュー定義
const VIEWS = [
  { id: 'stakeholder-requirements', name: 'ステークホルダ要求リスト', icon: '👥' },
  { id: 'system-requirements', name: 'システム要求リスト', icon: '⚙️' },
  { id: 'system-functional-requirements', name: 'システム機能要求リスト', icon: '🔧' },
  { id: 'all-requirements', name: '全要求一覧', icon: '📋' },
  { id: 'stakeholder-system-matrix', name: 'ステークホルダ-システム要求マトリックス', icon: '📊' },
  { id: 'system-functional-matrix', name: 'システム-機能要求マトリックス', icon: '📈' },
  { id: 'critical-requirements', name: '重要度Critical要求', icon: '🚨' },
  { id: 'in-progress-requirements', name: '実装中要求', icon: '🔄' },
  { id: 'operation-logs', name: '操作履歴（デバッグ）', icon: '🔍' },
];

// ツリービュー専用ページ
app.get('/tree', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>要求ツリービュー</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --primary: #3b82f6;
      --primary-dark: #2563eb;
      --secondary: #8b5cf6;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --bg: #0f172a;
      --surface: #1e293b;
      --surface-light: #334155;
      --text: #f1f5f9;
      --text-secondary: #cbd5e1;
      --border: #475569;
      --stakeholder-color: #3b82f6;
      --system-color: #8b5cf6;
      --functional-color: #10b981;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      height: 100vh;
      overflow: hidden;
    }

    .container {
      display: flex;
      height: 100vh;
    }

    /* 左側のツリーパネル */
    .tree-panel {
      width: 400px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .panel-header {
      padding: 20px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      border-bottom: 1px solid var(--border);
    }

    .panel-header h1 {
      font-size: 18px;
      font-weight: 700;
      color: white;
      margin-bottom: 8px;
    }

    .panel-header p {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
    }

    .tree-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    /* グループヘッダー */
    .tree-group-header {
      cursor: pointer;
      padding: 14px 16px;
      margin: 12px 0 8px 0;
      background: linear-gradient(90deg, var(--surface-light) 0%, var(--surface) 100%);
      border: 2px solid var(--border);
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 700;
      font-size: 15px;
      transition: all 0.2s ease;
      user-select: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .tree-group-header:hover {
      background: linear-gradient(90deg, var(--border) 0%, var(--surface-light) 100%);
      border-color: var(--primary);
      transform: translateX(2px);
    }

    .tree-group-header:active {
      transform: scale(0.98);
    }

    .tree-group-icon {
      font-size: 14px;
      color: var(--primary);
      font-weight: bold;
      width: 20px;
      text-align: center;
      transition: transform 0.2s ease;
    }

    .tree-group-title {
      flex: 1;
      letter-spacing: 0.3px;
    }

    .tree-group-count {
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 500;
      background: var(--surface);
      padding: 4px 10px;
      border-radius: 12px;
    }

    .tree-group-content {
      padding-left: 16px;
      margin-bottom: 8px;
      max-height: 5000px;
      transition: max-height 0.3s ease, opacity 0.3s ease;
      overflow: hidden;
      opacity: 1;
    }

    .tree-group-content.collapsed {
      max-height: 0;
      opacity: 0;
    }

    /* ツリーアイテム */
    .tree-item {
      cursor: pointer;
      padding: 8px 12px;
      margin: 3px 0;
      border-radius: 5px;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 10px;
      position: relative;
      background: rgba(30, 41, 59, 0.3);
      border: 1px solid transparent;
    }

    .tree-item:hover {
      background: var(--surface-light);
      border-color: var(--border);
      transform: translateX(4px);
    }

    .tree-item.selected {
      background: var(--primary);
      border-color: var(--primary);
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }

    .tree-item.stakeholder {
      border-left: 4px solid var(--stakeholder-color);
      padding-left: 12px;
    }

    .tree-item.system {
      border-left: 4px solid var(--system-color);
      padding-left: 12px;
    }

    .tree-item.functional {
      border-left: 4px solid var(--functional-color);
      padding-left: 12px;
    }

    .tree-item-icon {
      font-size: 14px;
      flex-shrink: 0;
      opacity: 0.8;
    }

    .tree-item-title {
      flex: 1;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 400;
    }

    .tree-item-id {
      font-size: 10px;
      color: var(--text-secondary);
      font-family: 'Courier New', monospace;
      background: rgba(0, 0, 0, 0.2);
      padding: 2px 6px;
      border-radius: 3px;
    }

    /* 右側の詳細パネル */
    .detail-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .detail-header {
      padding: 20px 32px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }

    .detail-header h2 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .detail-meta {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: var(--text-secondary);
    }

    .detail-body {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
    }

    .detail-section {
      background: var(--surface);
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .detail-section h3 {
      font-size: 18px;
      margin-bottom: 16px;
      color: var(--primary);
    }

    .detail-field {
      margin-bottom: 16px;
    }

    .detail-field-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .detail-field-value {
      font-size: 14px;
      color: var(--text);
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-right: 8px;
    }

    .badge-status {
      background: var(--primary);
      color: white;
    }

    .badge-priority-critical {
      background: var(--danger);
      color: white;
    }

    .badge-priority-high {
      background: var(--warning);
      color: white;
    }

    .badge-priority-medium {
      background: var(--success);
      color: white;
    }

    .badge-priority-low {
      background: var(--surface-light);
      color: var(--text);
    }

    .badge-type {
      background: var(--secondary);
      color: white;
    }

    .tag-list {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .tag {
      padding: 4px 10px;
      background: var(--surface-light);
      border-radius: 4px;
      font-size: 12px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-secondary);
      text-align: center;
      padding: 32px;
    }

    .empty-state-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state-text {
      font-size: 16px;
    }

    /* スクロールバー */
    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    ::-webkit-scrollbar-track {
      background: var(--surface);
    }

    ::-webkit-scrollbar-thumb {
      background: var(--surface-light);
      border-radius: 5px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--border);
    }

    .legend {
      padding: 16px;
      background: var(--surface-light);
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .legend-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .legend-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
    }

    .legend-color {
      width: 20px;
      height: 3px;
      border-radius: 2px;
    }

    .legend-color.stakeholder {
      background: var(--stakeholder-color);
    }

    .legend-color.system {
      background: var(--system-color);
    }

    .legend-color.functional {
      background: var(--functional-color);
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 左側: ツリーパネル -->
    <div class="tree-panel">
      <div class="panel-header">
        <h1>🌳 要求ツリー</h1>
        <p>階層構造で要求を表示</p>
        <p id="version-display" style="font-size: 11px; opacity: 0.7; margin-top: 8px;"></p>
      </div>
      <div class="tree-content">
        <div class="legend">
          <div class="legend-title">凡例</div>
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-color stakeholder"></div>
              <span>👥 ステークホルダ要求</span>
            </div>
            <div class="legend-item">
              <div class="legend-color system"></div>
              <span>⚙️ システム要求</span>
            </div>
            <div class="legend-item">
              <div class="legend-color functional"></div>
              <span>🔧 システム機能要求</span>
            </div>
          </div>
        </div>
        <div id="treeContainer"></div>
      </div>
    </div>

    <!-- 右側: 詳細パネル -->
    <div class="detail-panel">
      <div class="detail-header" id="detailHeader">
        <h2>要求を選択してください</h2>
      </div>
      <div class="detail-body" id="detailBody">
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">左側のツリーから要求を選択すると、<br>詳細情報が表示されます</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    let selectedRequirement = null;

    // バージョン表示を更新
    document.getElementById('version-display').textContent = 'v' + Date.now();

    // ツリーデータを取得
    async function loadTree() {
      try {
        const response = await fetch('/api/tree');
        const data = await response.json();
        renderTree(data.tree);
      } catch (error) {
        console.error('ツリーの読み込みに失敗:', error);
      }
    }

    // ツリーを描画（グループ別）
    function renderTree(tree) {
      const container = document.getElementById('treeContainer');
      container.innerHTML = '';

      console.log('受信したツリーデータ:', tree.length + '件');

      // 要求を種類別にグループ化（重複チェック付き）
      const groups = {
        stakeholder: { name: 'ステークホルダ要求', icon: '👥', color: 'stakeholder', items: [], ids: new Set() },
        system: { name: 'システム要求', icon: '⚙️', color: 'system', items: [], ids: new Set() },
        functional: { name: 'システム機能要求', icon: '🔧', color: 'functional', items: [], ids: new Set() }
      };

      tree.forEach(node => {
        const req = node.requirement;
        console.log('処理中の要求:', req.id, req.title);

        // typeフィールドがない場合、categoryやIDから推測
        let type = req.type;
        if (!type) {
          if (req.id && req.id.startsWith('STK-')) {
            type = 'stakeholder';
          } else if (req.id && req.id.startsWith('SYS-')) {
            type = 'system';
          } else if (req.id && req.id.startsWith('FUNC-')) {
            type = 'functional';
          } else if (req.category && req.category.includes('ステークホルダ')) {
            type = 'stakeholder';
          } else if (req.category && req.category.includes('システム要求')) {
            type = 'system';
          } else if (req.category && (req.category.includes('機能') || req.category.includes('システム機能'))) {
            type = 'functional';
          } else {
            type = 'stakeholder'; // デフォルト
          }
        }

        // 重複チェック: 同じIDがすでに追加されていない場合のみ追加
        if (groups[type]) {
          if (groups[type].ids.has(req.id)) {
            console.warn('重複検出:', req.id, 'はすでに', type, 'グループに存在します');
          } else {
            groups[type].items.push(req);
            groups[type].ids.add(req.id);
            console.log('追加:', req.id, 'を', type, 'グループに追加');
          }
        }
      });

      // グループごとの要求数をログ出力
      console.log('ステークホルダ要求:', groups.stakeholder.items.length);
      console.log('システム要求:', groups.system.items.length);
      console.log('システム機能要求:', groups.functional.items.length);

      // グループごとに描画
      Object.entries(groups).forEach(([typeKey, group]) => {
        if (group.items.length === 0) return;

        // グループヘッダー
        const groupHeader = document.createElement('div');
        groupHeader.className = 'tree-group-header';
        groupHeader.innerHTML = \`
          <span class="tree-group-icon">▶</span>
          <span class="tree-group-title">\${group.icon} \${group.name}</span>
          <span class="tree-group-count">(\${group.items.length})</span>
        \`;

        const groupContent = document.createElement('div');
        groupContent.className = 'tree-group-content';
        groupContent.style.display = 'block'; // 初期状態は展開

        // グループ内のアイテム
        group.items.forEach(req => {
          const item = document.createElement('div');
          item.className = \`tree-item \${typeKey}\`;
          item.dataset.id = req.id;

          item.innerHTML = \`
            <span class="tree-item-icon">\${group.icon}</span>
            <span class="tree-item-title">\${req.title}</span>
            <span class="tree-item-id">\${req.id}</span>
          \`;

          item.addEventListener('click', (e) => {
            e.stopPropagation();
            selectRequirement(req);
          });
          groupContent.appendChild(item);
        });

        // グループヘッダーのクリックで展開・折りたたみ
        groupHeader.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const isCollapsed = groupContent.classList.contains('collapsed');

          if (isCollapsed) {
            // 展開
            groupContent.classList.remove('collapsed');
            groupHeader.querySelector('.tree-group-icon').textContent = '▼';
          } else {
            // 折りたたみ
            groupContent.classList.add('collapsed');
            groupHeader.querySelector('.tree-group-icon').textContent = '▶';
          }
        });

        // 初期状態を展開（▼）にする
        groupHeader.querySelector('.tree-group-icon').textContent = '▼';

        container.appendChild(groupHeader);
        container.appendChild(groupContent);
      });
    }

    // 要求を選択
    function selectRequirement(req) {
      selectedRequirement = req;

      // 選択状態を更新
      document.querySelectorAll('.tree-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.id === req.id);
      });

      // 詳細を表示
      renderDetail(req);
    }

    // 詳細を描画
    function renderDetail(req) {
      const header = document.getElementById('detailHeader');
      const body = document.getElementById('detailBody');

      const type = req.type || 'stakeholder';
      const typeLabel = type === 'stakeholder' ? 'ステークホルダ要求' :
                        type === 'system' ? 'システム要求' : 'システム機能要求';

      header.innerHTML = \`
        <h2>\${req.title}</h2>
        <div class="detail-meta">
          <span>\${req.id}</span>
          <span>作成: \${new Date(req.createdAt).toLocaleDateString('ja-JP')}</span>
          <span>更新: \${new Date(req.updatedAt).toLocaleDateString('ja-JP')}</span>
        </div>
      \`;

      body.innerHTML = \`
        <div class="detail-section">
          <h3>基本情報</h3>
          <div class="detail-field">
            <div class="detail-field-label">種類</div>
            <div class="detail-field-value">
              <span class="badge badge-type">\${typeLabel}</span>
            </div>
          </div>
          <div class="detail-field">
            <div class="detail-field-label">ステータス</div>
            <div class="detail-field-value">
              <span class="badge badge-status">\${req.status}</span>
            </div>
          </div>
          <div class="detail-field">
            <div class="detail-field-label">優先度</div>
            <div class="detail-field-value">
              <span class="badge badge-priority-\${req.priority}">\${req.priority.toUpperCase()}</span>
            </div>
          </div>
          <div class="detail-field">
            <div class="detail-field-label">カテゴリ</div>
            <div class="detail-field-value">\${req.category}</div>
          </div>
          \${req.author ? \`
          <div class="detail-field">
            <div class="detail-field-label">作成者</div>
            <div class="detail-field-value">\${req.author}</div>
          </div>
          \` : ''}
          \${req.assignee ? \`
          <div class="detail-field">
            <div class="detail-field-label">担当者</div>
            <div class="detail-field-value">\${req.assignee}</div>
          </div>
          \` : ''}
        </div>

        <div class="detail-section">
          <h3>説明</h3>
          <div class="detail-field-value">\${req.description}</div>
        </div>

        \${req.tags && req.tags.length > 0 ? \`
        <div class="detail-section">
          <h3>タグ</h3>
          <div class="tag-list">
            \${req.tags.map(tag => \`<span class="tag">\${tag}</span>\`).join('')}
          </div>
        </div>
        \` : ''}

        \${req.dependencies && req.dependencies.length > 0 ? \`
        <div class="detail-section">
          <h3>依存関係</h3>
          <div class="detail-field-value">
            \${req.dependencies.map(dep => \`<div>→ \${dep}</div>\`).join('')}
          </div>
        </div>
        \` : ''}
      \`;
    }

    // 初期化
    loadTree();

    // 自動更新（5秒ごと）
    setInterval(loadTree, 5000);
  </script>
</body>
</html>
  `;

  res.send(html);
});

// ルートページ - モダンなUIを提供
app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>要求管理ビューアー</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --primary: #3b82f6;
      --primary-dark: #2563eb;
      --secondary: #8b5cf6;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --bg: #0f172a;
      --surface: #1e293b;
      --surface-light: #334155;
      --text: #f1f5f9;
      --text-secondary: #cbd5e1;
      --border: #475569;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }

    .container {
      display: flex;
      height: 100vh;
    }

    /* サイドバー */
    .sidebar {
      width: 320px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-header {
      padding: 24px;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    }

    .sidebar-header h1 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
      color: white;
    }

    .sidebar-header p {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
    }

    .view-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .view-button {
      width: 100%;
      padding: 14px 16px;
      margin-bottom: 8px;
      background: var(--surface-light);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      font-size: 14px;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .view-button:hover {
      background: var(--primary);
      border-color: var(--primary);
      transform: translateX(4px);
    }

    .view-button.active {
      background: var(--primary);
      border-color: var(--primary);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .view-button .icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .view-button .name {
      flex: 1;
      font-weight: 500;
    }

    /* メインコンテンツ */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .content-header {
      padding: 20px 32px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .content-header h2 {
      font-size: 24px;
      font-weight: 600;
    }

    .refresh-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--success);
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      color: white;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .refresh-indicator.show {
      opacity: 1;
    }

    .content-body {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
    }

    /* Markdown styling */
    .markdown-content {
      max-width: 1200px;
      margin: 0 auto;
      background: var(--surface);
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .markdown-content h1 {
      font-size: 32px;
      margin-bottom: 16px;
      color: var(--primary);
    }

    .markdown-content h2 {
      font-size: 24px;
      margin-top: 32px;
      margin-bottom: 16px;
      color: var(--text);
    }

    .markdown-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      font-size: 14px;
    }

    .markdown-content th {
      background: var(--surface-light);
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border: 1px solid var(--border);
    }

    .markdown-content td {
      padding: 12px;
      border: 1px solid var(--border);
    }

    .markdown-content tr:hover {
      background: var(--surface-light);
    }

    .markdown-content p {
      margin: 16px 0;
      color: var(--text-secondary);
    }

    .markdown-content hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 32px 0;
    }

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      font-size: 18px;
      color: var(--text-secondary);
    }

    .error {
      padding: 32px;
      text-align: center;
      color: var(--danger);
    }

    /* スクロールバー */
    ::-webkit-scrollbar {
      width: 12px;
    }

    ::-webkit-scrollbar-track {
      background: var(--surface);
    }

    ::-webkit-scrollbar-thumb {
      background: var(--surface-light);
      border-radius: 6px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--border);
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- サイドバー -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h1>📋 要求管理ビューアー</h1>
        <p>リアルタイム自動更新</p>
      </div>
      <div class="view-list" id="viewList"></div>
    </div>

    <!-- メインコンテンツ -->
    <div class="main-content">
      <div class="content-header">
        <h2 id="currentViewName">ビューを選択してください</h2>
        <div class="refresh-indicator" id="refreshIndicator">
          <span>✓</span>
          <span>更新しました</span>
        </div>
      </div>
      <div class="content-body">
        <div id="content" class="loading">
          ビューを選択してください
        </div>
      </div>
    </div>
  </div>

  <script>
    const views = ${JSON.stringify(VIEWS)};
    let currentView = null;
    let lastModified = {};
    let eventSource = null;

    // ビューボタンを生成
    const viewList = document.getElementById('viewList');
    views.forEach(view => {
      const button = document.createElement('button');
      button.className = 'view-button';
      button.innerHTML = \`
        <span class="icon">\${view.icon}</span>
        <span class="name">\${view.name}</span>
      \`;
      button.addEventListener('click', () => loadView(view));
      viewList.appendChild(button);
    });

    // ビューを読み込み
    async function loadView(view) {
      currentView = view;

      // アクティブ状態を更新
      document.querySelectorAll('.view-button').forEach((btn, idx) => {
        btn.classList.toggle('active', views[idx].id === view.id);
      });

      document.getElementById('currentViewName').textContent = view.name;
      document.getElementById('content').innerHTML = '<div class="loading">読み込み中...</div>';

      try {
        if (view.id === 'operation-logs') {
          const logResponse = await fetch('/api/operation-logs-data');
          const logData = await logResponse.json();
          
          let html = '<h1>🔍 操作履歴</h1><p>まだ操作履歴がありません</p>';
          
          if (logData.logs && logData.logs.length > 0) {
            html = '<h1>🔍 操作履歴（デバッグ）</h1><h2>統計: ' + logData.stats.totalOperations + ' 件</h2>';
            logData.logs.forEach(log => {
              html += '<div style="border:1px solid #475569; padding:16px; margin:16px 0"><h3>' + log.operation + '</h3><p>ツール: ' + log.toolName + '</p><details><summary>詳細</summary><pre>' + JSON.stringify(log.parameters, null, 2) + '</pre></details></div>';
            });
          }
          
          document.getElementById('content').innerHTML = '<div class="markdown-content">' + html + '</div>';
          return;
        }
        const response = await fetch(\`/api/view/\${view.id}\`);
        const data = await response.json();

        if (data.error) {
          document.getElementById('content').innerHTML = \`<div class="error">\${data.error}</div>\`;
          return;
        }

        document.getElementById('content').innerHTML = \`<div class="markdown-content">\${data.html}</div>\`;
        lastModified[view.id] = data.lastModified;
      } catch (error) {
        document.getElementById('content').innerHTML = \`<div class="error">エラー: \${error.message}</div>\`;
      }
    }

    // SSEで自動更新を監視
    function connectSSE() {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource('/api/watch');

      eventSource.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        if (currentView && data.changed) {
          // 現在のビューが更新されたかチェック
          const shouldReload = data.changed.some(file =>
            file.includes(currentView.id)
          );

          if (shouldReload) {
            console.log('ビューが更新されました。再読み込みします...');
            await loadView(currentView);

            // 更新インジケータを表示
            const indicator = document.getElementById('refreshIndicator');
            indicator.classList.add('show');
            setTimeout(() => {
              indicator.classList.remove('show');
            }, 2000);
          }
        }
      };

      eventSource.onerror = () => {
        console.error('SSE接続エラー。再接続します...');
        setTimeout(connectSSE, 3000);
      };
    }

    // 初期化
    connectSSE();

    // 最初のビューを自動的に読み込み
    if (views.length > 0) {
      loadView(views[0]);
    }
  </script>
</body>
</html>
  `;

  res.send(html);
});

// ビューのコンテンツを取得
app.get('/api/view/:viewId', async (req, res) => {
  const { viewId } = req.params;

  try {
    const mdPath = path.join(process.cwd(), 'views', 'markdown', `${viewId}.md`);
    const content = await fs.readFile(mdPath, 'utf-8');
    const html = marked(content);
    const stats = await fs.stat(mdPath);

    res.json({
      html,
      lastModified: stats.mtimeMs,
    });
  } catch (error: any) {
    res.json({
      error: `ビューの読み込みに失敗しました: ${error.message}`,
    });
  }
});

// SSE (Server-Sent Events) でファイル変更を監視
app.get('/api/watch', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const viewsDir = path.join(process.cwd(), 'views', 'markdown');

  // chokidarでファイル変更を監視
  const watcher = chokidar.watch(viewsDir, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100,
    },
  });

  watcher.on('change', (filePath) => {
    const changed = [path.basename(filePath, '.md')];
    res.write(`data: ${JSON.stringify({ changed })}\n\n`);
  });

  // クライアントが接続を切った時にwatcherをクリーンアップ
  req.on('close', () => {
    watcher.close();
    res.end();
  });
});

// ツリービューAPIエンドポイント
app.get('/api/tree', async (req, res) => {
  try {
    await storage.initialize();
    const requirements = await storage.getAllRequirements();

    // 全ての要求を完全にフラットに返す
    // 重複を排除するために、IDでユニークにする
    const uniqueRequirements = Array.from(
      new Map(requirements.map(req => [req.id, req])).values()
    );

    const flatTree = uniqueRequirements.map(req => ({
      requirement: req,
      children: [],
      level: 0,
      indent: 0
    }));

    res.json({
      tree: flatTree,
      count: flatTree.length,
    });
  } catch (error: any) {
    res.json({
      error: error.message,
      tree: [],
      count: 0,
    });
  }
});

// サーバー起動

// 操作ログAPIエンドポイント
app.get('/api/operation-logs-data', async (req, res) => {
  try {
    const logger = new OperationLogger('./data');
    await logger.initialize();
    
    const logs = logger.getAllLogs();
    const stats = logger.getStatistics();
    
    res.json({ logs, stats });
  } catch (error: any) {
    res.json({ error: error.message, logs: [], stats: {} });
  }
});
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🌐 要求管理ビューアーを起動しました`);
  console.log(`========================================`);
  console.log(`\n📍 アクセスURL: http://localhost:${PORT}`);
  console.log(`\n✨ 機能:`);
  console.log(`   - ${VIEWS.length}種類のビューをブラウザで表示`);
  console.log(`   - ファイル変更時の自動リフレッシュ`);
  console.log(`   - モダンなダークテーマUI\n`);
  console.log(`終了するには Ctrl+C を押してください\n`);
});
