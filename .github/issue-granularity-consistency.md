### 概要

粒度の一貫性検証機能を実装する。同一段階内の要求において、文章の長さと抽象度の粒度が揃っているかを自動的に検証し、品質のばらつきを防ぐ。

### 目的

- **粒度の統一**: 同一段階内での文章長と抽象度の統一
- **品質の向上**: 要求の記述品質のばらつき削減
- **レビュー効率化**: 自動検証によるレビュー負荷の軽減

### 現状の問題

```typescript
// 同一段階内で粒度がばらばら
{
  id: "REQ-001",
  type: "system",
  description: "検索機能" // 短すぎる
},
{
  id: "REQ-002",
  type: "system",
  description: "システムは商品データベースに対して全文検索を実行し、検索クエリに合致する商品のリストをレスポンスタイム1秒以内で返却する。検索結果は関連度順にソートされ、ページングをサポートし..." // 詳細すぎる
}
```

**問題点**:
- 文章の長さが統一されていない
- 抽象度がばらばら（概略レベルと詳細レベルが混在）
- 兄弟要求間の粒度比較が行われていない
- レビュー時に手動で確認する必要がある

### REQUIREMENTS-PRINCIPLES.mdとの関連

**原則**: オントロジー - 粒度の一貫性
> 要求の段階にある要求は、その文章の長さ、抽象度という粒度が揃っていること。

### 実装内容

#### 1. GranularityValidator クラス

