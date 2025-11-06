/**
 * View Server - ブラウザでビューを表示するWebサーバー
 */
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import chokidar from 'chokidar';
import { marked } from 'marked';
import { RequirementsStorage } from './storage.js';
import { RequirementValidator } from './validator.js';
const app = express();
const PORT = 5002;
const storage = new RequirementsStorage('./data');
const validator = new RequirementValidator(storage);
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
// メインページ（ツリービュー）
app.get('/', (req, res) => {
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
      /* ChatGPT/Codex style - minimal colors */
      --primary: #10a37f;
      --bg: #ffffff;
      --sidebar-bg: #f7f7f8;
      --surface: #ffffff;
      --text: #202123;
      --text-secondary: #6e6e80;
      --border: #e5e5e5;
      --shadow: rgba(0, 0, 0, 0.05);
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      margin: 0;
      padding: 0;
    }

    .container {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* メインコンテンツエリア */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* 上段: ツリーと詳細 */
    .top-row {
      display: flex;
      gap: 0;
      flex: 1;
      overflow: hidden;
    }

    /* 左側のツリーパネル */
    .tree-panel {
      width: 320px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Search Panel - 詳細ビューの下に配置 */
    .search-panel {
      flex: 0 0 auto;
      height: 400px;
      min-height: 200px;
      max-height: 800px;
      background: var(--surface);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-radius: 12px;
      margin-top: 24px;
      position: relative;
    }

    .search-resizer {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 8px;
      cursor: ns-resize;
      background: var(--border);
      z-index: 10;
      border-top: 2px solid var(--border);
      border-bottom: 2px solid var(--border);
    }

    .search-resizer:hover {
      background: var(--primary);
      border-color: var(--primary);
      opacity: 0.8;
    }

    .search-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .search-filters {
      padding: 10px;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
    }

    .search-filters input,
    .search-filters select {
      padding: 4px 6px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      color: var(--text);
      background: var(--bg);
    }

    .search-filters input {
      flex: 1;
      min-width: 200px;
    }

    .search-filters select {
      min-width: 140px;
    }

    .search-filters button {
      padding: 8px 20px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: opacity 0.2s;
    }

    .search-filters button:hover {
      opacity: 0.9;
    }

    .search-results {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
    }

    .search-result-item {
      padding: 8px;
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-bottom: 6px;
      cursor: pointer;
      transition: all 0.2s;
      background: var(--bg);
    }

    .search-result-item:hover {
      border-color: var(--primary);
      box-shadow: 0 2px 8px var(--shadow);
    }

    .search-result-header {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 4px;
    }

    .search-result-id {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .search-result-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      flex: 1;
    }

    .search-result-category {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
    }

    .search-result-description {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .panel-header {
      padding: 10px 12px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }

    .panel-header h1 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 4px;
    }

    .panel-header p {
      font-size: 13px;
      color: var(--text-secondary);
    }

    .tree-content {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    /* グループヘッダー */
    .tree-group-header {
      cursor: pointer;
      padding: 7px 8px;
      margin: 6px 0 4px 0;
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
      padding: 4px 6px;
      margin: 2px 0;
      border-radius: 5px;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 5px;
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
      padding: 12px 16px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }

    .detail-header h2 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .detail-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .detail-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .detail-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      align-items: start;
    }

    .detail-column-left,
    .detail-column-right {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .detail-section {
      background: var(--surface);
      padding: 10px;
      border-radius: 8px;
      margin-top: 0;
    }

    .detail-section h3 {
      font-size: 15px;
      margin-bottom: 6px;
      margin-top: 0;
      color: var(--text);
    }

    .relations-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .detail-field {
      margin-bottom: 6px;
    }

    .detail-field-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .detail-field-value {
      font-size: 13px;
      color: var(--text);
      line-height: 1.4;
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

    .relation-link {
      display: flex;
      align-items: center;
      padding: 10px 14px;
      margin: 6px 0;
      background: var(--surface-light);
      border: 1px solid var(--border);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      gap: 10px;
    }

    .relation-link:hover {
      background: var(--primary);
      border-color: var(--primary);
      transform: translateX(4px);
    }

    .relation-link-icon {
      font-size: 14px;
      flex-shrink: 0;
    }

    .relation-link-content {
      flex: 1;
      min-width: 0;
    }

    .relation-link-id {
      font-size: 11px;
      font-family: 'Courier New', monospace;
      color: var(--text-secondary);
      margin-bottom: 2px;
    }

    .relation-link-title {
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .relation-link-meta {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }

    .relation-link-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      background: rgba(0, 0, 0, 0.2);
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

    /* タブナビゲーション - ChatGPT風 */
    .tab-navigation {
      display: none; /* サイドバーナビゲーションに置き換え */
    }

    .tab-button {
      display: none;
    }

    .tab-content {
      display: none;
      flex: 1;
      overflow: hidden;
    }

    .tab-content.active {
      display: flex;
    }

    /* チャットパネル */
    .chat-panel {
      min-width: 300px;
      max-width: 800px;
      width: 400px;
      background: var(--surface);
      border-left: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }

    .chat-resizer {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      cursor: ew-resize;
      background: transparent;
      z-index: 10;
    }

    .chat-resizer:hover,
    .chat-resizer.resizing {
      background: var(--primary);
    }

    .chat-header {
      padding: 20px 24px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }

    .chat-header h2 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text);
      margin: 0;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .chat-message {
      display: flex;
      gap: 12px;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 4px;
      background: var(--primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .message-avatar.user {
      background: var(--text-secondary);
    }

    .message-content {
      flex: 1;
      min-width: 0;
    }

    .message-text {
      color: var(--text);
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .message-time {
      font-size: 12px;
      color: var(--text-tertiary);
      margin-top: 4px;
    }

    .chat-input-container {
      padding: 16px 24px;
      background: var(--surface);
      border-top: 1px solid var(--border);
    }

    .chat-input-wrapper {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }

    .chat-input {
      flex: 1;
      min-height: 44px;
      max-height: 120px;
      padding: 12px 16px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg);
      color: var(--text);
      font-size: 14px;
      font-family: inherit;
      resize: none;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .chat-input:focus {
      border-color: var(--primary);
    }

    .chat-send-btn {
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 8px;
      background: var(--primary);
      color: white;
      font-size: 18px;
      cursor: pointer;
      transition: background 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chat-send-btn:hover {
      background: var(--primary-hover);
    }

    .chat-send-btn:disabled {
      background: var(--border);
      cursor: not-allowed;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
    }

    .typing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--text-tertiary);
      animation: typing 1.4s infinite;
    }

    .typing-dot:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-dot:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-10px); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="main-content">
      <!-- 上段: ツリーと詳細 -->
      <div class="top-row">
        <!-- 左側: ツリーパネル -->
        <div class="tree-panel" id="treePanel">
        <div class="panel-header">
          <h1>🌳 Items</h1>
        </div>
      <div class="tree-content">
        <div id="treeContainer"></div>
      </div>
    </div>

        <!-- 右側: 詳細パネル -->
        <div class="detail-panel">
          <div class="detail-header" id="detailHeader">
            <h2>要求を選択してください</h2>
          </div>
          <div class="detail-body" id="detailBody" style="display: flex; align-items: center; justify-content: center;">
            <div class="empty-state">
              <div class="empty-state-icon">📋</div>
              <div class="empty-state-text">左側のツリーから要求を選択すると、<br>詳細情報が表示されます</div>
            </div>
          </div>

          <!-- Search Panel - 詳細ビューの下に配置 -->
          <div class="search-panel" id="searchPanel">
        <div class="search-resizer" id="searchResizer"></div>
        <div class="search-content">
          <div class="search-filters">
            <input type="text" id="searchKeyword" placeholder="キーワード検索..." />
            <select id="filterStatus">
              <option value="">全てのステータス</option>
              <option value="approved">承認済み</option>
              <option value="draft">ドラフト</option>
              <option value="review">レビュー中</option>
            </select>
            <select id="filterPriority">
              <option value="">全ての優先度</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select id="filterCategory">
              <option value="">全てのカテゴリ</option>
              <option value="stakeholder">ステークホルダ要求</option>
              <option value="system">システム要求</option>
              <option value="functional">システム機能要求</option>
            </select>
            <select id="filterAuthor">
              <option value="">全ての作成者</option>
            </select>
            <input type="text" id="filterTags" placeholder="タグ (カンマ区切り)" style="min-width: 150px;" />
            <select id="viewMode">
              <option value="list">リスト</option>
              <option value="matrix-stakeholder-system">マトリックス: ステークホルダ→システム</option>
              <option value="matrix-system-functional">マトリックス: システム→機能</option>
            </select>
            <button id="searchBtn">検索</button>
          </div>
          <div id="searchResults" class="search-results">
            <div class="empty-state">
              <div class="empty-state-icon">🔍</div>
              <div class="empty-state-text">検索条件を設定して「検索」ボタンを押してください</div>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>

    <!-- チャットパネル -->
    <div class="chat-panel" id="chatPanel">
      <div class="chat-resizer" id="chatResizer"></div>
      <div class="chat-header">
        <h2>💬 Chat</h2>
      </div>
      <div class="chat-messages" id="chatMessages">
        <div class="chat-message">
          <div class="message-avatar">C</div>
          <div class="message-content">
            <div class="message-text">こんにちは！要求管理のお手伝いをします。

以下のような質問にお答えできます:
• 新しい要求の追加
• 要求の妥当性チェック
• 依存関係の分析
• 要求の検索・フィルタ

何かお手伝いできることはありますか？</div>
            <div class="message-time">今</div>
          </div>
        </div>
      </div>
      <div class="chat-input-container">
        <div class="chat-input-wrapper">
          <textarea
            id="chatInput"
            class="chat-input"
            placeholder="メッセージを入力..."
            rows="1"
          ></textarea>
          <button id="chatSend" class="chat-send-btn">↑</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    let selectedRequirement = null;
    let allRequirements = []; // Store all requirements for search

    // View switching functionality
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');

        // Update active state
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Note: Searchパネルは常に表示されるようになったため、
        // ビュー切り替えロジックは削除しました
      });
    });

    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', async () => {
      const keyword = document.getElementById('searchKeyword').value;
      const status = document.getElementById('filterStatus').value;
      const priority = document.getElementById('filterPriority').value;
      const category = document.getElementById('filterCategory').value;
      const author = document.getElementById('filterAuthor').value;
      const tagsInput = document.getElementById('filterTags').value;
      const viewMode = document.getElementById('viewMode').value;

      // Filter requirements
      let results = allRequirements.filter(req => {
        let match = true;

        if (keyword) {
          const searchText = keyword.toLowerCase();
          match = match && (
            req.title.toLowerCase().includes(searchText) ||
            req.description.toLowerCase().includes(searchText) ||
            req.id.toLowerCase().includes(searchText)
          );
        }

        if (status) {
          match = match && req.status === status;
        }

        if (priority) {
          match = match && req.priority === priority;
        }

        if (category) {
          // カテゴリマッピング（英語→日本語）
          const categoryMap = {
            'stakeholder': 'ステークホルダ',
            'system': 'システム要求',
            'functional': '機能'
          };
          const searchTerm = categoryMap[category] || category;
          const reqCategory = req.category ? req.category : '';
          match = match && reqCategory.includes(searchTerm);
        }

        if (author) {
          match = match && req.author === author;
        }

        if (tagsInput) {
          const searchTags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
          if (searchTags.length > 0 && req.tags && req.tags.length > 0) {
            const reqTags = req.tags.map(t => t.toLowerCase());
            match = match && searchTags.some(st => reqTags.some(rt => rt.includes(st)));
          } else if (searchTags.length > 0) {
            match = false;
          }
        }

        return match;
      });

      // ビューモードに応じて表示
      if (viewMode === 'list') {
        renderSearchResults(results);
      } else if (viewMode.startsWith('matrix-')) {
        renderMatrixView(results, viewMode);
      }
    });

    // Render search results
    function renderSearchResults(results) {
      const container = document.getElementById('searchResults');

      if (results.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">検索結果が見つかりませんでした</div></div>';
        return;
      }

      const categoryColors = {
        stakeholder: 'background: #e3f2fd; color: #1565c0;',
        system: 'background: #f3e5f5; color: #6a1b9a;',
        functional: 'background: #e8f5e9; color: #2e7d32;'
      };

      const html = results.map(req => {
        const desc = req.description.substring(0, 100) + (req.description.length > 100 ? '...' : '');
        const categoryStyle = categoryColors[req.category] || '';
        return '<div class="search-result-item" data-id="' + req.id + '"><div class="search-result-header"><span class="search-result-id">' + req.id + '</span><span class="search-result-title">' + req.title + '</span><span class="search-result-category" style="' + categoryStyle + '">' + req.category + '</span></div><div class="search-result-description">' + desc + '</div></div>';
      }).join('');

      container.innerHTML = html;

      // Add click handlers to search results
      container.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', async () => {
          const reqId = item.getAttribute('data-id');
          const req = allRequirements.find(r => r.id === reqId);
          if (req) {
            // Load and select the requirement
            await loadAndSelectRequirement(reqId);
          }
        });
      });
    }

    // マトリックスビューを表示
    function renderMatrixView(results, viewMode) {
      const container = document.getElementById('searchResults');

      let rowType, colType, rowName, colName, rowIdPrefix, colIdPrefix;
      if (viewMode === 'matrix-stakeholder-system') {
        rowType = 'stakeholder';
        colType = 'system';
        rowName = 'ステークホルダ要求';
        colName = 'システム要求';
        rowIdPrefix = 'STK-';
        colIdPrefix = 'SYS-';
      } else if (viewMode === 'matrix-system-functional') {
        rowType = 'system';
        colType = 'functional';
        rowName = 'システム要求';
        colName = 'システム機能要求';
        rowIdPrefix = 'SYS-';
        colIdPrefix = 'FUNC-';
      }

      // マトリックスビューでは全要求から抽出（resultsではなくallRequirements）
      const rows = allRequirements.filter(req => {
        const category = req.category ? req.category.toLowerCase() : '';
        const id = req.id ? req.id.toUpperCase() : '';
        return category.includes(rowType) ||
               category.includes(rowName) ||
               id.startsWith(rowIdPrefix);
      });

      const cols = allRequirements.filter(req => {
        const category = req.category ? req.category.toLowerCase() : '';
        const id = req.id ? req.id.toUpperCase() : '';
        return category.includes(colType) ||
               category.includes(colName) ||
               id.startsWith(colIdPrefix);
      });

      if (rows.length === 0 || cols.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">マトリックス表示に必要な要求が見つかりませんでした</div></div>';
        return;
      }

      // マトリックステーブルを作成
      let html = '<div style="overflow: auto; max-height: 100%;"><table style="border-collapse: collapse; font-size: 12px; width: 100%;">';
      html += '<thead><tr><th style="border: 1px solid var(--border); padding: 8px; background: var(--surface); position: sticky; top: 0; left: 0; z-index: 3;">' + rowName + ' \\ ' + colName + '</th>';

      cols.forEach(col => {
        html += '<th style="border: 1px solid var(--border); padding: 8px; background: var(--surface); min-width: 100px; position: sticky; top: 0; z-index: 2;">' + col.id + '<br><span style="font-weight: normal; font-size: 11px;">' + col.title.substring(0, 20) + '</span></th>';
      });
      html += '</tr></thead><tbody>';

      rows.forEach(row => {
        html += '<tr><td style="border: 1px solid var(--border); padding: 8px; background: var(--surface); font-weight: bold; position: sticky; left: 0; z-index: 1;">' + row.id + '<br><span style="font-weight: normal; font-size: 11px;">' + row.title.substring(0, 30) + '</span></td>';

        cols.forEach(col => {
          // 依存関係・refines関係をチェック
          const hasRelation = (row.dependencies && row.dependencies.includes(col.id)) ||
                             (col.dependencies && col.dependencies.includes(row.id)) ||
                             (row.refines && row.refines.includes(col.id)) ||
                             (col.refines && col.refines.includes(row.id)) ||
                             row.parentId === col.id || col.parentId === row.id;

          const cellStyle = hasRelation ? 'background: var(--primary); opacity: 0.3; cursor: pointer;' : '';
          const cellContent = hasRelation ? '●' : '';
          const dataAttr = hasRelation ? \`data-row-id="$\{row.id}" data-col-id="$\{col.id}" class="matrix-cell"\` : '';
          html += '<td style="border: 1px solid var(--border); padding: 8px; text-align: center; ' + cellStyle + '" ' + dataAttr + '>' + cellContent + '</td>';
        });
        html += '</tr>';
      });

      html += '</tbody></table></div>';
      container.innerHTML = html;

      // マトリックスセルにクリックイベントを追加
      document.querySelectorAll('.matrix-cell').forEach(cell => {
        cell.addEventListener('click', async () => {
          const colId = cell.dataset.colId;
          if (colId) {
            await loadAndSelectRequirement(colId);
          }
        });
      });
    }

    // ビュー設定を読み込んでビュー選択リストを生成
    async function loadViewConfig() {
      try {
        const response = await fetch('/api/view-config');
        const config = await response.json();

        const viewModeSelect = document.getElementById('viewMode');
        viewModeSelect.innerHTML = '';

        config.views.forEach(view => {
          const option = document.createElement('option');
          option.value = view.id;
          option.textContent = view.name;
          if (view.description) {
            option.title = view.description;
          }
          viewModeSelect.appendChild(option);
        });
      } catch (error) {
        console.error('ビュー設定の読み込みに失敗:', error);
      }
    }

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

      // Store all requirements for search
      allRequirements = tree.map(node => node.requirement);

      // 作成者リストを生成
      const authors = new Set();
      allRequirements.forEach(req => {
        if (req.author) {
          authors.add(req.author);
        }
      });
      const authorSelect = document.getElementById('filterAuthor');
      authorSelect.innerHTML = '<option value="">全ての作成者</option>';
      Array.from(authors).sort().forEach(author => {
        const option = document.createElement('option');
        option.value = author;
        option.textContent = author;
        authorSelect.appendChild(option);
      });

      // 要求を種類別にグループ化（重複チェック付き）
      const groups = {
        stakeholder: { name: 'ステークホルダ要求', icon: '', color: 'stakeholder', items: [], ids: new Set() },
        system: { name: 'システム要求', icon: '', color: 'system', items: [], ids: new Set() },
        functional: { name: 'システム機能要求', icon: '', color: 'functional', items: [], ids: new Set() }
      };

      tree.forEach(node => {
        const req = node.requirement;
        console.log('処理中の要求:', req.id, req.title);

        // typeフィールドの正規化: system_functional -> functional
        let type = req.type;
        if (type === 'system_functional') {
          type = 'functional';
        }

        // typeフィールドがない場合、categoryやIDから推測
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
    async function renderDetail(req) {
      const header = document.getElementById('detailHeader');
      const body = document.getElementById('detailBody');

      // グリッドレイアウトにリセット
      body.style.display = 'grid';

      const type = req.type || 'stakeholder';
      const typeLabel = type === 'stakeholder' ? 'ステークホルダ要求' :
                        type === 'system' ? 'システム要求' :
                        (type === 'system_functional' || type === 'functional') ? 'システム機能要求' : 'システム機能要求';

      header.innerHTML = \`
        <h2>\${req.id}　\${req.title}</h2>
      \`;

      // 上位・下位要求を取得
      let relations = { parents: [], children: [] };
      try {
        const relResponse = await fetch(\`/api/requirement/\${req.id}/relations\`);
        relations = await relResponse.json();
      } catch (error) {
        console.error('関連要求の取得に失敗:', error);
      }

      // 上位要求のHTML生成
      const parentsHtml = relations.parents.length > 0 ? \`
        <div class="detail-section">
          <h3>▲ 上位要求</h3>
          $\{relations.parents.map(parent => \`
            <div class="relation-link" data-req-id="$\{parent.id}">
              <span class="relation-link-icon">$\{getTypeIcon(parent.type || parent.category)}</span>
              <div class="relation-link-content">
                <div class="relation-link-id">$\{parent.id}</div>
                <div class="relation-link-title">$\{parent.title}</div>
                <div class="relation-link-meta">
                  <span class="relation-link-badge">$\{parent.status}</span>
                  <span class="relation-link-badge">$\{parent.priority}</span>
                </div>
              </div>
            </div>
          \`).join('')}
        </div>
      \` : '';

      // 下位要求のHTML生成
      const childrenHtml = relations.children.length > 0 ? \`
        <div class="detail-section">
          <h3>▼ 下位要求</h3>
          $\{relations.children.map(child => \`
            <div class="relation-link" data-req-id="$\{child.id}">
              <span class="relation-link-icon">$\{getTypeIcon(child.type || child.category)}</span>
              <div class="relation-link-content">
                <div class="relation-link-id">$\{child.id}</div>
                <div class="relation-link-title">$\{child.title}</div>
                <div class="relation-link-meta">
                  <span class="relation-link-badge">$\{child.status}</span>
                  <span class="relation-link-badge">$\{child.priority}</span>
                </div>
              </div>
            </div>
          \`).join('')}
        </div>
      \` : '';

      body.innerHTML = \`
        <div class="detail-columns">
          <div class="detail-column-left">
            <div class="detail-section">
              <h3>説明</h3>
              <div class="detail-field-value">$\{req.description}</div>
            </div>

            $\{req.rationale ? \`
            <div class="detail-section">
              <h3>理由</h3>
              <div class="detail-field-value">$\{req.rationale}</div>
            </div>
            \` : ''}

            <div class="detail-section">
              <h3>基本情報</h3>
              <div class="detail-field">
                <div class="detail-field-label">作成日</div>
                <div class="detail-field-value">$\{new Date(req.createdAt).toLocaleDateString('ja-JP')}</div>
              </div>
              <div class="detail-field">
                <div class="detail-field-label">更新日</div>
                <div class="detail-field-value">$\{new Date(req.updatedAt).toLocaleDateString('ja-JP')}</div>
              </div>
              <div class="detail-field">
                <div class="detail-field-label">カテゴリ</div>
                <div class="detail-field-value">$\{req.category}</div>
              </div>
              <div class="detail-field">
                <div class="detail-field-label">優先度</div>
                <div class="detail-field-value">
                  <span class="badge badge-priority-$\{req.priority}">$\{req.priority.toUpperCase()}</span>
                </div>
              </div>
              <div class="detail-field">
                <div class="detail-field-label">ステータス</div>
                <div class="detail-field-value">
                  <span class="badge badge-status">$\{req.status}</span>
                </div>
              </div>
              $\{req.author ? \`
              <div class="detail-field">
                <div class="detail-field-label">作成者</div>
                <div class="detail-field-value">$\{req.author}</div>
              </div>
              \` : ''}
              $\{req.assignee ? \`
              <div class="detail-field">
                <div class="detail-field-label">担当者</div>
                <div class="detail-field-value">$\{req.assignee}</div>
              </div>
              \` : ''}
            </div>

            $\{req.tags && req.tags.length > 0 ? \`
            <div class="detail-section">
              <h3>タグ</h3>
              <div class="tag-list">
                $\{req.tags.map(tag => \`<span class="tag">$\{tag}</span>\`).join('')}
              </div>
            </div>
            \` : ''}
          </div>

          <div class="detail-column-right">
            $\{(parentsHtml || childrenHtml) ? \`
            <div class="relations-grid">
              $\{parentsHtml || '<div></div>'}
              $\{childrenHtml || '<div></div>'}
            </div>
            \` : ''}
          </div>
        </div>
      \`;

      // 関連要求リンクにクリックイベントを追加
      document.querySelectorAll('.relation-link').forEach(link => {
        link.addEventListener('click', async () => {
          const reqId = link.dataset.reqId;
          await loadAndSelectRequirement(reqId);
        });
      });
    }

    // 要求タイプからアイコンを取得
    function getTypeIcon(type) {
      if (type === 'stakeholder' || (type && type.includes('ステークホルダ'))) {
        return '●';
      } else if (type === 'system' || (type && type.includes('システム要求'))) {
        return '■';
      } else if (type === 'functional' || type === 'system_functional' || (type && type.includes('機能'))) {
        return '▲';
      }
      return '○';
    }

    // 要求IDから要求を読み込んで選択
    async function loadAndSelectRequirement(reqId) {
      try {
        const response = await fetch('/api/tree');
        const data = await response.json();

        const targetNode = data.tree.find(node => node.requirement.id === reqId);
        if (targetNode) {
          selectRequirement(targetNode.requirement);
        }
      } catch (error) {
        console.error('要求の読み込みに失敗:', error);
      }
    }

    // 初期化
    loadViewConfig();
    loadTree();

    // 自動更新（5秒ごと）
    setInterval(loadTree, 5000);

    // チャットパネルリサイズ機能
    const chatPanel = document.getElementById('chatPanel');
    const chatResizer = document.getElementById('chatResizer');
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    chatResizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startWidth = chatPanel.offsetWidth;
      chatResizer.classList.add('resizing');
      document.body.style.cursor = 'ew-resize';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const diff = startX - e.clientX;
      const newWidth = startWidth + diff;

      // 最小・最大幅を制限
      if (newWidth >= 300 && newWidth <= 800) {
        chatPanel.style.width = newWidth + 'px';
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        chatResizer.classList.remove('resizing');
        document.body.style.cursor = '';
      }
    });

    // Searchパネルリサイズ機能
    const searchPanel = document.getElementById('searchPanel');
    const searchResizer = document.getElementById('searchResizer');
    let isResizingSearch = false;
    let startY = 0;
    let startHeight = 0;

    searchResizer.addEventListener('mousedown', (e) => {
      isResizingSearch = true;
      startY = e.clientY;
      startHeight = searchPanel.offsetHeight;
      document.body.style.cursor = 'ns-resize';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizingSearch) return;

      // マウスを上に動かすと高さが減る（境界線が上がる）
      const diff = startY - e.clientY;
      const newHeight = startHeight + diff;

      // 最小・最大高さを制限
      if (newHeight >= 200 && newHeight <= 800) {
        searchPanel.style.height = newHeight + 'px';
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizingSearch) {
        isResizingSearch = false;
        document.body.style.cursor = '';
      }
    });

    // チャット機能
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');

    function addMessage(text, isUser = false) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-message';

      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'message-avatar' + (isUser ? ' user' : '');
      avatarDiv.textContent = isUser ? 'Y' : 'C';

      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';

      const textDiv = document.createElement('div');
      textDiv.className = 'message-text';
      textDiv.textContent = text;

      const timeDiv = document.createElement('div');
      timeDiv.className = 'message-time';
      timeDiv.textContent = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

      contentDiv.appendChild(textDiv);
      contentDiv.appendChild(timeDiv);
      messageDiv.appendChild(avatarDiv);
      messageDiv.appendChild(contentDiv);

      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTyping() {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'chat-message';
      typingDiv.id = 'typing-indicator';
      typingDiv.innerHTML = \`
        <div class="message-avatar">C</div>
        <div class="message-content">
          <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      \`;
      chatMessages.appendChild(typingDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTyping() {
      const typing = document.getElementById('typing-indicator');
      if (typing) typing.remove();
    }

    async function sendMessage() {
      const message = chatInput.value.trim();
      if (!message) return;

      // ユーザーメッセージを追加
      addMessage(message, true);
      chatInput.value = '';
      chatInput.style.height = '44px';
      chatSend.disabled = true;

      // タイピングインジケーターを表示
      showTyping();

      try {
        // APIエンドポイントに送信
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        });

        const data = await response.json();
        hideTyping();
        addMessage(data.response, false);
      } catch (error) {
        hideTyping();
        addMessage('申し訳ございません。エラーが発生しました。', false);
        console.error('Chat error:', error);
      } finally {
        chatSend.disabled = false;
      }
    }

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // テキストエリアの自動サイズ調整
    chatInput.addEventListener('input', () => {
      chatInput.style.height = '44px';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });
  </script>
    </div>
    </div>
  </div>

  <!-- ビュー一覧のコンテンツ -->
  <div class="tab-content" id="views-content">
    <div style="flex: 1; overflow-y: auto; padding: 40px;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <h1 style="font-size: 32px; margin-bottom: 8px;">📊 要求管理ビューアー</h1>
        <p style="color: var(--text-secondary); margin-bottom: 40px;">
          9種類のビューで要求を可視化・管理
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
          <a href="/list" style="text-decoration: none; color: inherit;">
            <div style="background: var(--surface); padding: 24px; border-radius: 12px; border: 1px solid var(--border); transition: all 0.2s ease; cursor: pointer;">
              <div style="font-size: 32px; margin-bottom: 12px;">📋</div>
              <h3 style="font-size: 18px; margin-bottom: 8px;">一覧ビュー</h3>
              <p style="color: var(--text-secondary); font-size: 14px;">全要求をテーブル形式で表示</p>
            </div>
          </a>

          <a href="/status" style="text-decoration: none; color: inherit;">
            <div style="background: var(--surface); padding: 24px; border-radius: 12px; border: 1px solid var(--border); transition: all 0.2s ease; cursor: pointer;">
              <div style="font-size: 32px; margin-bottom: 12px;">📊</div>
              <h3 style="font-size: 18px; margin-bottom: 8px;">ステータスビュー</h3>
              <p style="color: var(--text-secondary); font-size: 14px;">ステータス別に要求を分類</p>
            </div>
          </a>

          <a href="/priority" style="text-decoration: none; color: inherit;">
            <div style="background: var(--surface); padding: 24px; border-radius: 12px; border: 1px solid var(--border); transition: all 0.2s ease; cursor: pointer;">
              <div style="font-size: 32px; margin-bottom: 12px;">🎯</div>
              <h3 style="font-size: 18px; margin-bottom: 8px;">優先度ビュー</h3>
              <p style="color: var(--text-secondary); font-size: 14px;">優先度別に要求を分類</p>
            </div>
          </a>

          <a href="/category" style="text-decoration: none; color: inherit;">
            <div style="background: var(--surface); padding: 24px; border-radius: 12px; border: 1px solid var(--border); transition: all 0.2s ease; cursor: pointer;">
              <div style="font-size: 32px; margin-bottom: 12px;">📑</div>
              <h3 style="font-size: 18px; margin-bottom: 8px;">カテゴリビュー</h3>
              <p style="color: var(--text-secondary); font-size: 14px;">カテゴリ別に要求を分類</p>
            </div>
          </a>

          <a href="/timeline" style="text-decoration: none; color: inherit;">
            <div style="background: var(--surface); padding: 24px; border-radius: 12px; border: 1px solid var(--border); transition: all 0.2s ease; cursor: pointer;">
              <div style="font-size: 32px; margin-bottom: 12px;">📅</div>
              <h3 style="font-size: 18px; margin-bottom: 8px;">タイムラインビュー</h3>
              <p style="color: var(--text-secondary); font-size: 14px;">時系列で要求を表示</p>
            </div>
          </a>

          <a href="/dependency" style="text-decoration: none; color: inherit;">
            <div style="background: var(--surface); padding: 24px; border-radius: 12px; border: 1px solid var(--border); transition: all 0.2s ease; cursor: pointer;">
              <div style="font-size: 32px; margin-bottom: 12px;">🔗</div>
              <h3 style="font-size: 18px; margin-bottom: 8px;">依存関係ビュー</h3>
              <p style="color: var(--text-secondary); font-size: 14px;">要求間の依存関係を可視化</p>
            </div>
          </a>

          <a href="/tags" style="text-decoration: none; color: inherit;">
            <div style="background: var(--surface); padding: 24px; border-radius: 12px; border: 1px solid var(--border); transition: all 0.2s ease; cursor: pointer;">
              <div style="font-size: 32px; margin-bottom: 12px;">🏷️</div>
              <h3 style="font-size: 18px; margin-bottom: 8px;">タグビュー</h3>
              <p style="color: var(--text-secondary); font-size: 14px;">タグ別に要求を分類</p>
            </div>
          </a>

          <a href="/search" style="text-decoration: none; color: inherit;">
            <div style="background: var(--surface); padding: 24px; border-radius: 12px; border: 1px solid var(--border); transition: all 0.2s ease; cursor: pointer;">
              <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
              <h3 style="font-size: 18px; margin-bottom: 8px;">検索ビュー</h3>
              <p style="color: var(--text-secondary); font-size: 14px;">要求を検索・フィルタ</p>
            </div>
          </a>

          <a href="/stats" style="text-decoration: none; color: inherit;">
            <div style="background: var(--surface); padding: 24px; border-radius: 12px; border: 1px solid var(--border); transition: all 0.2s ease; cursor: pointer;">
              <div style="font-size: 32px; margin-bottom: 12px;">📈</div>
              <h3 style="font-size: 18px; margin-bottom: 8px;">統計ビュー</h3>
              <p style="color: var(--text-secondary); font-size: 14px;">要求の統計情報を表示</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>

  <script>
    // タブ切り替え機能
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.dataset.tab;

        // すべてのタブボタンとコンテンツから active クラスを削除
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        // クリックされたタブボタンとコンテンツに active クラスを追加
        button.classList.add('active');
        document.getElementById(tabName + '-content').classList.add('active');
      });
    });
  </script>
</body>
</html>
  `;
    res.send(html);
});
// 旧UIページ（削除予定）
app.get('/old', (req, res) => {
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
    }
    catch (error) {
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
// チャットAPIエンドポイント - MCPツール統合版
