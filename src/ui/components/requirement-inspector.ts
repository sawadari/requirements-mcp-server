/**
 * Requirement Inspector Component - Apple-inspired detail view
 * Displays comprehensive information about a selected requirement
 */

export interface Requirement {
  id: string;
  title: string;
  description: string;
  rationale?: string;
  category: 'stakeholder' | 'system' | 'functional';
  status: string;
  priority: string;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  parentIds?: string[];
  childrenIds?: string[];
  qualityScore?: number;
}

export interface InspectorOptions {
  requirement: Requirement | null;
  relations?: {
    parents?: Array<{ id: string; title: string }>;
    children?: Array<{ id: string; title: string }>;
  };
}

/**
 * Renders the requirement inspector component
 */
export function renderRequirementInspector(options: InspectorOptions): string {
  const { requirement, relations } = options;

  if (!requirement) {
    return `
      <div class="inspector-empty">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="32" stroke="var(--text-tertiary)" stroke-width="2" fill="var(--surface-muted)"/>
          <path d="M28 36L36 44L52 28" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h4>要求を選択してください</h4>
        <p>左側のツリーから要求を選択すると、<br>詳細情報がここに表示されます</p>
      </div>
    `;
  }

  const { id, title, description, rationale, category, status, priority, owner, createdAt, updatedAt, tags, qualityScore } = requirement;

  // Category badge
  const categoryLabels = {
    stakeholder: 'ステークホルダ要求',
    system: 'システム要求',
    functional: 'システム機能要求'
  };

  const categoryColors = {
    stakeholder: 'var(--stakeholder)',
    system: 'var(--system)',
    functional: 'var(--functional)'
  };

  return `
    <div class="requirement-inspector">
      <!-- Header Section -->
      <div class="inspector-header">
        <div class="inspector-category-badge" style="background: ${categoryColors[category]}22; color: ${categoryColors[category]};">
          ${categoryLabels[category]}
        </div>
        <h2 class="inspector-title">${title}</h2>
        <div class="inspector-id">${id}</div>
      </div>

      <!-- Meta Cards -->
      <div class="inspector-meta-grid">
        <div class="meta-card">
          <div class="meta-label">Status</div>
          <div class="meta-value status-${status}">${status}</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Priority</div>
          <div class="meta-value priority-${priority}">${priority}</div>
        </div>
        ${owner ? `
        <div class="meta-card">
          <div class="meta-label">Owner</div>
          <div class="meta-value">${owner}</div>
        </div>
        ` : ''}
        ${qualityScore !== undefined ? `
        <div class="meta-card">
          <div class="meta-label">Quality Score</div>
          <div class="meta-value quality-score">
            <span class="score-number">${qualityScore}</span>
            <div class="score-bar">
              <div class="score-fill" style="width: ${qualityScore}%; background: ${qualityScore >= 80 ? 'var(--success)' : qualityScore >= 60 ? 'var(--warning)' : 'var(--danger)'}"></div>
            </div>
          </div>
        </div>
        ` : ''}
      </div>

      <!-- Description Section -->
      <div class="inspector-section">
        <h3 class="section-title">📝 Description</h3>
        <div class="section-content">
          ${description || '<span class="text-muted">説明がありません</span>'}
        </div>
      </div>

      <!-- Rationale Section -->
      ${rationale ? `
      <div class="inspector-section">
        <h3 class="section-title">💡 Rationale</h3>
        <div class="section-content">
          ${rationale}
        </div>
      </div>
      ` : ''}

      <!-- Tags Section -->
      ${tags && tags.length > 0 ? `
      <div class="inspector-section">
        <h3 class="section-title">🏷️ Tags</h3>
        <div class="inspector-tags">
          ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Relations Section -->
      ${relations && (relations.parents?.length || relations.children?.length) ? `
      <div class="inspector-section">
        <h3 class="section-title">🔗 Relations</h3>
        ${relations.parents && relations.parents.length > 0 ? `
          <div class="relation-group">
            <div class="relation-label">親要求</div>
            <div class="relation-list">
              ${relations.parents.map(p => `
                <div class="relation-item parent" data-id="${p.id}">
                  <span class="relation-icon">↑</span>
                  <span class="relation-text">${p.id}: ${p.title}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        ${relations.children && relations.children.length > 0 ? `
          <div class="relation-group">
            <div class="relation-label">子要求</div>
            <div class="relation-list">
              ${relations.children.map(c => `
                <div class="relation-item child" data-id="${c.id}">
                  <span class="relation-icon">↓</span>
                  <span class="relation-text">${c.id}: ${c.title}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
      ` : ''}

      <!-- Timestamps -->
      ${createdAt || updatedAt ? `
      <div class="inspector-timestamps">
        ${createdAt ? `<div class="timestamp">作成: ${new Date(createdAt).toLocaleString('ja-JP')}</div>` : ''}
        ${updatedAt ? `<div class="timestamp">更新: ${new Date(updatedAt).toLocaleString('ja-JP')}</div>` : ''}
      </div>
      ` : ''}
    </div>

    <style>
      /* Inspector Container */
      .requirement-inspector {
        display: flex;
        flex-direction: column;
        gap: var(--space-lg);
      }

      /* Empty State */
      .inspector-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
        padding: var(--space-2xl);
      }

      .inspector-empty svg {
        margin-bottom: var(--space-xl);
        opacity: 0.6;
      }

      .inspector-empty h4 {
        margin: 0 0 var(--space-sm);
        font-size: var(--font-xl);
        font-weight: 600;
        color: var(--text-primary);
      }

      .inspector-empty p {
        margin: 0;
        font-size: var(--font-base);
        color: var(--text-secondary);
        line-height: 1.6;
      }

      /* Header */
      .inspector-header {
        padding-bottom: var(--space-lg);
        border-bottom: 1px solid var(--separator);
      }

      .inspector-category-badge {
        display: inline-block;
        padding: var(--space-xs) var(--space-md);
        border-radius: var(--radius-full);
        font-size: var(--font-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: var(--space-md);
      }

      .inspector-title {
        margin: 0 0 var(--space-sm);
        font-size: var(--font-2xl);
        font-weight: 700;
        color: var(--text-primary);
        letter-spacing: -0.5px;
        line-height: 1.2;
      }

      .inspector-id {
        font-family: 'SF Mono', 'Menlo', monospace;
        font-size: var(--font-sm);
        font-weight: 600;
        color: var(--text-tertiary);
        letter-spacing: 0.5px;
      }

      /* Meta Grid */
      .inspector-meta-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: var(--space-md);
      }

      .meta-card {
        background: var(--surface-muted);
        border-radius: var(--radius-lg);
        padding: var(--space-base);
        border: 1px solid var(--border);
        transition: all var(--duration-fast) var(--ease-out);
      }

      .meta-card:hover {
        border-color: var(--border-medium);
        transform: translateY(-2px);
        box-shadow: var(--shadow-sm);
      }

      .meta-label {
        font-size: var(--font-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-tertiary);
        margin-bottom: var(--space-xs);
      }

      .meta-value {
        font-size: var(--font-base);
        font-weight: 600;
        color: var(--text-primary);
      }

      .meta-value.status-approved {
        color: var(--success);
      }

      .meta-value.status-draft {
        color: var(--warning);
      }

      .meta-value.status-in_progress {
        color: var(--accent);
      }

      .meta-value.priority-critical,
      .meta-value.priority-high {
        color: var(--danger);
      }

      .meta-value.priority-medium {
        color: var(--warning);
      }

      .meta-value.priority-low {
        color: var(--text-secondary);
      }

      /* Quality Score */
      .meta-value.quality-score {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
      }

      .score-number {
        font-size: var(--font-xl);
        font-weight: 700;
      }

      .score-bar {
        height: 4px;
        background: var(--surface-pressed);
        border-radius: var(--radius-full);
        overflow: hidden;
      }

      .score-fill {
        height: 100%;
        border-radius: var(--radius-full);
        transition: width var(--duration-slow) var(--ease-out);
      }

      /* Sections */
      .inspector-section {
        padding: var(--space-lg);
        background: var(--surface-muted);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border);
      }

      .section-title {
        margin: 0 0 var(--space-md);
        font-size: var(--font-md);
        font-weight: 700;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      }

      .section-content {
        font-size: var(--font-base);
        color: var(--text-secondary);
        line-height: 1.6;
        white-space: pre-wrap;
      }

      .text-muted {
        font-style: italic;
        color: var(--text-tertiary);
      }

      /* Tags */
      .inspector-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-sm);
      }

      .tag {
        display: inline-block;
        padding: var(--space-xs) var(--space-md);
        background: var(--accent-subtle);
        color: var(--accent);
        border-radius: var(--radius-full);
        font-size: var(--font-sm);
        font-weight: 600;
        transition: all var(--duration-fast) var(--ease-out);
      }

      .tag:hover {
        background: var(--accent);
        color: white;
        transform: translateY(-1px);
      }

      /* Relations */
      .relation-group {
        margin-bottom: var(--space-lg);
      }

      .relation-group:last-child {
        margin-bottom: 0;
      }

      .relation-label {
        font-size: var(--font-sm);
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: var(--space-sm);
      }

      .relation-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
      }

      .relation-item {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        background: var(--surface);
        border-radius: var(--radius-md);
        border: 1px solid var(--border);
        cursor: pointer;
        transition: all var(--duration-fast) var(--ease-out);
      }

      .relation-item:hover {
        border-color: var(--accent);
        background: var(--accent-subtle);
        transform: translateX(4px);
      }

      .relation-icon {
        font-size: var(--font-lg);
        color: var(--text-tertiary);
      }

      .relation-item.parent .relation-icon {
        color: var(--stakeholder);
      }

      .relation-item.child .relation-icon {
        color: var(--functional);
      }

      .relation-text {
        font-size: var(--font-sm);
        color: var(--text-primary);
        flex: 1;
      }

      /* Timestamps */
      .inspector-timestamps {
        padding-top: var(--space-lg);
        border-top: 1px solid var(--separator);
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
      }

      .timestamp {
        font-size: var(--font-xs);
        color: var(--text-tertiary);
      }

      /* Animation */
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .requirement-inspector > * {
        animation: slideIn var(--duration-base) var(--ease-out);
      }

      .requirement-inspector > *:nth-child(1) { animation-delay: 0ms; }
      .requirement-inspector > *:nth-child(2) { animation-delay: 50ms; }
      .requirement-inspector > *:nth-child(3) { animation-delay: 100ms; }
      .requirement-inspector > *:nth-child(4) { animation-delay: 150ms; }
      .requirement-inspector > *:nth-child(5) { animation-delay: 200ms; }
    </style>
  `;
}

/**
 * Initializes inspector interactions (to be called after rendering)
 */
export function initInspectorInteractions(onRelationClick?: (id: string) => void) {
  document.querySelectorAll('.relation-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-id');
      if (id && onRelationClick) {
        onRelationClick(id);
      }
    });
  });
}
