### 概要

オントロジーの外部定義とカスタマイズ機能を実装する。現在、要求の段階（ステークホルダ要求・システム要求・システム機能要求）がハードコーディングされており、プロジェクトやドメインに応じたカスタマイズができない。

### 目的

- **オントロジーの可変性**: プロジェクトごとに要求の段階を定義可能に
- **ドメイン適応**: 異なるドメイン（Web、組込み、AI等）への柔軟な適用
- **再利用性の向上**: オントロジー定義の共有と再利用

### 現状の問題

```typescript
// src/types.ts - ハードコーディングされた段階
type: "stakeholder" | "system" | "functional"
```

**問題点**:
- 要求の段階が固定
- プロジェクト固有のオントロジーが定義できない
- 段階の追加・削除ができない
- ドメイン特有の階層構造に対応できない

### REQUIREMENTS-PRINCIPLES.mdとの関連

**原則**: 可変性 - オントロジーの可変性
> オントロジーは可変である。プロジェクトやドメインに応じて調整可能。要求の段階や階層構造をカスタマイズ可能。

**運用シチュエーション**: 初期設定
> 特定システムについて、オントロジーとセマンティクスが定義される。

### 実装内容

#### 1. オントロジー定義ファイル

```json
// config/ontology-schema.json
{
  "stages": [
    {
      "id": "stakeholder",
      "name": "ステークホルダ要求",
      "description": "システムを利用するステークホルダのニーズ",
      "level": 1,
      "abstractionLevel": "high",
      "canHaveChildren": true,
      "parentStages": []
    },
    {
      "id": "system",
      "name": "システム要求",
      "description": "システムをブラックボックスとしてみたときの要求",
      "level": 2,
      "abstractionLevel": "medium",
      "canHaveChildren": true,
      "parentStages": ["stakeholder"]
    },
    {
      "id": "functional",
      "name": "システム機能要求",
      "description": "システムをホワイトボックスとしてみたときの要求",
      "level": 3,
      "abstractionLevel": "low",
      "canHaveChildren": true,
      "parentStages": ["system"]
    }
  ],
  "derivationRules": {
    "stakeholder": ["system"],
    "system": ["functional"],
    "functional": []
  },
  "granularityRules": {
    "descriptionLength": {
      "stakeholder": { "min": 50, "max": 300 },
      "system": { "min": 100, "max": 500 },
      "functional": { "min": 150, "max": 800 }
    }
  }
}
```

#### 2. OntologyManager クラス

```typescript
// src/ontology/ontology-manager.ts
export class OntologyManager {
  constructor(private schema: OntologySchema) {}

  validateStage(type: string): boolean
  getStageInfo(type: string): StageDefinition
  getAllowedParentStages(type: string): string[]
  getAllowedChildStages(type: string): string[]
  validateDerivation(parentType: string, childType: string): boolean
  getGranularityRules(type: string): GranularityRules
}
```

#### 3. 既存コードの統合

- `src/types.ts`: 動的な型定義に変更
- `src/validation/structure-validator.ts`: オントロジールールを参照
- `src/validation/mece-validator.ts`: 段階別ルールを適用
- MCPツール: 利用可能な段階を動的に取得

#### 4. カスタムオントロジーの例

```json
// config/ontology-embedded-system.json
{
  "stages": [
    {
      "id": "mission",
      "name": "ミッション要求",
      "level": 1
    },
    {
      "id": "capability",
      "name": "能力要求",
      "level": 2,
      "parentStages": ["mission"]
    },
    {
      "id": "subsystem",
      "name": "サブシステム要求",
      "level": 3,
      "parentStages": ["capability"]
    },
    {
      "id": "component",
      "name": "コンポーネント要求",
      "level": 4,
      "parentStages": ["subsystem"]
    }
  ]
}
```

### 受け入れ基準

- [ ] OntologySchema型定義の作成
- [ ] ontology-schema.json のデフォルト定義
- [ ] OntologyManager クラスの実装
- [ ] バリデーターのオントロジー統合
- [ ] MCPツールでの段階動的取得
- [ ] カスタムオントロジーの例（組込み、AI、Web）
- [ ] ユニットテストの追加
- [ ] ドキュメント更新

### 技術的考慮事項

- **後方互換性**: 既存データの移行戦略
- **バリデーション**: オントロジー定義自体の妥当性検証
- **パフォーマンス**: オントロジーのキャッシング
- **設定切り替え**: プロジェクトごとのオントロジー選択

### 関連ドキュメント

- [REQUIREMENTS-PRINCIPLES.md](../REQUIREMENTS-PRINCIPLES.md) - オントロジー、可変性
- [PRINCIPLES-COMPLIANCE-ANALYSIS.md](../PRINCIPLES-COMPLIANCE-ANALYSIS.md) - Gap-1

**Labels**: `enhancement`, `phase-1`, `ontology`, `architecture`
**Priority**: High
**Estimate**: 5-7 days
