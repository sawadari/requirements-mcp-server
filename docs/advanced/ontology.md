# オントロジーガイド

## 概要

requirements-mcp-serverは、プロジェクトやドメインに応じてカスタマイズ可能なオントロジー（要求の段階定義）をサポートしています。

## オントロジーとは

オントロジーは、要求管理における以下を定義します：

1. **要求の段階（Stages）**: ステークホルダ要求、システム要求、システム機能要求など
2. **派生ルール（Derivation Rules）**: どの段階からどの段階へ詳細化できるか
3. **粒度ルール（Granularity Rules）**: 各段階での文章長や抽象度の制約
4. **バリデーションルール（Validation Rules）**: 各段階で必須・オプション・禁止フィールド

## デフォルトオントロジー

`config/ontology-schema.json` がデフォルトのオントロジーです。

### 段階定義

1. **ステークホルダ要求** (stakeholder)
   - レベル: 1（最上位）
   - 抽象度: 高
   - 子段階: システム要求

2. **システム要求** (system)
   - レベル: 2（中間）
   - 抽象度: 中
   - 親段階: ステークホルダ要求
   - 子段階: システム機能要求

3. **システム機能要求** (functional)
   - レベル: 3（最下位）
   - 抽象度: 低
   - 親段階: システム要求

## カスタムオントロジーの使用

### 1. 組込みシステム向けオントロジー

`config/ontology-embedded-system.json` を使用：

```bash
export ONTOLOGY_SCHEMA_PATH=./config/ontology-embedded-system.json
npm start
```

#### 段階定義
- **ミッション要求** → **能力要求** → **サブシステム要求** → **コンポーネント要求**

### 2. Web/AIシステム向けオントロジー

`config/ontology-web-ai.json` を使用：

```bash
export ONTOLOGY_SCHEMA_PATH=./config/ontology-web-ai.json
npm start
```

#### 段階定義
- **ユーザーストーリー** → **フィーチャー** → **API仕様/モデル仕様** → **実装要求**

## カスタムオントロジーの作成

### スキーマ構造

```json
{
  "version": "1.0.0",
  "stages": [
    {
      "id": "stage_id",
      "name": "段階名",
      "description": "段階の説明",
      "level": 1,
      "abstractionLevel": "high|medium|low",
      "canHaveChildren": true,
      "canHaveParent": false,
      "parentStages": [],
      "childStages": ["child_stage_id"],
      "color": "#4CAF50",
      "icon": "👥"
    }
  ],
  "derivationRules": {
    "stage_id": {
      "allowedChildren": ["child_stage_id"],
      "meceRequired": true,
      "description": "派生ルールの説明"
    }
  },
  "granularityRules": {
    "stage_id": {
      "descriptionLength": { "min": 50, "max": 300, "recommended": 150 },
      "titleLength": { "min": 10, "max": 80, "recommended": 40 },
      "abstractionScore": { "min": 0.6, "max": 1.0, "recommended": 0.8 }
    }
  },
  "validationRules": {
    "global": {
      "maxDepth": 10,
      "allowCycles": false,
      "requireUniqueIds": true
    },
    "byStage": {
      "stage_id": {
        "requiredFields": ["title", "description", "priority"],
        "optionalFields": ["author", "tags"],
        "forbiddenFields": ["implementation_hints"]
      }
    }
  }
}
```

### フィールド説明

#### Stage Definition

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | string | 段階の一意識別子 |
| `name` | string | 段階の表示名 |
| `description` | string | 段階の説明 |
| `level` | number | 階層レベル（1が最上位） |
| `abstractionLevel` | string | 抽象度（high/medium/low） |
| `canHaveChildren` | boolean | 子要求を持てるか |
| `canHaveParent` | boolean | 親要求を持てるか |
| `parentStages` | string[] | 許可される親段階のID |
| `childStages` | string[] | 許可される子段階のID |
| `color` | string | UIでの表示色（オプション） |
| `icon` | string | UIでのアイコン（オプション） |

