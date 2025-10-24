# 複数プロジェクト対応 - Multi-Project Support

## 概要

現在単一ファイル（`data/requirements.json`）で管理している要求を、複数のプロジェクトファイルで管理できるように拡張する。

## 背景

### 現状の課題

- 全ての要求が1つのファイル（`data/requirements.json`）に保存されている
- 複数のシステム開発プロジェクトを並行管理できない
- プロジェクトごとの要求分離ができない
- プロジェクト間の切り替えができない

### 想定されるユースケース

1. **複数システムの開発**
   - システムA: `data/system-a.json`
   - システムB: `data/system-b.json`
   - システムC: `data/system-c.json`

2. **プロジェクトフェーズごとの管理**
   - フェーズ1: `data/phase1-requirements.json`
   - フェーズ2: `data/phase2-requirements.json`

3. **開発環境ごとの管理**
   - 本番: `data/production-requirements.json`
   - ステージング: `data/staging-requirements.json`
   - 開発: `data/development-requirements.json`

## 目的

1. **複数プロジェクトの管理**: 異なるプロジェクトの要求を個別のファイルで管理
2. **プロジェクト切り替え**: MCPツールで現在の対象プロジェクトを切り替え
3. **現在プロジェクトの確認**: どのプロジェクトを操作中か常に把握可能
4. **Webビューアー連動**: プロジェクト切り替え時にビューアーが自動更新
5. **後方互換性**: 既存の `requirements.json` も引き続き利用可能

## 要求仕様

### 1. ファイル命名規則

**パターン1: システム名ベース**
```
data/
├── requirements.json          # デフォルト（後方互換性）
├── system-a.json              # システムA
├── system-b.json              # システムB
└── mobile-app.json            # モバイルアプリ
```

**パターン2: プロジェクトコードベース**
```
data/
├── requirements.json          # デフォルト
├── proj-001.json              # プロジェクト001
├── proj-002.json              # プロジェクト002
└── proj-alpha.json            # プロジェクトAlpha
```

**命名ルール**:
- 拡張子: `.json` (固定)
- ファイル名: `[a-z0-9-]+\.json` (英小文字・数字・ハイフンのみ)
- デフォルト: `requirements.json`

### 2. プロジェクトメタデータ

各プロジェクトファイルに以下のメタデータを含める:

```json
{
  "_metadata": {
    "projectName": "System A",
    "projectId": "system-a",
    "description": "システムAの要求管理",
    "createdAt": "2025-10-24T12:00:00Z",
    "updatedAt": "2025-10-24T15:30:00Z",
    "version": "1.0.0",
    "requirementCount": 39
  },
  "requirements": {
    "STK-001": { ... },
    "SYS-001": { ... }
  }
}
```

### 3. 新規MCPツール

#### カテゴリ: `project_management`（新規）

##### 3.1 `list_projects`

プロジェクト一覧を取得

**入力**:
```json
{}
```

**出力**:
```json
{
  "projects": [
    {
      "projectId": "requirements",
      "projectName": "Default Project",
      "filePath": "data/requirements.json",
      "requirementCount": 39,
      "lastUpdated": "2025-10-24T15:30:00Z",
      "isCurrent": true
    },
    {
      "projectId": "system-a",
      "projectName": "System A",
      "filePath": "data/system-a.json",
      "requirementCount": 25,
      "lastUpdated": "2025-10-23T10:00:00Z",
      "isCurrent": false
    }
  ],
  "currentProject": "requirements"
}
```

##### 3.2 `get_current_project`

現在のプロジェクト情報を取得

**入力**:
```json
{}
```

**出力**:
```json
{
  "projectId": "system-a",
  "projectName": "System A",
  "filePath": "data/system-a.json",
  "description": "システムAの要求管理",
  "requirementCount": 25,
  "lastUpdated": "2025-10-23T10:00:00Z",
  "createdAt": "2025-10-01T09:00:00Z",
  "version": "1.0.0"
}
```

##### 3.3 `switch_project`

プロジェクトを切り替え

**入力**:
```json
{
  "projectId": "system-a"
}
```

**出力**:
```json
{
  "success": true,
  "previousProject": "requirements",
  "currentProject": "system-a",
  "projectName": "System A",
  "requirementCount": 25,
  "message": "プロジェクトを 'System A' に切り替えました"
}
```

**エラー例**:
```json
{
  "success": false,
  "error": "Project 'unknown-project' not found",
  "availableProjects": ["requirements", "system-a", "system-b"]
}
```

##### 3.4 `create_project`

新規プロジェクトを作成

