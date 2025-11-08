# requirements-mcp-server UI Redesign Blueprint

Last updated: 2025-11-08
Owner: UI working group

## 0. Inputs & References
- "docs/architecture/design-principles.md": MECE階層、粒度、影響分析を徹底する要求論理
- "docs/AI-WORKFLOW-GUIDELINES.md": 現状報告→選択肢→承認→記録の義務
- "docs/user-guide/web-viewer.md": 既存ツリービュー、検索、マトリックス機能
- "src/view-server.ts": 単一HTMLテンプレートとAPI (GET /, /api/tree ほか)
- 参考イメージ image.png: 旧Windowsライクなツリー+テーブルUI

---

## 1. Experience Ambition
1. Clarity-first hierarchy: Stakeholder -> System -> Functional を色とモーションで明示
2. Flow without friction: 探索→理解→決定を1画面内で完結
3. Confidence and craft: Apple級の余白、グラデーション、200-250msモーション
4. Human oversight surfaced: AI提案は目的・影響・承認状態を同一ビューで提示

---

## 2. Design System Foundations

### 2.1 Color Tokens
| Token | Hex | Purpose |
| --- | --- | --- |
| --bg | #f5f7fb | Canvas (淡いブルーグレー) |
| --surface | #ffffff | カード、モジュール |
| --surface-elevated | rgba(255,255,255,0.72) + blur 16px | フローティングカード |
| --text-primary | #0b1f33 | 本文 |
| --text-secondary | #5a6b80 | 補足 |
| --stakeholder | #0a84ff | STKノード |
| --system | #30d158 | SYSノード |
| --functional | #ff9f0a | FUNCノード |
| --accent | #6e5df6 | KPI・強調 |

Dark theme: 各色をHSLで+6%彩度、-14%明度し prefers-color-scheme に追従。

### 2.2 Typography
- Primary: SF Pro Display / fallback Inter, -apple-system
- Scale: 11, 13, 15, 17, 20, 24, 32 px (8ptグリッド)
- IDs: SF Mono 12px letter-spacing 0.4px

### 2.3 Layout Grid & Depth
- 12列グリッド (min 80px, gutter 24px)
- 割当: Tree 3列 / Workspace 6列 / Insight Rail 3列
- Elevation: base (shadowなし) -> raised (0 8px 24px rgba(15,23,42,0.06)) -> floating (0 30px 60px rgba(15,23,42,0.08))
- Motion: 標準200ms、階層遷移320ms cubic-bezier(0.4,0,0.2,1)

### 2.4 Density Modes
- Focusモード: 行高48px
- Denseモード: 行高32px (Cmd/Ctrl+D)
- 切替でTree/テーブル/マトリックスを同期

---

## 3. Information Architecture

### 3.1 Macro Layout
    +-----------+-------------------------------+-----------+
    | Command   | Workspace (tabbed canvas)     | Insight   |
    | Board     | Tree / List / Matrix / Detail | Rail      |
    +-----------+-------------------------------+-----------+

- Command Board (左 280px): プロジェクト切替、フィルタプリセット、旧右クリック操作を昇格
- Workspace (中央): タブ式でTree、List、Matrix、Timelineを切替。TreeとDetailはSplitViewで同期
- Insight Rail (右 340px): AI提案、バリデーション、承認待ちチェックリスト

### 3.2 Principles Alignment
- MECE可視化: 色付きスレッドラインとパンくず (STK-001 / SYS-010 / FUNC-032)
- 粒度インジケータ: Description長 vs 推奨長のゲージ + 警告色
- 影響分析: 関連ノードをヒートマップ式で右レールに表示

### 3.3 Context Modes
- Plan: 3ペイン+Insight (標準)
- Review: Treeを縮小しテーブルを全幅、Approve/Rejectボタンをフローティング
- Present: Chromeを簡略化、フォント+4px、アニメ増量でレビュー会議用

---

## 4. Core Component Specs

### 4.1 Tree Panel
- Stickyヘッダーに件数と検証警告を表示
- 深さに応じて左パディング16/24/32px、縦ラインで階層を示す
- ドラッグで階層調整すると右レールに影響範囲プレビュー

### 4.2 Requirement Inspector
- 上段Summaryカード (タイトル、ID、タグ、進捗メーター)
- 下段Narrativeカード (Description、Rationale、添付)
- メタ情報は2列タイル (Status, Priority, Owner, Dates, Quality Score)
- 親子要求はStackカード化し、クリックで3D slide

### 4.3 Data Table & Matrix
- 新TableView (固定ヘッダー、列カスタム、インラインタグ編集)
- Matrixは行列を色付きブロック表示し、ホバーで詳細ツールチップ

### 4.4 Search & Command Palette
- Cmd/Ctrl+Kでグローバルパレット。要求、フィルタ、AIアクションを横断検索
- 3段表示: 結果リスト -> プレビュー -> CTA (影響分析実行など)

### 4.5 AI Insight Cards
- 構造: ステータスドット + 目的 + 現状 + 行動ボタン
- 右上に承認者・記録済バッジ (AIガイドライン準拠)
- 実行中は進捗リング、完了時にチェックアニメーション

---

## 5. Micro-interactions
- Hoverで145度グラデーション + subtle shadow
- Tree折りたたみはheightとicon rotation(200ms)
- 承認/却下で柔らかいサウンドフィードバック (ミュート可)
- Empty stateは簡潔なイラストと推奨アクション

---

## 6. Accessibility & Internationalization
- 文字コントラスト4.5:1以上
- prefers-reduced-motion対応 (モーション停止 option)
- CJKフォント行間1.5、数値はlocale aware format
- 主要操作にツールチップとショートカットを併記

---

## 7. Implementation Roadmap
| Phase | Scope | Files |
| --- | --- | --- |
| 0. Design tokens | CSS/TSトークンを新規作成 | src/ui/theme/tokens.ts, src/view-server.ts |
| 1. Layout refactor | Command/Workspace/Insightの3領域を分割 | src/view-server.ts -> src/ui/layout/* |
| 2. Componentization | Tree/Inspector/Tableを独立モジュール化 | src/ui/components/* |
| 3. Insight rail | /api/chat/status や /api/requirement/:id/relations を統合 | src/view-server.ts, src/ai-chat-assistant.ts |
| 4. Matrix & Timeline | Canvas/WebGL可視化、履歴再生 | src/ui/modules/matrix.ts |
| 5. Polish | モーション、音、プレゼンモード、ダークテーマ | 全体 |

想定: 3スプリントで機能パリティ、1スプリントで磨き。

---

## 8. Near-term Action Items
1. inline style を src/view-server.ts (約line 100) から抽出しトークン化
2. src/ui ディレクトリを作成し layout/components/modules を雛形化
3. Command Board + Tree + Detail の静的モックを作りAppleライクな余白と角丸を検証
4. 色/タイポ/コントラストをAccessibility基準で検証
5. Figmaでワイヤー→UIキットを同期しステークホルダレビュー

---

## Success Metrics
- 要求検索から承認までの平均操作時間を30%短縮
- 週次アクティブ利用時間を20%向上
- AI提案の承認フローにおける記録漏れ件数をゼロに

このブループリントは、設計原則とAIガイドラインを守りつつAppleラインの美しさを実現するためのUI北極星です。
