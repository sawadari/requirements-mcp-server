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

export function renderDynamicShell(options: RenderOptions = {}): string {
  const title = options.title ?? 'Requirements Command Board';
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    /* Import design tokens and base styles from next-shell */
    :root {
${tokensToCSSVars(lightTokens)}
    }

    @media (prefers-color-scheme: dark) {
      :root {
${tokensToCSSVars(darkTokens)}
      }
    }

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
    }

    .panel:hover {
      box-shadow: var(--shadow-xl), var(--glow-accent);
    }

    .panel-header {
      padding: var(--space-lg) var(--space-xl);
      border-bottom: 1px solid var(--separator);
      background: linear-gradient(180deg, var(--surface-elevated) 0%, transparent 100%);
    }

    .panel-title {
      margin: 0;
      font-size: var(--font-xl);
      font-weight: 700;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
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

    /* Command Board */
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
      background: linear-gradient(135deg, var(--accent-subtle) 0%, transparent 100%);
      opacity: 0;
      transition: opacity var(--duration-base) var(--ease-out);
    }

    .command-item:hover::before {
      opacity: 1;
    }

    .command-item:hover {
      transform: translateX(4px) scale(1.02);
      border-color: var(--accent);
      box-shadow: var(--shadow-md), 0 0 0 1px var(--accent-subtle);
    }

    .command-item.active {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
      font-weight: 600;
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

    /* Workspace */
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
      background: linear-gradient(180deg, var(--surface-elevated) 0%, transparent 100%);
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
      background: transparent;
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

    .workspace-body {
      flex: 1;
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: var(--space-lg);
      padding: var(--space-xl);
      overflow: hidden;
    }

    .tree-pane, .detail-pane {
      background: var(--surface);
      border-radius: var(--radius-xl);
      padding: var(--space-xl);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      overflow-y: auto;
      transition: all var(--duration-base) var(--ease-out);
    }

    .tree-pane:hover, .detail-pane:hover {
      border-color: var(--border-medium);
      box-shadow: var(--shadow-md);
    }

    /* Loading State */
    .loading-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-3xl);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    /* Scrollbar */
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
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--text-tertiary);
    }

    *:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style>