**入力**:
```json
{
  "projectId": "system-b",
  "projectName": "System B",
  "description": "システムBの要求管理",
  "copyFrom": "requirements"  // optional: 既存プロジェクトからコピー
}
```

**出力**:
```json
{
  "success": true,
  "projectId": "system-b",
  "projectName": "System B",
  "filePath": "data/system-b.json",
  "requirementCount": 0,
  "message": "プロジェクト 'System B' を作成しました"
}
```

##### 3.5 `delete_project`

プロジェクトを削除

**入力**:
```json
{
  "projectId": "system-b",
  "confirm": true  // 安全のため必須
}
```

**出力**:
```json
{
  "success": true,
  "deletedProject": "system-b",
  "message": "プロジェクト 'system-b' を削除しました"
}
```

**注意**: デフォルトプロジェクト（`requirements`）は削除不可

### 4. 内部実装

#### 4.1 ProjectManager クラス

```typescript
class ProjectManager {
  private currentProject: string = 'requirements';
  private projectCache: Map<string, ProjectMetadata>;

  // プロジェクト一覧取得
  async listProjects(): Promise<ProjectInfo[]>

  // 現在のプロジェクト取得
  getCurrentProject(): ProjectInfo

  // プロジェクト切り替え
  async switchProject(projectId: string): Promise<void>

  // プロジェクト作成
  async createProject(config: ProjectConfig): Promise<ProjectInfo>

  // プロジェクト削除
  async deleteProject(projectId: string): Promise<void>

  // プロジェクトファイルパス取得
  getProjectFilePath(projectId: string): string
}
```

#### 4.2 RequirementsStorage の拡張

```typescript
class RequirementsStorage {
  private projectManager: ProjectManager;

  constructor(dataDir: string, projectId?: string) {
    this.projectManager = new ProjectManager(dataDir);
    if (projectId) {
      this.projectManager.switchProject(projectId);
    }
  }

  // 現在のプロジェクトのファイルパスを使用
  private getFilePath(): string {
    return this.projectManager.getCurrentProjectFilePath();
  }

  // ... 既存メソッドは変更なし（内部でgetFilePath()を使用）
}
```

### 5. Webビューアー対応

#### 5.1 プロジェクト選択UI

ヘッダーにプロジェクトセレクタを追加:

```html
<header>
  <h1>要求管理ビューアー</h1>
  <div class="project-selector">
    <label>プロジェクト:</label>
    <select id="projectSelect">
      <option value="requirements" selected>Default Project (39)</option>
      <option value="system-a">System A (25)</option>
      <option value="system-b">System B (12)</option>
    </select>
    <span class="project-badge">現在: Default Project</span>
  </div>
</header>
```

#### 5.2 プロジェクト切り替え時の動作

1. ユーザーがプロジェクトを選択
2. `/api/project/switch` にPOSTリクエスト
3. サーバー側でプロジェクト切り替え
4. WebSocket経由でクライアントに通知
5. クライアントがデータを再読み込み
6. ビューが更新される

#### 5.3 新規APIエンドポイント

```typescript
// プロジェクト一覧取得
app.get('/api/projects', async (req, res) => {
  const projects = await projectManager.listProjects();
  res.json(projects);
});

// 現在のプロジェクト取得
app.get('/api/project/current', async (req, res) => {
  const current = projectManager.getCurrentProject();
  res.json(current);
});

// プロジェクト切り替え
app.post('/api/project/switch', async (req, res) => {
  const { projectId } = req.body;
  await projectManager.switchProject(projectId);

  // WebSocketで全クライアントに通知
  wss.clients.forEach(client => {
    client.send(JSON.stringify({
      type: 'project-switched',
      projectId,
      projectName: projectManager.getCurrentProject().projectName
    }));
  });

  res.json({ success: true });
});

// プロジェクト作成
app.post('/api/project/create', async (req, res) => {
  const project = await projectManager.createProject(req.body);
  res.json(project);
});

// プロジェクト削除
app.delete('/api/project/:projectId', async (req, res) => {
  await projectManager.deleteProject(req.params.projectId);
  res.json({ success: true });
});
```

#### 5.4 WebSocket通知

プロジェクト切り替え時に全クライアントに通知:

```javascript
// クライアント側
const ws = new WebSocket('ws://localhost:5002');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'project-switched') {
    console.log(`プロジェクトが ${data.projectName} に切り替わりました`);
    reloadAllData(); // 全データを再読み込み
  }
};
```

### 6. 後方互換性

#### 6.1 既存コードの動作保証

- デフォルトプロジェクト（`requirements`）は常に存在
- `projectId` 未指定時は `requirements` を使用
- 既存の `data/requirements.json` は自動的に `requirements` プロジェクトとして認識

