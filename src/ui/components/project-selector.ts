/**
 * Project Selector Component - Apple-inspired dropdown
 * Allows switching between different requirement projects
 */

export interface Project {
  projectId: string;
  projectName: string;
  systemName?: string;
  description?: string;
  requirementCount: number;
  isCurrent: boolean;
}

export interface ProjectSelectorOptions {
  projects: Project[];
  currentProject: Project | null;
}

/**
 * Renders the project selector dropdown
 */
export function renderProjectSelector(options: ProjectSelectorOptions): string {
  const { projects, currentProject } = options;

  if (projects.length === 0) {
    return `
      <div class="project-selector-empty">
        <span style="font-size: 13px; color: var(--text-tertiary);">プロジェクトなし</span>
      </div>
    `;
  }

  const current = currentProject || projects[0];

  return `
    <div class="project-selector">
      <button class="project-selector-button" id="project-selector-btn" aria-label="プロジェクトを選択">
        <div class="project-selector-content">
          <div class="project-selector-icon">📁</div>
          <div class="project-selector-info">
            <div class="project-selector-name">${current.systemName || current.projectName}</div>
            <div class="project-selector-meta">${current.requirementCount} 要求</div>
          </div>
          <svg class="project-selector-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </button>

      <div class="project-selector-dropdown" id="project-dropdown" style="display: none;">
        <div class="project-dropdown-header">
          <span>プロジェクト一覧</span>
          <span class="project-count">${projects.length}件</span>
        </div>
        <div class="project-dropdown-list">
          ${projects.map(project => `
            <button
              class="project-dropdown-item ${project.isCurrent ? 'active' : ''}"
              data-project-id="${project.projectId}"
              aria-label="${project.projectName}を選択"
            >
              <div class="project-item-content">
                <div class="project-item-header">
                  <span class="project-item-name">${project.systemName || project.projectName}</span>
                  ${project.isCurrent ? '<span class="project-item-badge">現在</span>' : ''}
                </div>
                <div class="project-item-meta">
                  <span class="project-item-id">${project.projectId}</span>
                  <span class="project-item-sep">•</span>
                  <span class="project-item-count">${project.requirementCount} 要求</span>
                </div>
                ${project.description ? `
                  <div class="project-item-description">${project.description}</div>
                ` : ''}
              </div>
              ${project.isCurrent ? `
                <svg class="project-item-check" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              ` : ''}
            </button>
          `).join('')}
        </div>
      </div>
    </div>

    <style>
      /* Project Selector */
      .project-selector {
        position: relative;
        width: 100%;
      }

      .project-selector-button {
        width: 100%;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: var(--space-md);
        cursor: pointer;
        transition: all var(--duration-base) var(--ease-out);
        font-family: inherit;
      }

      .project-selector-button:hover {
        border-color: var(--border-medium);
        background: var(--surface-hover);
        box-shadow: var(--shadow-sm);
      }

      .project-selector-button:active {
        transform: scale(0.98);
      }

      .project-selector-content {
        display: flex;
        align-items: center;
        gap: var(--space-md);
      }

      .project-selector-icon {
        font-size: var(--font-xl);
        line-height: 1;
      }

      .project-selector-info {
        flex: 1;
        text-align: left;
        min-width: 0;
      }

      .project-selector-name {
        font-size: var(--font-base);
        font-weight: 600;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .project-selector-meta {
        font-size: var(--font-xs);
        color: var(--text-tertiary);
        margin-top: 2px;
      }

      .project-selector-chevron {
        flex-shrink: 0;
        color: var(--text-tertiary);
        transition: transform var(--duration-base) var(--ease-out);
      }

      .project-selector-button[aria-expanded="true"] .project-selector-chevron {
        transform: rotate(180deg);
      }

      /* Dropdown */
      .project-selector-dropdown {
        position: absolute;
        top: calc(100% + var(--space-sm));
        left: 0;
        right: 0;
        background: var(--surface-glass);
        backdrop-filter: var(--blur-lg);
        -webkit-backdrop-filter: var(--blur-lg);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-xl);
        z-index: 1000;
        max-height: 60vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: dropdownSlideIn var(--duration-base) var(--ease-out);
      }

      @keyframes dropdownSlideIn {
        from {
          opacity: 0;
          transform: translateY(-8px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .project-dropdown-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-md) var(--space-lg);
        border-bottom: 1px solid var(--separator);
        font-size: var(--font-sm);
        font-weight: 600;
        color: var(--text-secondary);
      }

      .project-count {
        font-size: var(--font-xs);
        color: var(--text-tertiary);
        background: var(--surface-muted);
        padding: 2px var(--space-sm);
        border-radius: var(--radius-sm);
      }

      .project-dropdown-list {
        overflow-y: auto;
        padding: var(--space-sm);
      }

      /* Dropdown Items */
      .project-dropdown-item {
        width: 100%;
        display: flex;
        align-items: flex-start;
        gap: var(--space-md);
        padding: var(--space-md);
        background: transparent;
        border: 1px solid transparent;
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--duration-fast) var(--ease-out);
        text-align: left;
        font-family: inherit;
        margin-bottom: var(--space-xs);
      }

      .project-dropdown-item:hover {
        background: var(--surface-hover);
        border-color: var(--border);
      }

      .project-dropdown-item.active {
        background: var(--accent-subtle);
        border-color: var(--accent);
      }

      .project-dropdown-item:active {
        transform: scale(0.98);
      }

      .project-item-content {
        flex: 1;
        min-width: 0;
      }

      .project-item-header {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        margin-bottom: var(--space-xs);
      }

      .project-item-name {
        font-size: var(--font-base);
        font-weight: 600;
        color: var(--text-primary);
      }

      .project-item-badge {
        font-size: var(--font-xs);
        font-weight: 700;
        color: var(--accent);
        background: var(--accent-subtle);
        padding: 2px var(--space-sm);
        border-radius: var(--radius-sm);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .project-item-meta {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        font-size: var(--font-xs);
        color: var(--text-tertiary);
        margin-bottom: var(--space-xs);
      }

      .project-item-id {
        font-family: 'SF Mono', 'Menlo', monospace;
        font-weight: 600;
      }

      .project-item-sep {
        opacity: 0.5;
      }

      .project-item-description {
        font-size: var(--font-sm);
        color: var(--text-secondary);
        line-height: 1.4;
        margin-top: var(--space-xs);
      }

      .project-item-check {
        flex-shrink: 0;
        color: var(--accent);
        margin-top: 2px;
      }

      /* Empty State */
      .project-selector-empty {
        padding: var(--space-md);
        text-align: center;
        color: var(--text-tertiary);
      }
    </style>
  `;
}

