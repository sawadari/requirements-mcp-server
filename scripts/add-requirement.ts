import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ProjectManager } from '../src/utils/ProjectManager';
import { IdGenerator } from '../src/utils/IdGenerator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface RequirementInput {
  projectId: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category?: string;
  author?: string;
  stakeholder?: string;
  rationale?: string;
  tags?: string[];
}

/**
 * 要求追加汎用スクリプト
 *
 * 使用例:
 * npx tsx scripts/add-requirement.ts \
 *   --project watch-project \
 *   --type stakeholder \
 *   --title "デジタル時刻表示機能" \
 *   --description "時刻をデジタル形式で表示する" \
 *   --priority high \
 *   --status draft
 */

function parseArgs(): RequirementInput | null {
  const args = process.argv.slice(2);
  const input: Partial<RequirementInput> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];

    if (key === 'tags') {
      input.tags = value.split(',').map(t => t.trim());
    } else {
      (input as any)[key] = value;
    }
  }

  // 必須フィールド確認
  const required = ['projectId', 'type', 'title', 'description', 'priority', 'status'];
  const missing = required.filter(key => !(input as any)[key]);

  if (missing.length > 0) {
    console.error(`❌ 必須フィールドが不足: ${missing.join(', ')}`);
    return null;
  }

  return input as RequirementInput;
}

function addRequirement(input: RequirementInput): void {
  const dataDir = path.join(__dirname, '../data');
  const projectManager = new ProjectManager(dataDir);
  const idGenerator = new IdGenerator();

  // プロジェクト存在確認
  const fileName = projectManager.getProjectFileName(input.projectId);
  if (!fileName) {
    console.error(`❌ プロジェクトが見つかりません: ${input.projectId}`);
    console.log('\n利用可能なプロジェクト:');
    projectManager.listProjects().forEach(p => {
      console.log(`  - ${p.metadata.projectId}: ${p.metadata.projectName}`);
    });
    process.exit(1);
  }

  // ファイル読み込み
  const filePath = path.join(dataDir, fileName);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // ID生成
  const existingIds = projectManager.getExistingIds(input.projectId);
  const newId = idGenerator.generateId(input.projectId, input.type, existingIds);

  // 新規要求作成
  const now = new Date().toISOString();
  const newRequirement: any = {
    id: newId,
    type: input.type,
    title: input.title,
    description: input.description,
    status: input.status,
    priority: input.priority,
    category: input.category || input.type,
    tags: input.tags || [],
    dependencies: [],
    refines: [],
    author: input.author || 'システムアーキテクト',
    createdAt: now,
    updatedAt: now,
    rationale: input.rationale || ''
  };

  // ステークホルダ要求の場合
  if (input.type === 'stakeholder' && input.stakeholder) {
    newRequirement.stakeholder = input.stakeholder;
  }

  // 要求追加
  data[newId] = newRequirement;

  // メタデータ更新
  if (data._metadata) {
    data._metadata.updatedAt = now;
    data._metadata.requirementCount = Object.keys(data).filter(k => k !== '_metadata').length;
  }

  // 保存
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log('✅ 要求を追加しました\n');
  console.log(`ID: ${newId}`);
  console.log(`プロジェクト: ${input.projectId}`);
  console.log(`タイトル: ${input.title}`);
  console.log(`タイプ: ${input.type}`);
  console.log(`優先度: ${input.priority}`);
  console.log(`ステータス: ${input.status}`);
  if (newRequirement.stakeholder) {
    console.log(`ステークホルダ: ${newRequirement.stakeholder}`);
  }
  console.log(`\nファイル: ${filePath}`);
}

function showHelp(): void {
  console.log(`
要求追加スクリプト

使用方法:
  npx tsx scripts/add-requirement.ts [options]

必須オプション:
  --projectId <id>       プロジェクトID (例: watch-project, requirements)
  --type <type>          要求タイプ (例: stakeholder, system, system_functional)
  --title <text>         要求タイトル
  --description <text>   要求の説明
  --priority <level>     優先度 (critical, high, medium, low)
  --status <status>      ステータス (draft, approved, in_progress, completed)

任意オプション:
  --category <text>      カテゴリ (デフォルト: typeと同じ)
  --author <name>        文書化者 (デフォルト: システムアーキテクト)
  --stakeholder <name>   ステークホルダ (type=stakeholderの場合)
  --rationale <text>     根拠・理由
  --tags <tag1,tag2>     タグ (カンマ区切り)

使用例:
  npx tsx scripts/add-requirement.ts \\
    --projectId watch-project \\
    --type stakeholder \\
    --title "デジタル時刻表示機能" \\
    --description "時刻をデジタル形式で表示する" \\
    --priority high \\
    --status draft \\
    --stakeholder "エンドユーザー" \\
    --tags "時刻,表示,UI"
  `);
}

// メイン処理
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  showHelp();
  process.exit(0);
}

const input = parseArgs();
if (!input) {
  showHelp();
  process.exit(1);
}

addRequirement(input);
