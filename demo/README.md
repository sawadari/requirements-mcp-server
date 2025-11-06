# デモ自動化システム

YouTube動画作成のための自動化ツール群です。

## 📁 構成

```
demo/
├── scenarios/              # デモシナリオ定義（JSON）
│   └── 01-basic-usage.json
├── narrations/            # 生成された音声ファイル
├── output/                # 録画ファイル出力先
├── generate-narration.js  # 音声生成スクリプト
├── automation-helper.ps1  # PowerShell自動化ヘルパー
├── run-demo.js           # デモ実行メインスクリプト
└── README.md
```

## 🚀 使い方

### 1. 準備

#### OBS Studioのインストール
```bash
winget install OBSProject.OBSStudio
```

#### OBS WebSocketプラグインの有効化
1. OBS Studio を起動
2. ツール → WebSocketサーバー設定
3. WebSocketサーバーを有効化（デフォルトポート: 4455）

### 2. 音声生成

```bash
# すべてのシナリオの音声を生成
node demo/generate-narration.js

# 特定のシナリオのみ
node demo/generate-narration.js demo/scenarios/01-basic-usage.json
```

### 3. デモ実行

```bash
# 通常実行（録画あり）
node demo/run-demo.js demo/scenarios/01-basic-usage.json

# ドライラン（動作確認）
node demo/run-demo.js demo/scenarios/01-basic-usage.json --dry-run

# 録画なし
node demo/run-demo.js demo/scenarios/01-basic-usage.json --skip-recording
```

### 4. OBSの録画設定

1. OBS Studioで録画設定
   - 設定 → 出力 → 録画
   - 録画ファイルのパス: `demo/output`
   - 録画フォーマット: mp4
   - エンコーダー: x264

2. シーン設定
   - ウィンドウキャプチャで VS Code を追加
   - ウィンドウキャプチャで Chrome を追加
   - 必要に応じてレイアウト調整

## 📝 シナリオの作成

`demo/scenarios/` にJSONファイルを作成します。

### シナリオ例

```json
{
  "id": "demo-scenario",
  "title": "デモタイトル",
  "duration": "120秒",
  "description": "デモの説明",
  "scenes": [
    {
      "id": "intro",
      "duration": 10,
      "narration": "イントロのナレーション",
      "actions": [
        {"type": "focus", "target": "vscode", "wait": 1000},
        {"type": "keystroke", "keys": "ctrl+`", "wait": 1000},
        {"type": "text", "content": "npm run dev", "wait": 500},
        {"type": "keystroke", "keys": "enter", "wait": 3000}
      ]
    }
  ]
}
```

### アクションタイプ

| タイプ | 説明 | パラメータ |
|--------|------|-----------|
| `focus` | ウィンドウをアクティブ化 | `target`: "vscode" / "browser" / "claude-code" |
| `keystroke` | キー入力 | `keys`: キー組み合わせ（例: "ctrl+`", "enter"） |
| `text` | テキスト入力 | `content`: 入力するテキスト |
| `mouse_move` | マウス移動 | `x`, `y`: 座標 |
| `mouse_click` | マウスクリック | - |
| `wait` | 待機 | `duration`: ミリ秒 |

### キーストローク記法

- `ctrl+キー` - Ctrl + キー
- `shift+キー` - Shift + キー
- `alt+キー` - Alt + キー
- `{ENTER}` - Enter
- `{TAB}` - Tab
- `^` - Ctrl
- `+` - Shift
- `%` - Alt

## 🎬 ワークフロー例

### 完全自動化
```bash
# 1. 音声生成
node demo/generate-narration.js

# 2. OBS起動（手動）

# 3. VSCode、Claude Code、ブラウザを準備（手動）

# 4. デモ実行（自動録画）
node demo/run-demo.js demo/scenarios/01-basic-usage.json
```

### セミオート（推奨）
```bash
# 1. 音声生成
node demo/generate-narration.js

# 2. OBS起動と録画開始（手動）

# 3. デモ実行（録画なし）
node demo/run-demo.js demo/scenarios/01-basic-usage.json --skip-recording

# 4. OBS録画停止（手動）
```

## 🐛 トラブルシューティング

### PowerShell実行ポリシーエラー
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### OBS WebSocket接続エラー
- OBS Studioでポート番号を確認（ツール → WebSocketサーバー設定）
- `--obs-host` オプションでホスト指定
- `--skip-recording` で録画をスキップ

### キーストロークが動作しない
- アクティブウィンドウが正しく切り替わっているか確認
- `wait` パラメータを増やす（ウィンドウ切り替えに時間がかかる場合）

## 📊 使用例

### 基本デモ
```bash
node demo/run-demo.js demo/scenarios/01-basic-usage.json
```

### 複数シナリオの連続実行
```bash
for scenario in demo/scenarios/*.json; do
  node demo/run-demo.js "$scenario"
  sleep 10
done
```

## 🔧 カスタマイズ

### 音声の速度調整
`generate-narration.js` の `sayExport` 第3引数で調整:
```javascript
await sayExport(scene.narration, null, 1.2, outputPath);  // 1.2倍速
```

### アクションの追加
`automation-helper.ps1` に新しい関数を追加して、`run-demo.js` から呼び出します。

---

**最終更新**: 2025-11-06