/**
 * Initializes project selector interactions
 */
export function initProjectSelectorInteractions(onProjectChange?: (projectId: string) => void) {
  const button = document.getElementById('project-selector-btn');
  const dropdown = document.getElementById('project-dropdown');

  if (!button || !dropdown) return;

  // Toggle dropdown
  button.addEventListener('click', () => {
    const isOpen = dropdown.style.display === 'block';
    dropdown.style.display = isOpen ? 'none' : 'block';
    button.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!button.contains(e.target as Node) && !dropdown.contains(e.target as Node)) {
      dropdown.style.display = 'none';
      button.setAttribute('aria-expanded', 'false');
    }
  });

  // Handle project selection
  document.querySelectorAll('.project-dropdown-item').forEach(item => {
    item.addEventListener('click', async function() {
      const projectId = this.getAttribute('data-project-id');
      if (!projectId) return;

      // Close dropdown
      dropdown.style.display = 'none';
      button.setAttribute('aria-expanded', 'false');

      // Show loading state
      const buttonContent = button.querySelector('.project-selector-name');
      if (buttonContent) {
        const originalText = buttonContent.textContent;
        buttonContent.textContent = '切り替え中...';

        try {
          // Switch project via API
          const response = await fetch('/api/project/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId })
          });

          if (response.ok) {
            // Reload page to reflect new project
            if (onProjectChange) {
              onProjectChange(projectId);
            } else {
              window.location.reload();
            }
          } else {
            buttonContent.textContent = originalText;
            alert('プロジェクトの切り替えに失敗しました');
          }
        } catch (error) {
          buttonContent.textContent = originalText;
          console.error('Project switch failed:', error);
          alert('プロジェクトの切り替えに失敗しました');
        }
      }
    });
  });
}