#### 6.2 マイグレーション不要

- 既存のファイルはそのまま使用可能
- メタデータがない場合は自動生成

### 7. Tool Registry 更新

新規カテゴリ `project_management` を追加:

```json
{
  "categories": {
    "project_management": {
      "name": "Project Management",
      "description": "プロジェクト管理・切り替え",
      "tools": [
        "list_projects",
        "get_current_project",
        "switch_project",
        "create_project",
        "delete_project"
      ]
    }
  }
}
```

## 実装フェーズ

### Phase 1: 基盤実装（P1-High）

- [ ] `ProjectManager` クラス実装
- [ ] `RequirementsStorage` の拡張
- [ ] プロジェクトメタデータの定義
- [ ] ファイル命名規則の実装

**推定時間**: 6-8時間

### Phase 2: MCPツール実装（P1-High）

- [ ] `list_projects` 実装
- [ ] `get_current_project` 実装
- [ ] `switch_project` 実装
- [ ] `create_project` 実装
- [ ] `delete_project` 実装
- [ ] Tool Registry 更新

**推定時間**: 8-10時間

### Phase 3: Webビューアー対応（P2-Medium）

- [ ] プロジェクト選択UIの追加
- [ ] APIエンドポイントの実装
- [ ] WebSocket通知の実装
- [ ] プロジェクト切り替え時の再読み込み
- [ ] 現在プロジェクトの表示

**推定時間**: 6-8時間

### Phase 4: テスト & ドキュメント（P1-High）

- [ ] 5つのMCPツールのテスト作成（TDD）
- [ ] プロジェクト切り替えの統合テスト
- [ ] 後方互換性のテスト
- [ ] ドキュメント作成
- [ ] 使用例の追加

**推定時間**: 10-12時間

**合計推定時間**: 30-38時間

## 受け入れ基準

### 機能要件

- [ ] 複数のプロジェクトファイルを管理できる
- [ ] MCPツールでプロジェクトを切り替えられる
- [ ] Webビューアーでプロジェクトを選択できる
- [ ] プロジェクト切り替え時にビューアーが自動更新される
- [ ] 現在のプロジェクトが常に表示される
- [ ] 新規プロジェクトを作成できる
- [ ] プロジェクトを削除できる（デフォルト以外）
- [ ] プロジェクト一覧を取得できる

### 品質要件

- [ ] 5つの新規ツール全てにテストが存在
- [ ] テストカバレッジ90%以上
- [ ] 後方互換性が保たれている（既存の `requirements.json` が動作）
- [ ] エラーハンドリングが適切（存在しないプロジェクトなど）
- [ ] Tool Registry が更新されている

### ドキュメント要件

- [ ] 各MCPツールの使用例が存在
- [ ] Webビューアーの使い方が説明されている
- [ ] プロジェクト命名規則が明記されている
- [ ] マイグレーションガイドが提供されている（必要に応じて）

## 技術的考慮事項

### 1. 並行性制御

- プロジェクト切り替え中の操作をどう扱うか
- 複数ユーザーが異なるプロジェクトに切り替えた場合

**提案**: セッション単位でプロジェクトを管理（将来の拡張）

### 2. パフォーマンス

- プロジェクトファイルのキャッシュ
- 大量のプロジェクトファイルがある場合の一覧取得

**提案**: プロジェクトメタデータのキャッシュ実装

### 3. データ移行

- 既存プロジェクトから新規プロジェクトへの要求コピー
- プロジェクト間での要求移動

**提案**: `copyFrom` オプションで対応

### 4. セキュリティ

- プロジェクトファイルへの不正アクセス防止
- ファイル名のバリデーション

**提案**: ファイル名の厳格なバリデーション実装

## 関連Issue

- Issue #19: Phase 1.3 - 既存16ツールのテスト作成（TDD統合）
- 新規カテゴリ `project_management` のため、既存ツールとの重複なし

## 参考資料

- [docs/TDD-TOOL-DEVELOPMENT.md](../docs/TDD-TOOL-DEVELOPMENT.md) - TDD開発ガイド
- [docs/MCP-TOOL-MANAGEMENT.md](../docs/MCP-TOOL-MANAGEMENT.md) - Tool Management
- [config/tool-registry.json](../config/tool-registry.json) - Tool Registry

## 備考

- この機能は **新規カテゴリ** のため、既存ツールとの重複はありません
- TDD開発フローに従って実装します（テストファースト）
- 後方互換性を重視し、既存ユーザーへの影響を最小限にします
