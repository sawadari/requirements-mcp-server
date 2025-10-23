const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'ai-chat-assistant.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 行67-77を置換
const searchText = `## システム概要
このシステムは、要求管理（Requirements Management）を支援するツールです。
要求の追加、検索、検証、依存関係分析、品質チェックなどの機能があります。

## 現在の要求データ
- 総要求数: \${allReqs.length}件
- ステークホルダ要求: \${stakeholderReqs.length}件
- システム要求: \${systemReqs.length}件
- 機能要求: \${functionalReqs.length}件`;

const replaceText = `## 管理対象のプロジェクト
このシステムで管理しているプロジェクト: **\${projectDomain}**

## 現在の要求データ
- 総要求数: \${allReqs.length}件
- ステークホルダ要求: \${stakeholderReqs.length}件
- システム要求: \${systemReqs.length}件
- 機能要求: \${functionalReqs.length}件

## 主な要求の概要
\${requirementsSummary}

## ユーザーへの回答方針
- 「このシステム」と聞かれたら、**\${projectDomain}について**答えること（要求管理ツールではない）
- 要求データの内容を基に、プロジェクトの機能や特徴を説明すること
- 具体的な要求IDを参照しながら説明すると分かりやすい`;

// filterの後に追加するコード
const addAfterFilter = `
    // 要求データの具体的な内容を抽出
    const requirementsSummary = stakeholderReqs.slice(0, 5).map(req =>
      \`- \${req.id}: \${req.title}\\n  \${req.description.substring(0, 150)}...\`
    ).join('\\n');

    // プロジェクトのドメインを推測
    const allTitles = allReqs.map(r => r.title + ' ' + r.description).join(' ').toLowerCase();
    let projectDomain = '不明';
    if (allTitles.includes('搬送') || allTitles.includes('agv') || allTitles.includes('自動搬送')) {
      projectDomain = '自動搬送車両システム (AGV)';
    } else if (allTitles.includes('ロボット')) {
      projectDomain = 'ロボットシステム';
    }
`;

// 1. システムプロンプトの内容を置換
content = content.replace(searchText, replaceText);

// 2. filter行の後に新しいコードを追加
const filterLine = `    const functionalReqs = allReqs.filter(r => r.type === 'system_functional' || r.type === 'functional');`;
content = content.replace(filterLine, filterLine + addAfterFilter);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ AI Chat Assistant updated with project domain awareness');
