const fs = require('fs');
const path = require('path');

/**
 * stakeholder/authorフィールド分離マイグレーション
 *
 * 変更内容:
 * - ステークホルダ要求: authorの値をstakeholderにコピー、authorは未設定に
 * - システム/機能要求: authorはそのまま維持
 */

const dataDir = path.join(__dirname, '../data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

console.log('=== stakeholder/authorフィールド分離マイグレーション ===\n');

files.forEach(file => {
  const filePath = path.join(dataDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  console.log(`📁 ${file}`);

  let migratedCount = 0;
  const requirements = Object.entries(data).filter(([k]) => k !== '_metadata');

  requirements.forEach(([id, req]) => {
    if (req.type === 'stakeholder' && req.author && req.author !== 'AI Chat Assistant') {
      // ステークホルダ要求: authorをstakeholderに移動
      req.stakeholder = req.author;
      req.author = 'システムアーキテクト';  // デフォルトの文書化者
      migratedCount++;
      console.log(`  ✓ ${id}: stakeholder="${req.stakeholder}", author="${req.author}"`);
    } else if (req.type === 'stakeholder' && !req.stakeholder) {
      // ステークホルダ要求でstakeholderが未設定の場合
      req.stakeholder = req.author || '未特定';
      if (!req.author || req.author === 'AI Chat Assistant') {
        req.author = 'システムアーキテクト';
      }
      migratedCount++;
      console.log(`  ✓ ${id}: stakeholder="${req.stakeholder}" (新規設定)`);
    } else if (!req.stakeholder) {
      // システム/機能要求: stakeholderは空のまま
      req.stakeholder = undefined;
    }
  });

  if (migratedCount > 0) {
    // メタデータ更新
    if (data._metadata) {
      data._metadata.updatedAt = new Date().toISOString();
    }

    // ファイル保存
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`  ✅ ${migratedCount}件をマイグレーション\n`);
  } else {
    console.log(`  ℹ️  マイグレーション対象なし\n`);
  }
});

console.log('🎉 マイグレーション完了');
