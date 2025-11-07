const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const requirementsFile = path.join(dataDir, 'requirements.json');

const data = JSON.parse(fs.readFileSync(requirementsFile, 'utf-8'));
const requirements = Object.entries(data).filter(([k]) => k !== '_metadata');

console.log('=== 既存要求のauthor分析 ===\n');

const authors = {};
requirements.forEach(([id, req]) => {
  const author = req.author || '未設定';
  if (!authors[author]) authors[author] = [];
  authors[author].push({
    id,
    title: req.title,
    type: req.type,
    category: req.category
  });
});

Object.entries(authors).sort((a, b) => b[1].length - a[1].length).forEach(([author, reqs]) => {
  console.log(`[${author}] ${reqs.length}件`);
  reqs.slice(0, 2).forEach(r => {
    console.log(`  - ${r.id}: ${r.title}`);
    console.log(`    type: ${r.type}, category: ${r.category}`);
  });
  if (reqs.length > 2) console.log(`  ... 他${reqs.length - 2}件`);
  console.log('');
});

// ステークホルダ要求の分析
console.log('\n=== ステークホルダ要求の詳細分析 ===\n');
const stakeholderReqs = requirements.filter(([_, req]) => req.type === 'stakeholder');
stakeholderReqs.forEach(([id, req]) => {
  console.log(`${id}: ${req.title}`);
  console.log(`  author: ${req.author}`);
  console.log(`  rationale: ${req.rationale?.substring(0, 100) || '未設定'}...`);
  console.log('');
});
