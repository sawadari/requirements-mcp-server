/**
 * 定義済みビューを生成するスクリプト
 */

import fs from 'fs/promises';
import path from 'path';
import { RequirementsStorage } from '../src/storage.js';
import { ViewExporter, PREDEFINED_VIEWS } from '../src/views.js';

async function generateViews() {
  const storage = new RequirementsStorage('./data');
  await storage.initialize();

  const exporter = new ViewExporter(storage);
  const outputDir = './views';

  // 出力ディレクトリを作成
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(path.join(outputDir, 'markdown'), { recursive: true });
  await fs.mkdir(path.join(outputDir, 'html'), { recursive: true });
  await fs.mkdir(path.join(outputDir, 'csv'), { recursive: true });

  console.log('\n========================================');
  console.log('要求管理ビュー生成');
  console.log('========================================\n');

  const viewKeys = Object.keys(PREDEFINED_VIEWS);

  for (const viewKey of viewKeys) {
    const viewDef = PREDEFINED_VIEWS[viewKey];
    console.log(`生成中: ${viewDef.name} (${viewKey})`);

    try {
      const content = await exporter.exportView(viewKey);
      const format = viewDef.format || 'markdown';
      const ext = format === 'markdown' ? 'md' : format;
      const filename = `${viewKey}.${ext}`;
      const filepath = path.join(outputDir, format === 'html' ? 'html' : format === 'csv' ? 'csv' : 'markdown', filename);

      await fs.writeFile(filepath, content, 'utf-8');
      console.log(`  ✓ ${filepath}`);
    } catch (error: any) {
      console.error(`  ✗ エラー: ${error.message}`);
    }
  }

  // インデックスファイルを作成
  await generateIndex(outputDir, viewKeys);

  console.log('\n========================================');
  console.log('完了');
  console.log('========================================\n');
  console.log(`出力先: ${outputDir}/`);
  console.log(`生成されたビュー: ${viewKeys.length}件\n`);
}

/**
 * インデックスファイルを生成
 */
async function generateIndex(outputDir: string, viewKeys: string[]) {
  let indexContent = `# 要求管理ビュー一覧

生成日時: ${new Date().toLocaleString('ja-JP')}

## 利用可能なビュー

`;

  for (const viewKey of viewKeys) {
    const viewDef = PREDEFINED_VIEWS[viewKey];
    const format = viewDef.format || 'markdown';
    const ext = format === 'markdown' ? 'md' : format;
    const subdir = format === 'html' ? 'html/' : format === 'csv' ? 'csv/' : 'markdown/';
    const filepath = `${subdir}${viewKey}.${ext}`;

    indexContent += `### ${viewDef.name}\n\n`;
    indexContent += `${viewDef.description}\n\n`;
    indexContent += `- **タイプ**: ${viewDef.type}\n`;
    indexContent += `- **形式**: ${format}\n`;
    indexContent += `- **ファイル**: [${viewKey}.${ext}](${filepath})\n\n`;
  }

  indexContent += `
## ビューの種類

### リストビュー
要求を表形式で一覧表示します。

### マトリックスビュー
要求間の依存関係をマトリックス形式で表示します（トレーサビリティマトリックス）。

## ファイル形式

- **Markdown (.md)**: VSCodeのプレビュー機能で表示できます
- **HTML (.html)**: ブラウザで表示できます
- **CSV (.csv)**: Excel等の表計算ソフトで開けます

## VSCodeでの表示方法

### Markdownファイル
1. VSCodeでファイルを開く
2. 右上のプレビューアイコンをクリック、または \`Ctrl+Shift+V\` (Windows/Linux) / \`Cmd+Shift+V\` (Mac)

### HTMLファイル
1. VSCodeでファイルを開く
2. 右クリック → "Open with Live Server" (Live Server拡張機能が必要)

または、ファイルをブラウザで直接開く

### CSVファイル
1. VSCodeの拡張機能 "Excel Viewer" または "Rainbow CSV" をインストール
2. CSVファイルを開くと自動的に表形式で表示されます
`;

  await fs.writeFile(path.join(outputDir, 'README.md'), indexContent, 'utf-8');
  console.log(`\nインデックスファイル生成: ${path.join(outputDir, 'README.md')}`);
}

generateViews().catch((error) => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
