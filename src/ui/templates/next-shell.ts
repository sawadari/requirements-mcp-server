import { lightTokens, darkTokens, tokensToCSSVars } from '../theme/tokens.js';

interface RenderOptions {
  title?: string;
}

const COMMAND_ITEMS = [
  { icon: '🧭', label: '概要', hint: 'G', id: 'overview' },
  { icon: '🌳', label: 'ツリー', hint: 'T', id: 'tree' },
  { icon: '📋', label: 'リスト', hint: 'L', id: 'list' },
  { icon: '🧊', label: 'マトリックス', hint: 'M', id: 'matrix' },
  { icon: '⏱️', label: 'タイムライン', hint: 'R', id: 'timeline' }
];

export function renderNextShell(options: RenderOptions = {}): string {
  const title = options.title ?? 'Requirements Command Board';
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    /* ============================================
       Design Tokens
       ============================================ */
    :root {
${tokensToCSSVars(lightTokens)}
    }

    @media (prefers-color-scheme: dark) {
      :root {
${tokensToCSSVars(darkTokens)}
      }
    }

    /* ============================================
       Base Reset & Typography
       ============================================ */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    @keyframes gradient-shift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    body {
      margin: 0;
      font-family: 'SF Pro Display', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background: var(--bg);
      background-size: 200% 200%;
      animation: gradient-shift 15s ease infinite;
      color: var(--text-primary);
      min-height: 100vh;
      display: flex;
      overflow: hidden;
    }

    /* ============================================
       Layout Grid
       ============================================ */
    .app {
      flex: 1;
      display: grid;
      grid-template-columns: 280px 1fr 360px;
      gap: var(--space-lg);
      padding: var(--space-xl);
      max-width: 1920px;
      margin: 0 auto;
      height: 100vh;
    }

    /* ============================================
       Panel Base
       ============================================ */
    .panel {
      background: var(--surface-glass);
      backdrop-filter: var(--blur-lg);
      -webkit-backdrop-filter: var(--blur-lg);
      border-radius: var(--radius-2xl);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-xl);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: transform var(--duration-slow) var(--ease-out),
                  box-shadow var(--duration-base) var(--ease-out);
      will-change: transform, box-shadow;
    }

    .panel:hover {
      box-shadow: var(--shadow-xl), var(--glow-accent);
    }

    /* ============================================
       Panel Header
       ============================================ */
    .panel-header {
      padding: var(--space-lg) var(--space-xl);
      border-bottom: 1px solid var(--separator);
      background: linear-gradient(180deg,
        var(--surface-elevated) 0%,
        transparent 100%);
    }

    .panel-title {
      margin: 0;
      font-size: var(--font-xl);
      font-weight: 700;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg,
        var(--text-primary) 0%,
        var(--text-secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .panel-subtitle {
      margin: var(--space-xs) 0 0;
      font-size: var(--font-sm);
      color: var(--text-tertiary);
      font-weight: 400;
    }

    /* ============================================
       Command Board (Left Panel)
       ============================================ */
    .command-board {
      position: relative;
    }

    .command-list {
      padding: var(--space-md);
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .command-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-base) var(--space-md);
      border-radius: var(--radius-lg);
      background: var(--surface);
      border: 1px solid var(--border);
      cursor: pointer;
      font-size: var(--font-base);
      font-weight: 500;
      color: var(--text-primary);
      transition: all var(--duration-base) var(--ease-out);
      overflow: hidden;
    }

    .command-item::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg,
        var(--accent-subtle) 0%,
        transparent 100%);
      opacity: 0;
      transition: opacity var(--duration-base) var(--ease-out);
    }

    .command-item:hover::before {
      opacity: 1;
    }

    .command-item:hover {
      transform: translateX(4px) scale(1.02);
      border-color: var(--accent);
      box-shadow: var(--shadow-md),
                  0 0 0 1px var(--accent-subtle);
    }

    .command-item:active {
      transform: translateX(4px) scale(0.98);
    }

    .command-item.active {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
      font-weight: 600;
    }

    .command-item.active::before {
      opacity: 0;
    }

    .command-icon {
      font-size: var(--font-xl);
      transition: transform var(--duration-base) var(--ease-spring);
    }

    .command-item:hover .command-icon {
      transform: scale(1.15) rotate(-5deg);
    }

    .command-hint {
      margin-left: auto;
      font-size: var(--font-xs);
      color: var(--text-tertiary);
      font-family: 'SF Mono', 'Menlo', monospace;
      background: var(--surface-muted);
      padding: var(--space-xs) var(--space-sm);
      border-radius: var(--radius-sm);
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .command-item.active .command-hint {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    /* ============================================
       Workspace (Center Panel)
       ============================================ */
    .workspace {
      padding: 0;
      display: flex;
      flex-direction: column;
    }

    .workspace-tabs {
      display: flex;
      gap: var(--space-sm);
      padding: var(--space-base) var(--space-xl);
      border-bottom: 1px solid var(--separator);
      background: linear-gradient(180deg,
        var(--surface-elevated) 0%,
        transparent 100%);
    }

    .workspace-tab {
      position: relative;
      padding: var(--space-sm) var(--space-lg);
      border-radius: var(--radius-full);
      border: 1px solid transparent;
      cursor: pointer;
      font-size: var(--font-sm);
      font-weight: 600;
      color: var(--text-secondary);
      transition: all var(--duration-base) var(--ease-out);
      white-space: nowrap;
    }

    .workspace-tab::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: var(--radius-full);
      background: var(--surface-hover);
      opacity: 0;
      transition: opacity var(--duration-base) var(--ease-out);
    }

    .workspace-tab:hover::before {
      opacity: 1;
    }

    .workspace-tab:hover {
      color: var(--text-primary);
      border-color: var(--border-medium);
    }

    .workspace-tab.active {
      background: var(--text-primary);
      color: var(--bg-solid);
      border-color: var(--text-primary);
      box-shadow: var(--shadow-md);
    }

    .workspace-tab.active::before {
      opacity: 0;
    }

    .workspace-body {
      flex: 1;
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: var(--space-lg);
      padding: var(--space-xl);
      overflow: hidden;
    }

    .tree-pane,
    .detail-pane {
      background: var(--surface);
      border-radius: var(--radius-xl);
      padding: var(--space-xl);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      overflow-y: auto;
      transition: all var(--duration-base) var(--ease-out);
    }

    .tree-pane:hover,
    .detail-pane:hover {
      border-color: var(--border-medium);
      box-shadow: var(--shadow-md);
    }

    /* ============================================
       Placeholder Content
       ============================================ */
    .placeholder-title {
      margin: 0 0 var(--space-md);
      font-size: var(--font-lg);
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.3px;
    }

    .placeholder-desc {
      margin: 0;
      color: var(--text-secondary);
      font-size: var(--font-base);
      line-height: 1.6;
    }

    .placeholder-badge {
      display: inline-block;
      margin-top: var(--space-lg);
      padding: var(--space-sm) var(--space-base);
      background: var(--accent-subtle);
      color: var(--accent);
      border-radius: var(--radius-full);
      font-size: var(--font-xs);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ============================================
       Insight Rail (Right Panel)
       ============================================ */
    .insight-rail {
      position: relative;
    }

    .insight-list {
      padding: var(--space-base);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      overflow-y: auto;
      max-height: calc(100vh - 200px);
    }

    .insight-card {
      position: relative;
      border-radius: var(--radius-xl);
      border: 1px solid var(--border);
      padding: var(--space-lg);
      background: var(--surface);
      box-shadow: var(--shadow-sm);
      transition: all var(--duration-base) var(--ease-out);
      overflow: hidden;
    }

    .insight-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg,
        var(--accent) 0%,
        var(--system) 100%);
      opacity: 0;
      transition: opacity var(--duration-base) var(--ease-out);
    }

    .insight-card:hover {
      border-color: var(--border-medium);
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .insight-card:hover::before {
      opacity: 1;
    }

    .insight-status {
      display: inline-flex;
      align-items: center;
      gap: var(--space-xs);
      font-size: var(--font-xs);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
      color: var(--text-tertiary);
      margin-bottom: var(--space-md);
    }

    .insight-status::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--success);
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }

    .insight-title {
      margin: 0 0 var(--space-sm);
      font-size: var(--font-md);
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.2px;
    }

    .insight-description {
      margin: 0;
      font-size: var(--font-sm);
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .insight-actions {
      margin-top: var(--space-lg);
      display: flex;
      gap: var(--space-sm);
    }

    .ghost-button {
      flex: 1;
      border-radius: var(--radius-full);
      border: 1px solid var(--border);
      background: transparent;
      padding: var(--space-sm) var(--space-base);
      font-size: var(--font-sm);
      font-weight: 600;
      color: var(--text-primary);
      cursor: pointer;
      transition: all var(--duration-base) var(--ease-out);
      font-family: inherit;
    }

    .ghost-button:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--accent-subtle);
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    .ghost-button:active {
      transform: translateY(0);
    }

    .ghost-button.primary {
      background: var(--accent);
      border-color: var(--accent);
      color: white;
    }

    .ghost-button.primary:hover {
      background: var(--accent-hover);
      border-color: var(--accent-hover);
    }

    /* ============================================
       Scrollbar Styling
       ============================================ */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    ::-webkit-scrollbar-thumb {
      background: var(--border-medium);
      border-radius: var(--radius-full);
      transition: background var(--duration-base) var(--ease-out);
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--text-tertiary);
    }

    /* ============================================
       Responsive Design
       ============================================ */
    @media (max-width: 1400px) {
      .app {
        grid-template-columns: 240px 1fr 320px;
        gap: var(--space-base);
        padding: var(--space-lg);
      }
    }

    @media (max-width: 1024px) {
      .app {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
      }

      .command-board,
      .insight-rail {
        display: none;
      }
    }

    /* ============================================
       Accessibility
       ============================================ */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    /* ============================================
       Focus Visible
       ============================================ */
    *:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    /* ============================================
       Loading Animation
       ============================================ */
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }

    .loading {
      background: linear-gradient(
        90deg,
        var(--surface-muted) 0px,
        var(--surface-elevated) 50%,
        var(--surface-muted) 100%
      );
      background-size: 1000px 100%;
      animation: shimmer 2s infinite linear;
    }
  </style>