</head>
<body>
  <div class="app" data-ui-version="next-dynamic">
    <!-- Command Board -->
    <aside class="panel command-board" role="navigation">
      <div class="panel-header">
        <h2 class="panel-title">Command Board</h2>
        <p class="panel-subtitle">要求管理の中央操作パネル</p>
      </div>

      <!-- Project Selector -->
      <div style="padding: var(--space-md); border-bottom: 1px solid var(--separator);">
        <div id="project-selector-container">
          <!-- ローディング状態 -->
          <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-md);">
            <div style="display: flex; align-items: center; gap: var(--space-md);">
              <span style="font-size: var(--font-xl);">📁</span>
              <div style="flex: 1;">
                <div style="font-size: var(--font-base); font-weight: 600; color: var(--text-secondary);">読み込み中...</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav class="command-list">
        ${COMMAND_ITEMS.map((item, index) => `
        <button class="command-item${index === 1 ? ' active' : ''}" data-command="${item.id}">
          <span class="command-icon">${item.icon}</span>
          <span>${item.label}</span>
          <kbd class="command-hint">${item.hint}</kbd>
        </button>
        `).join('')}
      </nav>
    </aside>

    <!-- Workspace -->
    <main class="panel workspace" role="main">
      <div class="workspace-tabs">
        <button class="workspace-tab active" data-tab="tree">Tree</button>
        <button class="workspace-tab" data-tab="list">List</button>
        <button class="workspace-tab" data-tab="matrix">Matrix</button>
        <button class="workspace-tab" data-tab="timeline">Timeline</button>
      </div>
      <div class="workspace-body">
        <section class="tree-pane" id="tree-container">
          <div class="loading-spinner"><div class="spinner"></div></div>
        </section>
        <section class="detail-pane" id="detail-container">
          <div class="loading-spinner"><div class="spinner"></div></div>
        </section>
      </div>
    </main>

    <!-- Insight Rail -->
    <aside class="panel insight-rail" role="complementary">
      <div class="panel-header">
        <h2 class="panel-title">Insight Rail</h2>
        <p class="panel-subtitle">AI支援と検証状態</p>
      </div>
      <div id="insight-container" style="padding: var(--space-base);">
        <div class="loading-spinner"><div class="spinner"></div></div>
      </div>
    </aside>
  </div>

  <script type="module">
    // State
    let treeData = null;
    let selectedRequirementId = null;

    // Fetch tree data
    async function fetchTreeData() {
      try {
        const response = await fetch('/api/tree');
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Failed to fetch tree data:', error);
        return null;
      }
    }

    // Fetch requirement details
    async function fetchRequirementDetails(id) {
      try {
        const response = await fetch(\`/api/requirement/\${id}/relations\`);
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Failed to fetch requirement details:', error);
        return null;
      }
    }

    // Render tree view (simplified inline version)
    function renderTree(data) {
      if (!data || !data.tree || data.tree.length === 0) {
        return '<div style="text-align: center; padding: 2rem; color: var(--text-tertiary);">要求が見つかりません</div>';
      }

      function renderNode(node, depth = 0) {
        const indent = depth * 20;
        const category = node.category || 'system';
        const categoryColors = {
          stakeholder: 'var(--stakeholder)',
          system: 'var(--system)',
          functional: 'var(--functional)'
        };

        return \`
          <div class="tree-node" data-id="\${node.id}" style="padding-left: \${indent}px; padding: 8px; cursor: pointer; border-left: 3px solid \${categoryColors[category]}; margin: 4px 0; border-radius: 8px; transition: all 0.2s;">
            <div style="font-family: 'SF Mono', monospace; font-size: 11px; color: var(--text-secondary); margin-bottom: 4px;">\${node.id}</div>
            <div style="font-size: 14px; font-weight: 500; color: var(--text-primary);">\${node.title || node.label}</div>
            \${node.children && node.children.length > 0 ? node.children.map(child => renderNode(child, depth + 1)).join('') : ''}
          </div>
        \`;
      }

      return data.tree.map(node => renderNode(node, 0)).join('');
    }

    // Render requirement details (simplified)
    function renderDetails(data) {
      if (!data || !data.requirement) {
        return '<div style="text-align: center; padding: 2rem; color: var(--text-tertiary);">要求を選択してください</div>';
      }

      const req = data.requirement;
      const categoryColors = {
        stakeholder: 'var(--stakeholder)',
        system: 'var(--system)',
        functional: 'var(--functional)'
      };

      return \`
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <div>
            <div style="display: inline-block; padding: 4px 12px; background: \${categoryColors[req.category]}22; color: \${categoryColors[req.category]}; border-radius: 999px; font-size: 11px; font-weight: 700; margin-bottom: 12px;">\${req.category}</div>
            <h2 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: var(--text-primary);">\${req.title}</h2>
            <div style="font-family: 'SF Mono', monospace; font-size: 13px; color: var(--text-tertiary);">\${req.id}</div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            <div style="background: var(--surface-muted); padding: 12px; border-radius: 12px;">
              <div style="font-size: 11px; color: var(--text-tertiary); margin-bottom: 4px;">STATUS</div>
              <div style="font-size: 14px; font-weight: 600; color: var(--accent);">\${req.status}</div>
            </div>
            <div style="background: var(--surface-muted); padding: 12px; border-radius: 12px;">
              <div style="font-size: 11px; color: var(--text-tertiary); margin-bottom: 4px;">PRIORITY</div>
              <div style="font-size: 14px; font-weight: 600; color: var(--warning);">\${req.priority}</div>
            </div>
          </div>

          <div style="background: var(--surface-muted); padding: 16px; border-radius: 12px;">
            <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 700;">Description</h3>
            <div style="color: var(--text-secondary); line-height: 1.6;">\${req.description || '説明がありません'}</div>
          </div>

          \${req.rationale ? \`
          <div style="background: var(--surface-muted); padding: 16px; border-radius: 12px;">
            <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 700;">Rationale</h3>
            <div style="color: var(--text-secondary); line-height: 1.6;">\${req.rationale}</div>
          </div>
          \` : ''}
        </div>
      \`;
    }

    // Render project selector
    function renderProjectSelector(projects, currentProject) {
      if (!projects || projects.length === 0) return '<div style="color: var(--text-tertiary); padding: var(--space-md);">プロジェクトなし</div>';

      const current = currentProject || projects[0];
      return \`
        <div style="position: relative;">
          <button id="project-btn" style="width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-md); cursor: pointer; transition: all 0.2s; font-family: inherit;">
            <div style="display: flex; align-items: center; gap: var(--space-md);">
              <span style="font-size: var(--font-xl);">📁</span>
              <div style="flex: 1; text-align: left;">
                <div style="font-size: var(--font-base); font-weight: 600; color: var(--text-primary);">\${current.systemName || current.projectName}</div>
                <div style="font-size: var(--font-xs); color: var(--text-tertiary); margin-top: 2px;">\${current.requirementCount} 要求</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </div>
          </button>
          <div id="project-dropdown" style="display: none; position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: var(--surface-glass); backdrop-filter: var(--blur-lg); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); z-index: 1000; max-height: 400px; overflow-y: auto;">
            <div style="padding: var(--space-md) var(--space-lg); border-bottom: 1px solid var(--separator); font-size: var(--font-sm); font-weight: 600; color: var(--text-secondary);">
              プロジェクト一覧 <span style="font-size: var(--font-xs); color: var(--text-tertiary); background: var(--surface-muted); padding: 2px 8px; border-radius: 4px; margin-left: 8px;">\${projects.length}件</span>
            </div>
            <div style="padding: 8px;">
              \${projects.map(p => \`
                <button class="project-item" data-project-id="\${p.projectId}" style="width: 100%; display: flex; align-items: flex-start; gap: var(--space-md); padding: var(--space-md); background: \${p.isCurrent ? 'var(--accent-subtle)' : 'transparent'}; border: 1px solid \${p.isCurrent ? 'var(--accent)' : 'transparent'}; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s; text-align: left; font-family: inherit; margin-bottom: 4px;">
                  <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                      <span style="font-size: var(--font-base); font-weight: 600; color: var(--text-primary);">\${p.systemName || p.projectName}</span>
                      \${p.isCurrent ? '<span style="font-size: 10px; font-weight: 700; color: var(--accent); background: var(--accent-subtle); padding: 2px 6px; border-radius: 4px;">現在</span>' : ''}
                    </div>
                    <div style="font-size: 11px; color: var(--text-tertiary);"><span style="font-family: monospace; font-weight: 600;">\${p.projectId}</span> • \${p.requirementCount} 要求</div>
                    \${p.description ? \`<div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px; line-height: 1.4;">\${p.description}</div>\` : ''}
                  </div>
                  \${p.isCurrent ? '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 5" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/></svg>' : ''}
                </button>
              \`).join('')}
            </div>
          </div>
        </div>
      \`;
    }

    // Initialize
    async function init() {
      console.log('🍎 Initializing dynamic Apple UI...');

      // Load projects
      try {
        const projectsRes = await fetch('/api/projects');
        const projectsData = await projectsRes.json();
        const currentRes = await fetch('/api/project/current');
        const currentData = await currentRes.json();

        const container = document.getElementById('project-selector-container');
        container.innerHTML = renderProjectSelector(projectsData.projects, currentData);

        // Project selector interactions
        const projectBtn = document.getElementById('project-btn');
        const projectDropdown = document.getElementById('project-dropdown');

        projectBtn.addEventListener('click', () => {
          projectDropdown.style.display = projectDropdown.style.display === 'none' ? 'block' : 'none';
        });

        document.addEventListener('click', (e) => {
          if (!projectBtn.contains(e.target) && !projectDropdown.contains(e.target)) {
            projectDropdown.style.display = 'none';
          }
        });

        document.querySelectorAll('.project-item').forEach(item => {
          item.addEventListener('click', async function() {
            const projectId = this.getAttribute('data-project-id');
            projectDropdown.style.display = 'none';

            const nameEl = this.querySelector('span');
            const originalText = nameEl.textContent;
            nameEl.textContent = '切り替え中...';

            try {
              const res = await fetch('/api/project/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
              });
              if (res.ok) {
                window.location.reload();
              } else {
                nameEl.textContent = originalText;
                alert('プロジェクトの切り替えに失敗しました');
              }
            } catch (err) {
              nameEl.textContent = originalText;
              alert('エラーが発生しました');
            }
          });
        });
      } catch (error) {
        console.error('Failed to load projects:', error);
        document.getElementById('project-selector-container').innerHTML = '<div style="color: var(--danger); padding: var(--space-md); text-align: center;">プロジェクトの読み込みに失敗</div>';
      }

      // Load tree data
      treeData = await fetchTreeData();
      const treeContainer = document.getElementById('tree-container');
      treeContainer.innerHTML = renderTree(treeData);

      // Add click handlers to tree nodes
      document.querySelectorAll('.tree-node').forEach(node => {
        node.addEventListener('click', async function() {
          const id = this.getAttribute('data-id');
          selectedRequirementId = id;

          // Highlight selected
          document.querySelectorAll('.tree-node').forEach(n => {
            n.style.background = '';
          });
          this.style.background = 'var(--accent-subtle)';

          // Load details
          const detailContainer = document.getElementById('detail-container');
          detailContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

          const details = await fetchRequirementDetails(id);
          detailContainer.innerHTML = renderDetails(details);
        });
      });

      // Show empty details initially
      document.getElementById('detail-container').innerHTML = renderDetails(null);

      // Mock insights
      document.getElementById('insight-container').innerHTML = \`
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="background: var(--surface); border-radius: 16px; padding: 16px; border: 1px solid var(--border);">
            <div style="font-size: 11px; color: var(--text-tertiary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">VALIDATION</div>
            <h3 style="margin: 0 0 6px; font-size: 15px; font-weight: 700;">✅ MECE逸脱なし</h3>
            <p style="margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5;">すべての要求が正しく整理されています</p>
          </div>
          <div style="background: var(--surface); border-radius: 16px; padding: 16px; border: 1px solid var(--border);">
            <div style="font-size: 11px; color: var(--text-tertiary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">AI ASSISTANT</div>
            <h3 style="margin: 0 0 6px; font-size: 15px; font-weight: 700;">🤖 準備完了</h3>
            <p style="margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5;">チャットでサポートします</p>
          </div>
        </div>
      \`;
    }

    // Command interactions
    document.querySelectorAll('.command-item').forEach(item => {
      item.addEventListener('click', function() {
        document.querySelectorAll('.command-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        console.log('[Command]', this.dataset.command);
      });
    });

    // Tab interactions
    document.querySelectorAll('.workspace-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.workspace-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        console.log('[Tab]', this.dataset.tab);
      });
    });

    // Start
    init();
  </script>
</body>
</html>`;
}
