# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **起動時設定情報表示機能** - MCPサーバー起動時に、現在のオントロジー、検証ルール、品質基準設定を表示
  - オントロジーのバージョンと段階定義（stakeholder, system, system_functional）
  - 有効な検証ルール数（A-Eの5ドメイン、デフォルト21個のルール）
  - 品質基準のカスタマイズ方法を表示（`config/quality-thresholds.json`）
  - ユーザーが警告・推奨事項の許容レベルを設定可能であることを明示
- **品質基準設定機能** - `config/quality-thresholds.json` で検証ルールと許容レベルをカスタマイズ可能
  - `errorTolerance`, `warningTolerance`, `infoTolerance`: 各重要度の許容違反数を設定
  - `disabledRules`: 特定の検証ルールを無効化（例: `["E3", "D2"]`）
  - `severityOverrides`: ルールの重要度を変更（例: `{"E3": "info"}`）
  - カスタム設定使用時は起動時メッセージに設定内容を表示
  - 検証レポートに許容範囲超過の警告を表示
- `ValidationEngine.getRuleCount()` - 有効な検証ルール数を取得するメソッドを追加
- `ValidationEngine.getThresholds()` - 現在の品質基準設定を取得するメソッドを追加
- `QualityThresholdsLoader` - 品質基準設定の読み込みと適用を管理する新しいクラス
- `config/quality-thresholds.json.example` - 品質基準設定のテンプレートファイルを追加
- `docs/user-guide/quality-thresholds.md` - 品質基準カスタマイズの詳細ガイドを追加

### Changed
- `src/index.ts` - `displayStartupInfo()` メソッドで品質基準設定の表示を追加
- `src/validation/validation-engine.ts` - `getRuleCount()`, `getThresholds()` メソッドを追加、品質基準の適用ロジックを実装
- `src/types.ts` - `QualityThresholds` インターフェースを追加

## [0.1.0] - 2025-11-08

### Added
- 初回リリース
- 22個のMCPツール
- 5つのドメインで品質チェック（階層、グラフ、抽象度、MECE、スタイル）
- Fix Engine（6種類の修正操作）
- オントロジー管理
- プロジェクト管理機能
- Webビューアー
- AIチャット統合（実験的）