</head>
<body>
  <div class="app" data-ui-version="next-apple">
    <!-- Command Board (Left) -->
    <aside class="panel command-board" role="navigation" aria-label="コマンドボード">
      <div class="panel-header">
        <h2 class="panel-title">Command Board</h2>
        <p class="panel-subtitle">要求管理の中央操作パネル</p>
      </div>
      <nav class="command-list">
        ${COMMAND_ITEMS.map((item, index) => `
        <button
          class="command-item${index === 0 ? ' active' : ''}"
          data-command="${item.id}"
          aria-label="${item.label}"
          tabindex="0"
        >
          <span class="command-icon" aria-hidden="true">${item.icon}</span>
          <span>${item.label}</span>
          <kbd class="command-hint" aria-label="ショートカット: ${item.hint}">${item.hint}</kbd>
        </button>
        `).join('')}
      </nav>
    </aside>

    <!-- Workspace (Center) -->
    <main class="panel workspace" role="main" aria-label="ワークスペース">
      <div class="workspace-tabs" role="tablist">
        <button class="workspace-tab active" role="tab" aria-selected="true" data-tab="tree">Tree</button>
        <button class="workspace-tab" role="tab" aria-selected="false" data-tab="list">List</button>
        <button class="workspace-tab" role="tab" aria-selected="false" data-tab="matrix">Matrix</button>
        <button class="workspace-tab" role="tab" aria-selected="false" data-tab="timeline">Timeline</button>
      </div>
      <div class="workspace-body">
        <section class="tree-pane" role="region" aria-label="ツリー表示">
          <h3 class="placeholder-title">🌳 Tree Panel</h3>
          <p class="placeholder-desc">
            要求の階層構造を視覚的に表示します。<br>
            ステークホルダ要求、システム要求、機能要求の3層構造をMECE原則に基づいて整理。
          </p>
          <span class="placeholder-badge">実装準備中</span>
        </section>
        <section class="detail-pane" role="region" aria-label="詳細表示">
          <h3 class="placeholder-title">🔍 Requirement Inspector</h3>
          <p class="placeholder-desc">
            選択中の要求の詳細情報を表示します。<br>
            メタデータ、関連ノード、AI要約、影響分析結果をここに統合します。
          </p>
          <span class="placeholder-badge">実装準備中</span>
        </section>
      </div>
    </main>

    <!-- Insight Rail (Right) -->
    <aside class="panel insight-rail" role="complementary" aria-label="インサイトレール">
      <div class="panel-header">
        <h2 class="panel-title">Insight Rail</h2>
        <p class="panel-subtitle">AI支援と検証状態</p>
      </div>
      <div class="insight-list">
        <article class="insight-card">
          <div class="insight-status">Validation</div>
          <h3 class="insight-title">✅ MECE逸脱なし</h3>
          <p class="insight-description">
            すべての要求がMECE原則に従って正しく整理されています。階層構造の整合性が確認されました。
          </p>
          <div class="insight-actions">
            <button class="ghost-button">詳細を表示</button>
            <button class="ghost-button">承認ログ</button>
          </div>
        </article>

        <article class="insight-card">
          <div class="insight-status">AI Assistant</div>
          <h3 class="insight-title">🤖 提案を準備中</h3>
          <p class="insight-description">
            MCPチャットアシスタントが初期化中です。完了後、改善提案や影響分析がここに表示されます。
          </p>
          <div class="insight-actions">
            <button class="ghost-button primary">チャットを開く</button>
          </div>
        </article>

        <article class="insight-card">
          <div class="insight-status">Quality</div>
          <h3 class="insight-title">📊 品質スコア: 92/100</h3>
          <p class="insight-description">
            要求の粒度、抽象度、トレーサビリティが高水準です。さらなる改善の余地があります。
          </p>
          <div class="insight-actions">
            <button class="ghost-button">レポート</button>
            <button class="ghost-button">改善提案</button>
          </div>
        </article>
      </div>
    </aside>
  </div>

  <script>
    // Command Board interactions
    document.querySelectorAll('.command-item').forEach((item) => {
      item.addEventListener('click', function() {
        // Remove active from all
        document.querySelectorAll('.command-item').forEach(i => i.classList.remove('active'));
        // Add active to clicked
        this.classList.add('active');

        const command = this.dataset.command;
        console.log('[Apple UI] Command selected:', command);

        // Haptic-style animation
        this.style.transform = 'translateX(4px) scale(0.95)';
        setTimeout(() => {
          this.style.transform = '';
        }, 100);
      });

      // Keyboard support
      item.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });
    });

    // Workspace tabs
    document.querySelectorAll('.workspace-tab').forEach((tab) => {
      tab.addEventListener('click', function() {
        // Remove active from all
        document.querySelectorAll('.workspace-tab').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        // Add active to clicked
        this.classList.add('active');
        this.setAttribute('aria-selected', 'true');

        const tabName = this.dataset.tab;
        console.log('[Apple UI] Tab selected:', tabName);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      // Only handle shortcuts when not in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const shortcuts = {
        'g': 'overview',
        't': 'tree',
        'l': 'list',
        'm': 'matrix',
        'r': 'timeline'
      };

      const key = e.key.toLowerCase();
      if (shortcuts[key]) {
        e.preventDefault();
        const command = document.querySelector(\`[data-command="\${shortcuts[key]}"]\`);
        if (command) command.click();
      }
    });

    // Log initialization
    console.log('🍎 Apple-inspired Requirements UI initialized');
    console.log('📦 Design tokens loaded');
    console.log('⌨️  Keyboard shortcuts: G, T, L, M, R');
  </script>
</body>
</html>`;
}
