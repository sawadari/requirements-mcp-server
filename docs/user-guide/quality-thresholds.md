# 品質基準のカスタマイズ

MCPサーバーの検証ルールと品質基準は、`config/quality-thresholds.json` を作成することでカスタマイズできます。

## 概要

品質基準設定ファイルを使用すると、以下のカスタマイズが可能です：

- **許容レベルの設定** - エラー、警告、推奨事項の許容数を指定
- **ルールの無効化** - 特定の検証ルールを無効化
- **重要度の変更** - ルールのseverity（error/warning/info）を変更

## 設定ファイルの作成

### 1. テンプレートをコピー

```bash
cd config
cp quality-thresholds.json.example quality-thresholds.json
```

### 2. 設定ファイルの編集

`config/quality-thresholds.json` を開いて、必要に応じて編集します。

## 設定項目

### errorTolerance

エラーレベルの違反を許容する数を指定します。

- `0`: エラーを一切許容しない（デフォルト）
- `1以上`: 指定した数までエラーを許容

```json
{
  "errorTolerance": 0
}
```

### warningTolerance

警告レベルの違反を許容する数を指定します。

```json
{
  "warningTolerance": 5
}
```

### infoTolerance

推奨事項レベルの違反を許容する数を指定します。

```json
{
  "infoTolerance": 10
}
```

### disabledRules

完全に無効化するルールIDのリストを指定します。

```json
{
  "disabledRules": ["E3", "D2"]
}
```

**利用可能なルールID:**
- **Aドメイン（階層）**: A1, A2, A3, A4, A5
- **Bドメイン（グラフ）**: B1, B2, B3, B4, B5
- **Cドメイン（抽象度）**: C1, C2
- **Dドメイン（MECE）**: D1, D2, D3
- **Eドメイン（スタイル）**: E1, E2, E3, E4, E5, E6

詳細は [検証ルールリファレンス](validation-rules-reference.md) を参照してください。

### severityOverrides

特定のルールの重要度（severity）を変更します。

```json
{
  "severityOverrides": {
    "E3": "info",
    "D2": "warning"
  }
}
```

**利用可能なseverity:**
- `error`: エラーレベル（最も重要）
- `warning`: 警告レベル
- `info`: 推奨事項レベル（最も軽微）

## 設定例

### 例1: スタイルルールを緩和

スタイル関連のルール（Eドメイン）を推奨事項レベルに変更し、MECE関連の推奨事項を多めに許容する設定。

```json
{
  "errorTolerance": 0,
  "warningTolerance": 5,
  "infoTolerance": 20,
  "disabledRules": [],
  "severityOverrides": {
    "E3": "info",
    "E4": "info",
    "E5": "info"
  }
}
```

### 例2: プロトタイプ開発モード

初期開発段階で、品質チェックを最小限にする設定。

```json
{
  "errorTolerance": 3,
  "warningTolerance": 10,
  "infoTolerance": 999,
  "disabledRules": ["E3", "E4", "E5", "D2", "D3"],
  "severityOverrides": {
    "C1": "warning",
    "C2": "warning"
  }
}
```

### 例3: 厳格モード

すべての違反を許容しない設定（デフォルトより厳格）。

```json
{
  "errorTolerance": 0,
  "warningTolerance": 0,
  "infoTolerance": 0,
  "disabledRules": [],
  "severityOverrides": {}
}
```

## 設定の確認

MCPサーバー起動時に、現在の品質基準設定が表示されます。

```bash
npm run dev
```

出力例:
```
⚙️  品質基準設定:
   現在の設定: デフォルト（全ルール有効）

   または

⚙️  品質基準設定:
   現在の設定: カスタム (config/quality-thresholds.json)
   エラー許容数: 0
   警告許容数: 5
   推奨事項許容数: 10
```

## 注意事項

1. **ファイル名**: 必ず `quality-thresholds.json` という名前にしてください（`.example` は不要）
2. **配置場所**: `config/` ディレクトリ直下に配置してください
3. **JSON形式**: コメントは使用できません（JSONCではなく純粋なJSON）
4. **再起動**: 設定変更後はMCPサーバーを再起動してください

## トラブルシューティング

### 設定が反映されない

- ファイル名が `quality-thresholds.json` になっているか確認
- JSON形式が正しいか確認（JSONバリデータで検証）
- MCPサーバーを再起動したか確認

### エラーが出る

- ルールIDのスペルミスがないか確認
- severityの値が `error`, `warning`, `info` のいずれかか確認
- 数値フィールド（Tolerance）に文字列を入れていないか確認

## 関連ドキュメント

- [検証ルールリファレンス](validation-rules-reference.md) - 全ルールの詳細
- [MCPツールリファレンス](mcp-tools.md) - 検証関連ツールの使い方
- [オントロジー管理](../advanced/ontology.md) - 要求段階のカスタマイズ
