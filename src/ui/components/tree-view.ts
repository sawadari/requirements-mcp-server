/**
 * Tree View Component - Apple-inspired hierarchical requirements display
 * Renders the requirement tree with MECE hierarchy visualization
 */

export interface TreeNode {
  id: string;
  title: string;
  category: 'stakeholder' | 'system' | 'functional';
  status?: string;
  priority?: string;
  children?: TreeNode[];
}

export interface TreeViewOptions {
  nodes: TreeNode[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

/**
 * Renders a tree node with proper indentation and styling
 */
function renderTreeNode(
  node: TreeNode,
  depth: number = 0,
  selectedId?: string | null
): string {
  const isSelected = node.id === selectedId;
  const hasChildren = node.children && node.children.length > 0;
  const indent = depth * 20;

  // Category color mapping
  const categoryClass = `tree-node-${node.category}`;

  return `
    <div class="tree-node ${categoryClass} ${isSelected ? 'selected' : ''}"
         data-id="${node.id}"
         data-depth="${depth}"
         style="padding-left: ${indent}px;">
      <div class="tree-node-content">
        ${hasChildren ? `
          <button class="tree-node-toggle" aria-label="展開/折りたたみ">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        ` : '<span class="tree-node-spacer"></span>'}

        <div class="tree-node-info">
          <div class="tree-node-header">
            <span class="tree-node-id">${node.id}</span>
            ${node.status ? `<span class="tree-node-badge status-${node.status}">${node.status}</span>` : ''}
            ${node.priority ? `<span class="tree-node-badge priority-${node.priority}">${node.priority}</span>` : ''}
          </div>
          <div class="tree-node-title">${node.title}</div>
        </div>
      </div>

      ${hasChildren ? `
        <div class="tree-node-children">
          ${node.children!.map(child => renderTreeNode(child, depth + 1, selectedId)).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generates the complete tree view HTML
 */
export function renderTreeView(options: TreeViewOptions): string {
  const { nodes, selectedId } = options;

  return `
    <div class="tree-view">
      ${nodes.length === 0 ? `
        <div class="tree-empty-state">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <path d="M32 8L8 24L32 40L56 24L32 8Z" stroke="var(--text-tertiary)" stroke-width="2" fill="var(--surface-muted)"/>
            <path d="M32 40V56" stroke="var(--text-tertiary)" stroke-width="2"/>
            <path d="M8 24V40L32 56" stroke="var(--text-tertiary)" stroke-width="2"/>
            <path d="M56 24V40L32 56" stroke="var(--text-tertiary)" stroke-width="2"/>
          </svg>
          <h4>要求が見つかりません</h4>
          <p>プロジェクトに要求を追加してください</p>
        </div>
      ` : nodes.map(node => renderTreeNode(node, 0, selectedId)).join('')}
    </div>

    <style>
      /* Tree View Container */
      .tree-view {
        width: 100%;
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
      }

      /* Tree Node Base */
      .tree-node {
        position: relative;
        transition: background var(--duration-fast) var(--ease-out);
      }

      .tree-node::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: transparent;
        transition: background var(--duration-base) var(--ease-out);
      }

      /* Category colors */
      .tree-node-stakeholder::before {
        background: var(--stakeholder);
      }

      .tree-node-system::before {
        background: var(--system);
      }

      .tree-node-functional::before {
        background: var(--functional);
      }

      .tree-node-content {
        display: flex;
        align-items: flex-start;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--duration-fast) var(--ease-out);
        position: relative;
      }

      .tree-node-content:hover {
        background: var(--surface-hover);
      }

      .tree-node.selected .tree-node-content {
        background: var(--accent-subtle);
        border-left: 3px solid var(--accent);
        padding-left: calc(var(--space-md) - 3px);
      }

      /* Toggle Button */
      .tree-node-toggle {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        color: var(--text-tertiary);
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: all var(--duration-fast) var(--ease-out);
        margin-top: 2px;
      }

      .tree-node-toggle:hover {
        background: var(--surface-pressed);
        color: var(--text-primary);
      }

      .tree-node-toggle svg {
        transition: transform var(--duration-base) var(--ease-out);
      }

      .tree-node.collapsed .tree-node-toggle svg {
        transform: rotate(-90deg);
      }

      .tree-node-spacer {
        width: 20px;
        flex-shrink: 0;
      }

      /* Node Info */
      .tree-node-info {
        flex: 1;
        min-width: 0;
      }

      .tree-node-header {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        margin-bottom: var(--space-xs);
        flex-wrap: wrap;
      }

      .tree-node-id {
        font-family: 'SF Mono', 'Menlo', monospace;
        font-size: var(--font-xs);
        font-weight: 700;
        color: var(--text-secondary);
        letter-spacing: 0.5px;
      }

      .tree-node-badge {
        font-size: var(--font-xs);
        font-weight: 600;
        padding: 2px var(--space-xs);
        border-radius: var(--radius-sm);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .tree-node-badge.status-approved {
        background: var(--success-bg);
        color: var(--success);
      }

      .tree-node-badge.status-draft {
        background: var(--warning-bg);
        color: var(--warning);
      }

      .tree-node-badge.status-in_progress {
        background: var(--accent-subtle);
        color: var(--accent);
      }

      .tree-node-badge.priority-critical,
      .tree-node-badge.priority-high {
        background: var(--danger-bg);
        color: var(--danger);
      }

      .tree-node-badge.priority-medium {
        background: var(--warning-bg);
        color: var(--warning);
      }

      .tree-node-badge.priority-low {
        background: var(--text-quaternary);
        color: var(--text-secondary);
      }

      .tree-node-title {
        font-size: var(--font-sm);
        font-weight: 500;
        color: var(--text-primary);
        line-height: 1.4;
        word-break: break-word;
      }

      .tree-node.selected .tree-node-title {
        font-weight: 600;
      }

      /* Children Container */
      .tree-node-children {
        margin-top: var(--space-xs);
        transition: all var(--duration-slow) var(--ease-out);
      }

      .tree-node.collapsed .tree-node-children {
        display: none;
      }

      /* Empty State */
      .tree-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-3xl) var(--space-xl);
        text-align: center;
      }

      .tree-empty-state svg {
        margin-bottom: var(--space-lg);
        opacity: 0.6;
      }

      .tree-empty-state h4 {
        margin: 0 0 var(--space-sm);
        font-size: var(--font-lg);
        font-weight: 600;
        color: var(--text-primary);
      }

      .tree-empty-state p {
        margin: 0;
        font-size: var(--font-sm);
        color: var(--text-secondary);
      }

      /* Animations */
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .tree-node {
        animation: fadeIn var(--duration-base) var(--ease-out);
      }

      /* Hover depth indicator */
      .tree-node:hover::after {
        content: '';
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 2px;
        height: 60%;
        background: linear-gradient(
          to bottom,
          transparent,
          var(--accent),
          transparent
        );
        opacity: 0.3;
      }
    </style>
  `;
}

/**
 * Initializes tree view interactions (to be called after rendering)
 */
export function initTreeViewInteractions(onSelect?: (id: string) => void) {
  // Toggle expand/collapse
  document.querySelectorAll('.tree-node-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const node = (e.currentTarget as HTMLElement).closest('.tree-node');
      if (node) {
        node.classList.toggle('collapsed');
      }
    });
  });

  // Select node
  document.querySelectorAll('.tree-node-content').forEach(content => {
    content.addEventListener('click', (e) => {
      const node = (e.currentTarget as HTMLElement).closest('.tree-node');
      if (!node) return;

      const id = node.getAttribute('data-id');
      if (!id) return;

      // Remove previous selection
      document.querySelectorAll('.tree-node.selected').forEach(n => {
        n.classList.remove('selected');
      });

      // Add new selection
      node.classList.add('selected');

      // Call callback
      if (onSelect) {
        onSelect(id);
      }

      console.log('[Tree View] Selected:', id);
    });
  });
}