```typescript
// src/validation/granularity-validator.ts
export class GranularityValidator {
  /**
   * 兄弟要求の粒度一貫性を検証
   */
  async validateSiblingGranularity(
    req: Requirement,
    siblings: Requirement[]
  ): Promise<ValidationResult> {
    const violations: Violation[] = [];

    // 1. 文章の長さの一貫性
    const lengthResult = this.validateDescriptionLength(req, siblings);
    violations.push(...lengthResult.violations);

    // 2. 抽象度の一貫性
    const abstractionResult = await this.validateAbstractionLevel(req, siblings);
    violations.push(...abstractionResult.violations);

    // 3. 詳細度の一貫性
    const detailResult = this.validateDetailLevel(req, siblings);
    violations.push(...detailResult.violations);

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * 文章の長さの一貫性を検証
   */
  private validateDescriptionLength(
    req: Requirement,
    siblings: Requirement[]
  ): ValidationResult {
    const lengths = siblings.map(s => s.description.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const stdDev = this.calculateStdDev(lengths, avgLength);

    const reqLength = req.description.length;
    const deviation = Math.abs(reqLength - avgLength);

    // 標準偏差の2倍以上離れている場合は警告
    if (deviation > stdDev * 2) {
      return {
        valid: false,
        violations: [{
          code: 'GRANULARITY_LENGTH_INCONSISTENT',
          severity: 'suggest',
          message: `文章の長さ (${reqLength}文字) が兄弟要求の平均 (${avgLength.toFixed(0)}文字) と大きく異なります`,
          suggestion: `兄弟要求と同程度の長さ (${avgLength - stdDev} - ${avgLength + stdDev}文字) に調整することを推奨`
        }]
      };
    }

    return { valid: true, violations: [] };
  }

  /**
   * 抽象度の一貫性を検証（NLP使用）
   */
  private async validateAbstractionLevel(
    req: Requirement,
    siblings: Requirement[]
  ): Promise<ValidationResult> {
    // 抽象度スコア計算（0: 具体的、1: 抽象的）
    const reqScore = await this.nlpAnalyzer.calculateAbstractionScore(req.description);
    const siblingScores = await Promise.all(
      siblings.map(s => this.nlpAnalyzer.calculateAbstractionScore(s.description))
    );

    const avgScore = siblingScores.reduce((a, b) => a + b, 0) / siblingScores.length;
    const deviation = Math.abs(reqScore - avgScore);

    // 0.3以上の差がある場合は警告
    if (deviation > 0.3) {
      return {
        valid: false,
        violations: [{
          code: 'GRANULARITY_ABSTRACTION_INCONSISTENT',
          severity: 'suggest',
          message: `抽象度 (${reqScore.toFixed(2)}) が兄弟要求の平均 (${avgScore.toFixed(2)}) と異なります`,
          suggestion: reqScore > avgScore
            ? '具体的な記述を追加することを推奨'
            : 'より抽象的な記述に変更することを推奨'
        }]
      };
    }

    return { valid: true, violations: [] };
  }

  /**
   * 詳細度の一貫性を検証
   */
  private validateDetailLevel(
    req: Requirement,
    siblings: Requirement[]
  ): ValidationResult {
    // 技術用語の密度、箇条書きの数、コード例の有無などで詳細度を測定
    const reqDetail = this.calculateDetailScore(req);
    const siblingDetails = siblings.map(s => this.calculateDetailScore(s));
    const avgDetail = siblingDetails.reduce((a, b) => a + b, 0) / siblingDetails.length;

    const deviation = Math.abs(reqDetail - avgDetail);

    if (deviation > 2.0) {
      return {
        valid: false,
        violations: [{
          code: 'GRANULARITY_DETAIL_INCONSISTENT',
          severity: 'suggest',
          message: `詳細度 (${reqDetail.toFixed(1)}) が兄弟要求の平均 (${avgDetail.toFixed(1)}) と異なります`,
          suggestion: reqDetail > avgDetail
            ? '詳細情報を削減し、概要レベルに統一することを推奨'
            : '詳細情報を追加し、兄弟要求と同程度の粒度にすることを推奨'
        }]
      };
    }

    return { valid: true, violations: [] };
  }

  /**
   * 詳細度スコアの計算
   */
  private calculateDetailScore(req: Requirement): number {
    let score = 0;

    // 技術用語の密度
    const technicalTerms = this.countTechnicalTerms(req.description);
    score += technicalTerms * 0.5;

    // 箇条書きの数
    const bulletPoints = (req.description.match(/^[-*•]\s/gm) || []).length;
    score += bulletPoints * 0.3;

    // 数値指標の数（例: "1秒以内"、"100MB"）
    const numericIndicators = (req.description.match(/\d+\s*(秒|分|MB|GB|%|件)/g) || []).length;
    score += numericIndicators * 0.4;

    // コード例の有無
    const hasCode = /```/.test(req.description);
    if (hasCode) score += 2.0;

    return score;
  }
}
```

#### 2. NLPAnalyzerの拡張

```typescript
// src/validation/nlp-analyzer.ts に追加
export class NLPAnalyzer {
  /**
   * 抽象度スコアを計算
   * 0: 非常に具体的、1: 非常に抽象的
   */
  async calculateAbstractionScore(text: string): Promise<number> {
    let score = 0.5; // 中間値からスタート

    // 抽象的な単語（例: "管理", "処理", "機能"）
    const abstractWords = ['管理', '処理', '機能', '提供', 'サポート', '実現'];
    const abstractCount = this.countWords(text, abstractWords);
    score += abstractCount * 0.05;

    // 具体的な単語（例: "ボタン", "テーブル", "API"）
    const concreteWords = ['ボタン', 'テーブル', 'フォーム', 'API', 'データベース', 'ファイル'];
    const concreteCount = this.countWords(text, concreteWords);
    score -= concreteCount * 0.05;

    // 0-1の範囲にクランプ
    return Math.max(0, Math.min(1, score));
  }
}
```

#### 3. ValidationEngineへの統合

```typescript
// src/validation/validation-engine.ts
async validate(req: Requirement): Promise<ValidationResult> {
  const results: ValidationResult[] = [];

  // 既存のバリデーター
  results.push(await this.structureValidator.validate(req));
  results.push(await this.meceValidator.validate(req));

  // 粒度バリデーター（新規）
  const siblings = this.getSiblings(req);
  if (siblings.length > 0) {
    results.push(await this.granularityValidator.validateSiblingGranularity(req, siblings));
  }

  return this.mergeResults(results);
}
```

#### 4. 修正提案の自動生成

```typescript
// Fix Engineでの自動修正候補生成
{
  op: "rewrite",
  target: "REQ-001",
  payload: {
    field: "description",
    suggestion: "文章を兄弟要求と同程度の長さ（200-300文字）に調整する",
    examples: [
      // 兄弟要求から類似パターンを抽出
    ]
  }
}
```

### 受け入れ基準

- [ ] GranularityValidator クラスの実装
- [ ] 文章長の一貫性検証
- [ ] 抽象度の一貫性検証（NLP使用）
- [ ] 詳細度の一貫性検証
- [ ] NLPAnalyzer の拡張（抽象度スコア計算）
- [ ] ValidationEngine への統合
- [ ] Fix Engine での修正提案生成
- [ ] ユニットテストの追加
- [ ] ドキュメント更新

### 技術的考慮事項

- **NLP処理**: 日本語テキスト解析の精度
- **パフォーマンス**: 兄弟要求数が多い場合の処理時間
- **しきい値調整**: プロジェクトごとのカスタマイズ
- **段階別ルール**: 段階によって許容範囲を変更

### 使用例

```typescript
// バリデーション実行
const result = await validator.validate(requirement);

// 結果
{
  valid: false,
  violations: [
    {
      code: 'GRANULARITY_LENGTH_INCONSISTENT',
      message: '文章の長さ (50文字) が兄弟要求の平均 (250文字) と大きく異なります',
      suggestion: '兄弟要求と同程度の長さ (200-300文字) に調整することを推奨'
    }
  ]
}
```

### 関連ドキュメント

- [REQUIREMENTS-PRINCIPLES.md](../REQUIREMENTS-PRINCIPLES.md) - オントロジー: 粒度の一貫性
- [PRINCIPLES-COMPLIANCE-ANALYSIS.md](../PRINCIPLES-COMPLIANCE-ANALYSIS.md) - Gap-3

**Labels**: `enhancement`, `phase-2`, `validation`, `nlp`
**Priority**: Medium
**Estimate**: 4-5 days
