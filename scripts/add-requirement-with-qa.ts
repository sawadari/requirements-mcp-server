import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ProjectManager } from '../src/utils/ProjectManager.js';
import { IdGenerator } from '../src/utils/IdGenerator.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import readline from 'readline';

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
 * 品質保証付き要求追加スクリプト
 *
 * 機能:
 * 1. 要求を追加
 * 2. MCPサーバーで自動バリデーション
 * 3. トレーサビリティ候補を自動検出
 * 4. ユーザー承認を得て関連付け
 */

// MCPクライアント初期化
async function initMCPClient(): Promise<Client> {
  const client = new Client({
    name: 'add-requirement-qa-client',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  const serverPath = path.join(__dirname, '../build/index.js');
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: {
      ...process.env,
      MCP_MODE: 'stdio',
    },
  });

  await client.connect(transport);
  return client;
}

// ユーザー入力を取得
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// MCPツールのレスポンスからJSONを抽出
function parseToolResponse(text: string): any {
  // "検索結果 (XX件):\n\n[...]" 形式の場合、プレフィックスを除去
  const searchPrefixMatch = text.match(/^検索結果.*?\n\n/);
  if (searchPrefixMatch) {
    text = text.substring(searchPrefixMatch[0].length);
  }

  // "影響範囲分析:\n\n{...}" 形式の場合、プレフィックスを除去
  const impactPrefixMatch = text.match(/^影響範囲分析:\s*\n+/);
  if (impactPrefixMatch) {
    text = text.substring(impactPrefixMatch[0].length);
  }

  // Markdown形式（## で始まる）の場合、構造化データを抽出
  if (text.startsWith('##')) {
    // バリデーション結果の場合
    const violationsMatch = text.match(/違反数[**]*[:：]\s*(\d+)/);
    const totalViolations = violationsMatch ? parseInt(violationsMatch[1]) : 0;

    const recommendationsMatch = text.match(/推奨事項[**]*[:：]\s*(\d+)/);
    const totalRecommendations = recommendationsMatch ? parseInt(recommendationsMatch[1]) : 0;

    return {
      summary: {
        totalViolations,
        totalRecommendations
      },
      violations: []
    };
  }

  // ```json ... ``` ブロックがある場合
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[1]);
    if (Array.isArray(parsed)) {
      return { requirements: parsed };
    }
    return parsed;
  }

  // 直接JSONの場合
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return { requirements: parsed };
    }
    return parsed;
  } catch (e) {
    // パースできない場合は空オブジェクトを返す（エラーは無視）
    return {};
  }
}

// コマンドライン引数をパース
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

  const required = ['projectId', 'type', 'title', 'description', 'priority', 'status'];
  const missing = required.filter(key => !(input as any)[key]);

  if (missing.length > 0) {
    console.error(`❌ 必須フィールドが不足: ${missing.join(', ')}`);
    return null;
  }

  return input as RequirementInput;
}

