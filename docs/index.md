---
title: 要求管理MCPサーバー
description: 要求の品質問題を自動検出・自動修正。レビュー前の品質チェックを機械化するエンジニアリングツール。
---

# 要求の品質問題を、レビュー前に自動検出・修正

**主語がない？曖昧な表現？冗長な文章？抽象度がバラバラ？**

レビューで指摘される前に、機械的にチェック・修正できます。

<div style="text-align: center; margin: 3rem 0;">
  <h2 style="font-size: 2.5rem; color: #2563eb;">エラー 29件 → <span style="color: #16a34a;">0件</span></h2>
  <h2 style="font-size: 2rem; color: #666;">実プロジェクトでの検証結果</h2>
</div>

[無料で試す](#はじめ方) ・ [機能を見る](#できること)

---

## 💡 できること

### 20種類以上の品質チェック項目

要求管理MCPサーバーは、以下の品質問題を自動検出します：

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin: 2rem 0;">

<div style="padding: 1.5rem; border: 2px solid #e5e7eb; border-radius: 8px;">
<h4>🎯 主語の欠如（E3）</h4>
<p><strong>検出項目:</strong></p>
<ul>
  <li>主語が明示されていない文章</li>
  <li>責任主体が不明確な記述</li>
</ul>
<p><strong>修正手法:</strong></p>
<ul>
  <li>「システムは」「ユーザーが」の自動付与</li>
  <li>カテゴリに応じた主語候補の提案</li>
</ul>
</div>

<div style="padding: 1.5rem; border: 2px solid #e5e7eb; border-radius: 8px;">
<h4>✨ 曖昧な表現（E1）</h4>
<p><strong>検出項目:</strong></p>
<ul>
  <li>「など」「適切な」「十分な」等の曖昧語</li>
  <li>定量的でない記述</li>
</ul>
<p><strong>修正手法:</strong></p>
<ul>
  <li>具体的な値・項目への置換候補提示</li>
  <li>列挙の完全化（「など」の排除）</li>
</ul>
</div>

<div style="padding: 1.5rem; border: 2px solid #e5e7eb; border-radius: 8px;">
<h4>📝 冗長な記述（E4）</h4>
<p><strong>検出項目:</strong></p>
<ul>
  <li>200トークン超の長文</li>
  <li>重複表現・不要な修飾語</li>
</ul>
<p><strong>修正手法:</strong></p>
<ul>
  <li>要点を保ちつつ圧縮</li>
  <li>本質的な情報のみ抽出</li>
</ul>
</div>

<div style="padding: 1.5rem; border: 2px solid #e5e7eb; border-radius: 8px;">
<h4>📊 抽象度の不整合（C2）</h4>
<p><strong>検出項目:</strong></p>
<ul>
  <li>親子間の具体化度のズレ</li>
  <li>同階層での抽象度のバラつき</li>
</ul>
<p><strong>修正手法:</strong></p>
<ul>
  <li>技術詳細の追加提案</li>
  <li>抽象度スコアによる定量評価</li>
</ul>
</div>

<div style="padding: 1.5rem; border: 2px solid #e5e7eb; border-radius: 8px;">
<h4>🔍 単一性の欠如（E5）</h4>
<p><strong>検出項目:</strong></p>
<ul>
  <li>複数の関心事が混在する要求</li>
  <li>複合的な機能の混同</li>
</ul>
<p><strong>修正手法:</strong></p>
<ul>
  <li>単一機能への焦点絞り込み提案</li>
  <li>分割候補の自動検出</li>
</ul>
</div>

<div style="padding: 1.5rem; border: 2px solid #e5e7eb; border-radius: 8px;">
<h4>🏗️ 構造・整合性チェック</h4>
<p><strong>検出項目:</strong></p>
<ul>
  <li>循環参照、孤立要求</li>
  <li>必須フィールド欠如</li>
  <li>MECE原則違反（重複・漏れ）</li>
</ul>
<p><strong>修正手法:</strong></p>
<ul>
  <li>依存関係の再配線</li>
  <li>階層構造の正規化</li>
</ul>
</div>

</div>

> **注**: これらは機械的にチェック可能な品質基準です。最終的な妥当性判断や意思決定は人間のレビューが必要です。

---

## 📈 実プロジェクトでの検証結果

### 検証環境
- 要求件数: 約32件
- ドメイン: 組込みシステム（自律移動ロボット）
- 実施日: 2025年10月

### 検出・修正実績

| 検証項目 | 検出数 | 修正数 |
|---------|-------|-------|
| **エラーレベル** | 29件 | 29件（100%解消） |
| **構造的問題** | 重複要求14件、循環参照等 | 全件修正 |
| **主語欠如（E3）** | 15件 | 18件に主語付与 |
| **曖昧語（E1）** | 8件 | 具体化実施 |
| **冗長記述（E4）** | 7件 | 圧縮実施 |
| **抽象度不整合（C2）** | 10件 | 技術詳細追加 |
| **単一性欠如（E5）** | 2件 | 焦点絞り込み |

> 📊 [詳細レポート](https://github.com/sawadari/requirements-mcp-server/blob/main/VALIDATION-SUMMARY.md) | [改善ログ](https://github.com/sawadari/requirements-mcp-server/blob/main/IMPROVEMENT-REPORT.md)

---

## 🔧 仕組み

### 3ステップで品質チェックを自動化

```
┌──────────┐   ┌──────────┐   ┌──────────┐
│ 自動検証 │ → │ 修正提案 │ → │ 再検証   │
│ Validate │   │ Propose  │   │ Re-Check │
└──────────┘   └──────────┘   └──────────┘
```

#### 1️⃣ 自動検証（20種類以上のチェック項目）

**構造検証:**
- 必須フィールドの存在確認
- 階層関係の整合性（親子・兄弟）
- 循環参照・孤立要求の検出
- 依存関係の妥当性

**MECE原則検証:**
- 兄弟要求の重複検出
- 親要求のカバレッジ確認
- 抽象度階層の一貫性

**品質スタイル検証:**
- 主語の有無（E3）
- 曖昧な表現（E1: 「など」「適切な」等）
- 冗長性（E4: 200トークン超）
- 単一性（E5: 複数関心事の混在）

**NLP/抽象度検証:**
- 親子間の具体化度（C2）
- 同階層での抽象度一貫性
- キーワード密度・具体性スコア

#### 2️⃣ 修正提案（ポリシードリブン）

**主語付与:**
```
Before: 移動指示を受信し処理する
After:  システムは、移動指示を受信し処理する
```

**曖昧語置換:**
```
Before: 移動指示（前進、後退、停止、回転など）
After:  移動指示（前進、後退、左回転、右回転、停止）
```

**冗長圧縮:**
```
Before: 219トークンの詳細説明
After:  130トークン（本質のみ抽出）
```

**抽象度調整:**
```
Before: 経路計画アルゴリズムを使用
After:  A*アルゴリズムを使用して障害物回避を実現
```

#### 3️⃣ 品質保証

- ✅ **プレビュー機能**: 適用前に変更内容を確認
- ✅ **ロールバック**: すべての変更を元に戻せる
- ✅ **変更履歴**: ChangeSetで完全記録
- ✅ **品質スコア**: 0-100点で定量評価

---

## 🚀 はじめ方

### インストール（3ステップ）

```bash
# 1. クローン
git clone https://github.com/sawadari/requirements-mcp-server.git
cd requirements-mcp-server

# 2. セットアップ
npm install
npm run build

# 3. 検証実行
npx tsx validate-requirements.ts
```

### Claude Code / エディタと連携

```json
{
  "mcpServers": {
    "requirements": {
      "command": "node",
      "args": ["C:/path/to/requirements-mcp-server/build/index.js"]
    }
  }
}
```

エディタから直接、要求の追加・更新・検証・修正提案が可能になります。

[詳細セットアップガイド](https://github.com/sawadari/requirements-mcp-server/blob/main/SETUP.md)

---

## 💎 活用シーン

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin: 2rem 0;">

<div style="padding: 1.5rem; background: #f0f9ff; border-radius: 8px;">
<h4>🎯 レビュー前の品質チェック</h4>
<p>機械的にチェック可能な品質問題を事前に検出・修正。<br>レビュアーは本質的な議論に集中できます。</p>
</div>

<div style="padding: 1.5rem; background: #f0fdf4; border-radius: 8px;">
<h4>📊 品質の定量化・可視化</h4>
<p>品質スコア（0-100点）で定量評価。<br>エラー/警告/情報の件数推移を追跡できます。</p>
</div>

<div style="padding: 1.5rem; background: #fef3c7; border-radius: 8px;">
<h4>🔄 既存要求の整備</h4>
<p>数百件の既存要求を一括検証・修正提案。<br>レガシー要求のクリーンアップに活用できます。</p>
</div>

<div style="padding: 1.5rem; background: #fce7f3; border-radius: 8px;">
<h4>🎓 要求記述の学習支援</h4>
<p>修正提案のBefore/Afterから、良い要求記述を学べます。<br>チーム内の記述品質の標準化に貢献します。</p>
</div>

</div>

---

## 🎓 実例：検出と修正提案

### ケース1: 主語欠如（E3）の検出

**検出前:**
```
移動指示（前進、後退、停止、回転）を受信し処理する
```

**問題点:** 主語が明示されていない（誰が/何が処理するのか不明）

**修正提案:**
```
システムは、移動指示（前進、後退、停止、回転）を受信し処理する
```

**改善効果:** 責任主体が明確化される

---

### ケース2: 曖昧語（E1）の検出

**検出前:**
```
移動指示（前進、後退、停止、回転など）を処理
```

**問題点:** 「など」により項目が不完全

**修正提案:**
```
移動指示（前進、後退、左回転、右回転、停止）を処理
```

**改善効果:** 全項目が明示され、実装時の曖昧さが解消

---

### ケース3: 冗長記述（E4）の検出

**検出前（219トークン）:**
```
画像認識システムは、カメラから取得した画像データを解析し、
物体の位置、形状、色、テクスチャなどの特徴を抽出します。
抽出された特徴は、事前に学習された機械学習モデルと照合され、
物体の種類を判定します。判定結果は、制御システムに送信され...
```

**問題点:** 冗長で読みにくい

**修正提案（約130トークン）:**
```
画像認識システムは、カメラ画像から物体の位置・形状・色を抽出し、
機械学習モデルで種類を判定する。判定結果を制御システムへ送信。
```

**改善効果:** 要点のみ残し、読みやすさ向上

---

### ケース4: 抽象度不整合（C2）の検出

**検出前:**
```
経路計画アルゴリズムを使用して最適経路を計算
```

**問題点:** 具体的な技術詳細が不足

**修正提案:**
```
A*アルゴリズムを使用して最適経路を計算し、障害物回避を実現
```

**改善効果:** アルゴリズム名と目的が明確化

---

## 🌟 高度な機能

### オントロジーのカスタマイズ

プロジェクトに合わせて、段階定義・検証ルールを変更可能：

| オントロジー | 段階構成 | 適用分野 |
|-------------|---------|---------|
| **デフォルト** | stakeholder → system → functional | 一般的なシステム開発 |
| **組込み** | mission → capability → subsystem → component | 組込みシステム、ロボット |
| **Web/AI** | user_story → feature → api/model → implementation | Webアプリ、AI開発 |

```bash
export ONTOLOGY_SCHEMA_PATH=./config/ontology-embedded-system.json
npm start
```

[オントロジーカスタマイズガイド](https://github.com/sawadari/requirements-mcp-server/blob/main/ONTOLOGY-GUIDE.md)

---

### 修正ポリシーの設定

自動修正の挙動を3モードで制御：

| モード | 動作 | 用途 |
|-------|------|------|
| **Strict** | 自動適用 | CI/CD、夜間バッチ |
| **Suggest** | 提案のみ | インタラクティブレビュー |
| **Assist** | プレビュー | 学習・トレーニング |

```jsonc
{
  "autoFix": {
    "enabled": true,
    "mode": "suggest",  // strict / suggest / assist
    "revalidateAfterFix": true
  }
}
```

---

### CI/CD統合

GitHub Actionsで品質ゲートを自動化：

```yaml
- name: Requirements Quality Check
  run: |
    npx tsx validate-requirements.ts
    # エラーがある場合はビルド失敗
```

品質基準を満たさないPRをマージ前に検出できます。

---

## ❓ よくある質問

<details>
<summary><strong>Q. 既存のALM/PLMツールと併用できますか？</strong></summary>
<p><strong>A.</strong> はい。JSON/CSVでエクスポート/インポートし、本サーバーで品質チェック後、元システムに反映する運用が可能です。</p>
</details>

<details>
<summary><strong>Q. 自動修正は安全ですか？人間のレビューは不要ですか？</strong></summary>
<p><strong>A.</strong> 自動修正はあくまで「提案」です。すべての変更はプレビュー可能で、ロールバックも保証されています。最終的な判断や意思決定は人間のレビューが必要です。本ツールは、機械的にチェック可能な品質問題を事前に検出し、レビュー負荷を軽減することを目的としています。</p>
</details>

<details>
<summary><strong>Q. LLM（GPT等）は必須ですか？</strong></summary>
<p><strong>A.</strong> 必須ではありません。構造・規則ベースのチェックで十分な効果があります。LLMは抽象度評価など一部機能のオプションです。</p>
</details>

<details>
<summary><strong>Q. 何件の要求まで対応できますか？</strong></summary>
<p><strong>A.</strong> 数百件規模で検証済みです。1000件以上の場合は、パフォーマンスを考慮した分割管理を推奨します。</p>
</details>

<details>
<summary><strong>Q. 検出精度はどの程度ですか？</strong></summary>
<p><strong>A.</strong> ルールベースのチェック（主語欠如、曖昧語、構造整合性等）は高精度です。抽象度やMECEのような判断が必要な項目は、NLPとヒューリスティックで補助的に評価します。最終判断は人間のレビューが必要です。</p>
</details>

---

## 📚 関連ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [README.md](https://github.com/sawadari/requirements-mcp-server/blob/main/README.md) | 機能一覧、MCPツール、基本設定 |
| [SETUP.md](https://github.com/sawadari/requirements-mcp-server/blob/main/SETUP.md) | 詳細セットアップガイド |
| [ONTOLOGY-GUIDE.md](https://github.com/sawadari/requirements-mcp-server/blob/main/ONTOLOGY-GUIDE.md) | オントロジーカスタマイズ方法 |
| [FIX-ENGINE-README.md](https://github.com/sawadari/requirements-mcp-server/blob/main/FIX-ENGINE-README.md) | 自動修正エンジンの詳細 |
| [VALIDATION-SUMMARY.md](https://github.com/sawadari/requirements-mcp-server/blob/main/VALIDATION-SUMMARY.md) | 検証結果レポート |
| [MIYABI-INTEGRATION.md](https://github.com/sawadari/requirements-mcp-server/blob/main/MIYABI-INTEGRATION.md) | Miyabiフレームワーク統合 |

---

## 🎯 今すぐ試す

<div style="text-align: center; padding: 3rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; margin: 2rem 0;">
  <h2 style="color: white; margin-bottom: 1rem;">要求の品質チェックを機械化する</h2>
  <p style="font-size: 1.2rem; margin-bottom: 2rem;">レビュー前の品質問題を自動検出・修正提案</p>
  <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
    <a href="https://github.com/sawadari/requirements-mcp-server" style="display: inline-block; padding: 1rem 2rem; background: white; color: #667eea; border-radius: 8px; text-decoration: none; font-weight: bold;">GitHubで見る</a>
    <a href="https://github.com/sawadari/requirements-mcp-server/blob/main/SETUP.md" style="display: inline-block; padding: 1rem 2rem; background: rgba(255,255,255,0.2); color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">セットアップガイド</a>
  </div>
</div>

---

<div style="text-align: center; padding: 2rem; color: #666;">
  <p>MIT License | Made for Requirements Engineering</p>
  <p><a href="https://github.com/sawadari/requirements-mcp-server">GitHub</a> • <a href="https://github.com/sawadari/requirements-mcp-server/issues">Issue Report</a> • <a href="https://github.com/sawadari/requirements-mcp-server/discussions">Discussions</a></p>
</div>
