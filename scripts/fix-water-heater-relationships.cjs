/**
 * 自動湯沸かし器システムの要求関係を修正
 * dependencies → refines に変更
 */

const fs = require('fs');
const path = require('path');

function fixRelationships() {
  try {
    console.log('🔧 要求関係を修正します...\n');

    const dataPath = path.join(__dirname, '..', 'data', 'water-heater.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // 修正前の状態を表示
    console.log('修正前の状態:');
    Object.keys(data).forEach(key => {
      if (key !== '_metadata') {
        const req = data[key];
        if (req.dependencies && req.dependencies.length > 0) {
          console.log(`  ${req.id}: dependencies = [${req.dependencies.join(', ')}]`);
        }
      }
    });

    let modifiedCount = 0;

    // dependencies を refines に変換
    Object.keys(data).forEach(key => {
      if (key !== '_metadata') {
        const req = data[key];

        // dependenciesがあれば、それをrefinesに移動
        if (req.dependencies && req.dependencies.length > 0) {
          req.refines = req.dependencies;
          delete req.dependencies; // dependenciesは削除
          modifiedCount++;
        } else {
          // dependenciesがない場合は空配列を設定
          req.dependencies = [];
        }

        // refinesがない場合は空配列を設定
        if (!req.refines) {
          req.refines = [];
        }

        // 他のエッジフィールドも初期化
        if (!req.depends_on) req.depends_on = [];
        if (!req.conflicts_with) req.conflicts_with = [];
        if (!req.duplicates) req.duplicates = [];
      }
    });

    // ファイルに保存
    data._metadata.updatedAt = new Date().toISOString();
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

    console.log(`\n✅ ${modifiedCount}件の要求を修正しました\n`);

    // 修正後の状態を表示
    console.log('修正後の状態:');
    Object.keys(data).forEach(key => {
      if (key !== '_metadata') {
        const req = data[key];
        if (req.refines && req.refines.length > 0) {
          console.log(`  ${req.id}: refines = [${req.refines.join(', ')}]`);
        }
      }
    });

    console.log('\n🎉 修正完了！ブラウザをリフレッシュして確認してください。');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

fixRelationships();
