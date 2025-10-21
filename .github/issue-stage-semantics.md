### 概要

段階別セマンティクスのカスタマイズ機能を実装する。現在、すべての要求が同じ属性セットを持つが、ステークホルダ要求・システム要求・システム機能要求では必要な属性が異なるべきである。

### 目的

- **段階別属性**: 各段階で異なる属性セットを定義
- **柔軟なバリデーション**: 段階に応じた必須フィールドとルール
- **テンプレート機能**: 段階別の要求作成テンプレート

### 現状の問題

```typescript
// すべての要求が同じ属性セット
interface Requirement {
  id: string;
  title: string;
  description: string;
  type: "stakeholder" | "system" | "functional";
  // ... すべての段階で同じフィールド
}
```

**問題点**:
- ステークホルダ要求に技術的詳細が不要なのに同じフィールド
- システム機能要求に必要な実装ヒントがオプション扱い
- 段階別の必須フィールドが定義できない
- 段階固有の属性が追加できない

### REQUIREMENTS-PRINCIPLES.mdとの関連

**原則**: セマンティクス - 属性のカスタマイズ
> 属性は特に要求の段階によってカスタマイズされる。各段階（ステークホルダ要求、システム要求、システム機能要求）に応じた属性セット。

**原則**: 可変性 - セマンティクスの可変性
> セマンティクスは可変である。属性セットの追加・変更・削除が可能。プロジェクト固有の属性定義が可能。

### 実装内容

#### 1. セマンティクス定義ファイル

```json
// config/semantics-schema.json
{
  "stageAttributes": {
    "stakeholder": {
      "fields": [
        {
          "name": "stakeholder_role",
          "type": "string",
          "required": true,
          "description": "ステークホルダの役割（例: エンドユーザー、管理者）"
        },
        {
          "name": "business_value",
          "type": "string",
          "required": true,
          "description": "ビジネス価値の説明"
        },
        {
          "name": "acceptance_criteria",
          "type": "string[]",
          "required": false,
          "description": "受け入れ基準"
        }
      ],
      "template": {
        "title": "[ステークホルダ役割]は[行動]できる",
        "description": "## 背景\n\n## 価値\n\n## 受け入れ基準\n"
      }
    },
    "system": {
      "fields": [
        {
          "name": "functional_category",
          "type": "enum",
          "required": true,
          "values": ["input", "output", "processing", "storage"],
          "description": "機能カテゴリ"
        },
        {
          "name": "non_functional_attributes",
          "type": "object",
          "required": false,
          "properties": {
            "performance": "string",
            "security": "string",
            "availability": "string"
          }
        }
      ],
      "template": {
        "title": "システムは[機能]を提供する",
        "description": "## 機能概要\n\n## 入出力\n\n## 制約条件\n"
      }
    },
    "functional": {
      "fields": [
        {
          "name": "architecture_layer",
          "type": "enum",
          "required": true,
          "values": ["presentation", "application", "domain", "infrastructure"],
          "description": "アーキテクチャ層"
        },
        {
          "name": "implementation_hints",
          "type": "string[]",
          "required": false,
          "description": "実装ヒント"
        },
        {
          "name": "api_specification",
          "type": "object",
          "required": false,
          "description": "API仕様"
        }
      ],
      "template": {
        "title": "[コンポーネント]は[機能]を実装する",
        "description": "## 詳細仕様\n\n## インターフェース\n\n## 実装考慮事項\n"
      }
    }
  },
  "validationRules": {
    "stakeholder": {
      "titlePattern": "^.*できる$",
      "descriptionMinLength": 50
    },
    "system": {
      "titlePattern": "^システムは.*を提供する$",
      "descriptionMinLength": 100
    },
    "functional": {
      "titlePattern": "^.*を実装する$",
      "descriptionMinLength": 150
    }
  }
}
```

#### 2. SemanticsManager クラス

```typescript
// src/semantics/semantics-manager.ts
export class SemanticsManager {
  constructor(private schema: SemanticsSchema) {}

  getRequiredFields(stage: string): FieldDefinition[]
  getOptionalFields(stage: string): FieldDefinition[]
  getTemplate(stage: string): Template
  validateField(stage: string, fieldName: string, value: any): Result<void, string>
  getValidationRules(stage: string): ValidationRules
}
```

#### 3. 段階別バリデーター

```typescript
// src/validation/stage-validator.ts
export class StageValidator {
  async validateRequirement(req: Requirement): Promise<ValidationResult> {
    const semantics = this.semanticsManager.getRequiredFields(req.type);

    // 段階別必須フィールドのチェック
    for (const field of semantics) {
      if (field.required && !req[field.name]) {
        violations.push({
          code: 'MISSING_STAGE_FIELD',
          field: field.name,
          message: `段階 ${req.type} では ${field.name} が必須です`
        });
      }
    }

    // 段階別バリデーションルール
    const rules = this.semanticsManager.getValidationRules(req.type);
    // ...
  }
}
```

#### 4. テンプレート機能

```typescript
// MCPツール: create_requirement_from_template
{
  name: "create_requirement_from_template",
  description: "段階に応じたテンプレートから要求を作成",
  inputSchema: {
    type: "object",
    properties: {
      stage: { type: "string", enum: ["stakeholder", "system", "functional"] }
    }
  }
}
```

### 受け入れ基準

- [ ] SemanticsSchema型定義の作成
- [ ] semantics-schema.json のデフォルト定義
- [ ] SemanticsManager クラスの実装
- [ ] StageValidator の実装
- [ ] テンプレート機能の実装
- [ ] MCPツールへの統合
- [ ] 既存データの移行スクリプト
- [ ] ユニットテストの追加
- [ ] ドキュメント更新

### 使用例

```typescript
// ステークホルダ要求の作成
const stakeholderReq = await createFromTemplate("stakeholder", {
  stakeholder_role: "エンドユーザー",
  business_value: "商品を素早く検索できることで購入体験が向上"
});

// システム機能要求の作成
const functionalReq = await createFromTemplate("functional", {
  architecture_layer: "application",
  implementation_hints: ["Elasticsearchを使用", "非同期処理"]
});
```

### 技術的考慮事項

- **後方互換性**: 既存要求への段階別属性の適用
- **バリデーション**: セマンティクス定義の妥当性検証
- **UI連携**: Webビューアーでの段階別フォーム表示
- **マイグレーション**: 既存データの段階別属性追加

### 関連ドキュメント

- [REQUIREMENTS-PRINCIPLES.md](../REQUIREMENTS-PRINCIPLES.md) - セマンティクス、可変性
- [PRINCIPLES-COMPLIANCE-ANALYSIS.md](../PRINCIPLES-COMPLIANCE-ANALYSIS.md) - Gap-2
- Issue #12 (Phase 4 - 設定管理の外部化) と統合

**Labels**: `enhancement`, `phase-1`, `semantics`, `architecture`
**Priority**: High
**Estimate**: 5-7 days