#### Derivation Rules

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `allowedChildren` | string[] | 許可される子段階 |
| `meceRequired` | boolean | MECE原則が必須か |
| `description` | string | ルールの説明 |

#### Granularity Rules

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `descriptionLength` | object | 説明文の長さ制約（min/max/recommended） |
| `titleLength` | object | タイトルの長さ制約 |
| `abstractionScore` | object | 抽象度スコア制約（0.0=具体的、1.0=抽象的） |

#### Validation Rules

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `global.maxDepth` | number | 最大階層深度 |
| `global.allowCycles` | boolean | 循環参照を許可するか |
| `global.requireUniqueIds` | boolean | 一意なIDが必要か |
| `byStage.<stage_id>.requiredFields` | string[] | 必須フィールド |
| `byStage.<stage_id>.optionalFields` | string[] | オプショナルフィールド |
| `byStage.<stage_id>.forbiddenFields` | string[] | 禁止フィールド |

## プログラム内での使用

### オントロジーのロード

```typescript
import { OntologyLoader } from './src/ontology/index.js';

// デフォルトオントロジーをロード
const ontology = await OntologyLoader.loadDefault();

// カスタムオントロジーをロード
const customOntology = await OntologyLoader.loadFromFile('./config/ontology-embedded-system.json');

// 環境変数で指定されたオントロジーをロード
const envOntology = await OntologyLoader.loadFromEnvironment();
```

### オントロジーの使用

```typescript
import { OntologyManager } from './src/ontology/index.js';

// 段階情報を取得
const stage = ontology.getStageInfo('stakeholder');
console.log(stage.name); // "ステークホルダ要求"

// 許可される子段階を取得
const children = ontology.getAllowedChildStages('stakeholder');
console.log(children); // ["system"]

// 派生の妥当性を検証
const isValid = ontology.validateDerivation('stakeholder', 'system');
console.log(isValid); // true

// 粒度ルールを取得
const granularity = ontology.getGranularityRules('stakeholder');
console.log(granularity.descriptionLength.recommended); // 150
```

## ベストプラクティス

### 1. 段階数の決定

- **シンプルなプロジェクト**: 3段階（ユーザー要求 → システム要求 → 実装要求）
- **標準的なプロジェクト**: 3-4段階（デフォルトオントロジー）
- **大規模プロジェクト**: 4-5段階（組込みシステムオントロジー）

### 2. MECE原則の適用

- 上位段階では `meceRequired: true` を推奨
- 最下層では `meceRequired: false` でも可

### 3. 粒度ルールの設定

- 各段階で推奨される文章長を定義
- 下位段階ほど詳細（長い）にする
- 抽象度スコアは上位段階ほど高く（0.7-1.0）、下位段階ほど低く（0.0-0.3）

### 4. バリデーションルールの設定

- 上位段階では技術的詳細を禁止（`forbiddenFields`）
- 下位段階では実装ヒントを許可
- 必須フィールドは最小限に

## トラブルシューティング

### オントロジーのバリデーションエラー

```typescript
const validation = ontology.validateSchema();
if (!validation.valid) {
  console.error('Invalid ontology:', validation.errors);
}
```

### 利用可能なオントロジーの確認

```typescript
const available = await OntologyLoader.listAvailable('./config');
console.log('Available ontologies:', available);
```

## 関連ドキュメント

- [REQUIREMENTS-PRINCIPLES.md](./REQUIREMENTS-PRINCIPLES.md) - 要求管理の基本原則
- [ARCHITECTURE.md](./ARCHITECTURE.md) - システムアーキテクチャ
- [PRINCIPLES-COMPLIANCE-ANALYSIS.md](./PRINCIPLES-COMPLIANCE-ANALYSIS.md) - 準拠性分析

---

最終更新: 2025-10-21
バージョン: 1.0.0