// 要求を追加
function addRequirement(input: RequirementInput): string {
  const dataDir = path.join(__dirname, '../data');
  const projectManager = new ProjectManager(dataDir);
  const idGenerator = new IdGenerator();

  const fileName = projectManager.getProjectFileName(input.projectId);
  if (!fileName) {
    console.error(`❌ プロジェクトが見つかりません: ${input.projectId}`);
    console.log('\n利用可能なプロジェクト:');
    projectManager.listProjects().forEach(p => {
      console.log(`  - ${p.metadata.projectId}: ${p.metadata.projectName}`);
    });
    process.exit(1);
  }

  const filePath = path.join(dataDir, fileName);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const existingIds = projectManager.getExistingIds(input.projectId);
  const newId = idGenerator.generateId(input.projectId, input.type, existingIds);

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

  if (input.type === 'stakeholder' && input.stakeholder) {
    newRequirement.stakeholder = input.stakeholder;
  }

  data[newId] = newRequirement;

  if (data._metadata) {
    data._metadata.updatedAt = now;
    data._metadata.requirementCount = Object.keys(data).filter(k => k !== '_metadata').length;
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log('\n✅ 要求を追加しました');
  console.log(`\nID: ${newId}`);
  console.log(`プロジェクト: ${input.projectId}`);
  console.log(`タイトル: ${input.title}`);
  console.log(`タイプ: ${input.type}`);
  console.log(`優先度: ${input.priority}`);
  console.log(`ステータス: ${input.status}`);
  if (newRequirement.stakeholder) {
    console.log(`ステークホルダ: ${newRequirement.stakeholder}`);
  }

  return newId;
}

// バリデーション実行
async function validateRequirement(client: Client, projectId: string, reqId: string): Promise<any> {
  console.log('\n🔍 妥当性チェックを実行中...');

  const result = await client.callTool({
    name: 'validate_requirement',
    arguments: {
      projectId,
      id: reqId,
    },
  });

  const data = parseToolResponse(result.content[0].text);
  return data || { summary: { totalViolations: 0, totalRecommendations: 0 } };
}

// トレーサビリティ候補を検索
async function findTracabilityCandidates(
  client: Client,
  projectId: string,
  reqId: string,
  reqType: string
): Promise<any[]> {
  console.log('\n🔗 トレーサビリティ候補を検索中...');

  // analyze_impactで関連要求を取得
  const impactResult = await client.callTool({
    name: 'analyze_impact',
    arguments: {
      projectId,
      id: reqId,
    },
  });

  const impactData = parseToolResponse(impactResult.content[0].text);

  // 要求タイプに応じて適切な関連付けを提案
  const candidates: any[] = [];

  if (reqType === 'stakeholder') {
    // ステークホルダ要求の場合、関連するシステム要求を提案
    const searchResult = await client.callTool({
      name: 'search_requirements',
      arguments: {
        projectId,
        type: 'system',
      },
    });

    const systemReqs = parseToolResponse(searchResult.content[0].text);
    if (systemReqs.requirements && systemReqs.requirements.length > 0) {
      candidates.push({
        type: 'refines',
        direction: 'to',
        requirements: systemReqs.requirements.slice(0, 5), // 上位5件
      });
    }
  } else if (reqType === 'system') {
    // システム要求の場合、ステークホルダ要求と機能要求を提案
    const stkResult = await client.callTool({
      name: 'search_requirements',
      arguments: {
        projectId,
        type: 'stakeholder',
      },
    });

    const funcResult = await client.callTool({
      name: 'search_requirements',
      arguments: {
        projectId,
        type: 'system_functional',
      },
    });

    const stkReqs = parseToolResponse(stkResult.content[0].text);
    const funcReqs = parseToolResponse(funcResult.content[0].text);

    if (stkReqs.requirements && stkReqs.requirements.length > 0) {
      candidates.push({
        type: 'refines',
        direction: 'from',
        requirements: stkReqs.requirements.slice(0, 3),
      });
    }

    if (funcReqs.requirements && funcReqs.requirements.length > 0) {
      candidates.push({
        type: 'refines',
        direction: 'to',
        requirements: funcReqs.requirements.slice(0, 3),
      });
    }
  } else if (reqType === 'system_functional') {
    // 機能要求の場合、ステークホルダ要求とシステム要求との関連を提案
    const stkResult = await client.callTool({
      name: 'search_requirements',
      arguments: {
        projectId,
        type: 'stakeholder',
      },
    });

    const sysResult = await client.callTool({
      name: 'search_requirements',
      arguments: {
        projectId,
        type: 'system',
      },
    });

    console.log('\n[DEBUG] Raw stkResult type:', stkResult.content[0].text.substring(0, 200));
    console.log('\n[DEBUG] Raw sysResult type:', sysResult.content[0].text.substring(0, 200));

    const stkReqs = parseToolResponse(stkResult.content[0].text);
    const sysReqs = parseToolResponse(sysResult.content[0].text);

    console.log('\n[DEBUG] Parsed stkReqs has requirements?', !!stkReqs.requirements, 'length:', stkReqs.requirements?.length);
    console.log('\n[DEBUG] Parsed sysReqs has requirements?', !!sysReqs.requirements, 'length:', sysReqs.requirements?.length);

    // projectIdでフィルタリング（MCPツールが全プロジェクトを返す問題の回避）
    // watch-projectの場合: STK-, SYS-, FUNC-のみを抽出
    const projectPrefix = projectId === 'watch-project' ? /^(STK|SYS|FUNC)-\d{3}$/ : new RegExp(`^${projectId.toUpperCase().substring(0, 3)}`);

    if (stkReqs.requirements) {
      stkReqs.requirements = stkReqs.requirements.filter((req: any) =>
        projectPrefix.test(req.id)
      ).slice(0, 3);
    }

    if (sysReqs.requirements) {
      sysReqs.requirements = sysReqs.requirements.filter((req: any) =>
        projectPrefix.test(req.id)
      ).slice(0, 3);
    }

    console.log('\n[DEBUG] Filtered stkReqs:', JSON.stringify(stkReqs, null, 2));
    console.log('\n[DEBUG] Filtered sysReqs:', JSON.stringify(sysReqs, null, 2));

    if (stkReqs.requirements && stkReqs.requirements.length > 0) {
      candidates.push({
        type: 'refines',
        direction: 'from',
        requirements: stkReqs.requirements.slice(0, 3),
      });
    }

    if (sysReqs.requirements && sysReqs.requirements.length > 0) {
      candidates.push({
        type: 'refines',
        direction: 'from',
        requirements: sysReqs.requirements.slice(0, 3),
      });
    }
  }

  return candidates;
}

// リンクを追加
async function addLink(
  client: Client,
  projectId: string,
  sourceId: string,
  targetId: string
): Promise<void> {
  // update_requirementで依存関係を追加
  const getResult = await client.callTool({
    name: 'get_requirement',
    arguments: {
      projectId,
      id: sourceId,
    },
  });

  const req = parseToolResponse(getResult.content[0].text);
  const currentRefines = req.refines || [];

  await client.callTool({
    name: 'update_requirement',
    arguments: {
      projectId,
      id: sourceId,
      refines: [...currentRefines, targetId],
    },
  });
}

// メイン処理
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
品質保証付き要求追加スクリプト

使用方法:
  npx tsx scripts/add-requirement-with-qa.ts [options]

必須オプション:
  --projectId <id>       プロジェクトID
  --type <type>          要求タイプ (stakeholder, system, system_functional)
  --title <text>         要求タイトル
  --description <text>   要求の説明
  --priority <level>     優先度 (critical, high, medium, low)
  --status <status>      ステータス (draft, approved, etc.)

任意オプション:
  --category <text>      カテゴリ
  --author <name>        文書化者
  --stakeholder <name>   ステークホルダ
  --rationale <text>     根拠
  --tags <tag1,tag2>     タグ (カンマ区切り)

機能:
  ✅ 要求の妥当性を自動チェック
  ✅ トレーサビリティ候補を自動検出
  ✅ ユーザー承認を得て関連付け
    `);
    process.exit(0);
  }

  const input = parseArgs();
  if (!input) {
    process.exit(1);
  }

  let client: Client | null = null;

  try {
    // 1. 要求を追加
    const newId = addRequirement(input);

    // 2. MCPクライアント初期化
    console.log('\n🚀 MCPサーバーに接続中...');
    client = await initMCPClient();
    console.log('✅ MCPサーバーに接続しました');

    // 3. バリデーション実行
    const validationResult = await validateRequirement(client, input.projectId, newId);

    console.log('\n📊 バリデーション結果:');
    console.log(`  総違反数: ${validationResult.summary?.totalViolations || 0}`);
    console.log(`  推奨事項: ${validationResult.summary?.totalRecommendations || 0}`);

    if (validationResult.violations && validationResult.violations.length > 0) {
      console.log('\n⚠️  検出された問題:');
      validationResult.violations.slice(0, 3).forEach((v: any, i: number) => {
        console.log(`  ${i + 1}. [${v.severity}] ${v.message}`);
        if (v.recommendation) {
          console.log(`     推奨: ${v.recommendation}`);
        }
      });
    } else {
      console.log('✅ 問題は検出されませんでした');
    }

    // 4. トレーサビリティ候補を検索
    const candidates = await findTracabilityCandidates(
      client,
      input.projectId,
      newId,
      input.type
    );

    if (candidates.length === 0) {
      console.log('\n📝 トレーサビリティ候補が見つかりませんでした');
      console.log('   このプロジェクトには、まだ関連付け可能な他の要求がありません。');
      console.log('   今後、関連する要求を追加した際に、リンクを作成することをお勧めします。');
    } else {
      console.log('\n🔗 トレーサビリティ候補が見つかりました:');

      for (const candidate of candidates) {
        const direction = candidate.direction === 'from' ? '←' : '→';
        const relationText = candidate.direction === 'from'
          ? 'この要求を詳細化する要求'
          : 'この要求が詳細化する要求';

        console.log(`\n  ${relationText}:`);

        for (const req of candidate.requirements) {
          console.log(`    ${direction} ${req.id}: ${req.title}`);
        }

        const answer = await prompt('\n  これらの要求とリンクしますか？ (y/n): ');

        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          // ユーザーに具体的なIDを選択させる
          console.log('\n  リンクする要求のIDを入力してください（カンマ区切りで複数可）:');
          const ids = await prompt('  ID: ');
          const selectedIds = ids.split(',').map(id => id.trim()).filter(id => id);

          for (const targetId of selectedIds) {
            try {
              if (candidate.direction === 'to') {
                await addLink(client, input.projectId, newId, targetId);
                console.log(`  ✅ ${newId} → ${targetId} のリンクを追加しました`);
              } else {
                await addLink(client, input.projectId, targetId, newId);
                console.log(`  ✅ ${targetId} → ${newId} のリンクを追加しました`);
              }
            } catch (error) {
              console.error(`  ❌ リンク追加エラー: ${error}`);
            }
          }
        }
      }
    }

    console.log('\n✨ 完了しました！');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

main();
