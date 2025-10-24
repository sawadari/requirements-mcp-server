/**
 * MCPサーバー経由で妥当性チェックを実行
 */

const { spawn } = require('child_process');
const path = require('path');

async function callMCPTool(toolName, args = {}) {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, '..', 'dist', 'index.js');

    const mcp = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    mcp.stdout.on('data', (data) => {
      output += data.toString();
    });

    mcp.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    mcp.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`MCP server exited with code ${code}: ${errorOutput}`));
      } else {
        try {
          // JSON-RPC レスポンスをパース
          const lines = output.split('\n').filter(line => line.trim());
          const lastLine = lines[lines.length - 1];
          const response = JSON.parse(lastLine);
          resolve(response.result);
        } catch (error) {
          reject(new Error(`Failed to parse MCP response: ${error.message}`));
        }
      }
    });

    // JSON-RPC リクエストを送信
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    mcp.stdin.write(JSON.stringify(request) + '\n');
    mcp.stdin.end();
  });
}

async function validateRequirements() {
  try {
    console.log('🔍 MCP経由で妥当性チェックを実行します...\n');

    // プロジェクトを切り替え
    console.log('📁 プロジェクトを「water-heater」に切り替えます...');
    await callMCPTool('switch_project', { projectId: 'water-heater' });
    console.log('✅ プロジェクト切り替え完了\n');

    // すべての要求をリスト
    console.log('📝 要求一覧を取得します...');
    const requirements = await callMCPTool('list_requirements', {});
    console.log(`✅ ${requirements.length}件の要求を取得しました\n`);

    // 各要求を検証
    console.log('=' .repeat(80));
    console.log('妥当性チェック結果');
    console.log('=' .repeat(80) + '\n');

    let passCount = 0;
    let failCount = 0;
    const violations = [];

    for (const req of requirements) {
      try {
        const result = await callMCPTool('validate_requirement', {
          id: req.id,
          useLLM: false
        });

        const status = result.isValid ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${req.id}: ${req.title}`);
        console.log(`   品質スコア: ${result.qualityScore.toFixed(1)}/100`);

        if (result.isValid) {
          passCount++;
        } else {
          failCount++;
          violations.push({
            id: req.id,
            title: req.title,
            violations: result.violations
          });
        }

        if (result.violations && result.violations.length > 0) {
          console.log('   違反項目:');
          result.violations.forEach(v => {
            console.log(`     - [${v.severity}] ${v.code}: ${v.message}`);
          });
        }

        if (result.suggestions && result.suggestions.length > 0) {
          console.log('   改善提案:');
          result.suggestions.forEach(s => {
            console.log(`     💡 ${s}`);
          });
        }
        console.log('');
      } catch (error) {
        console.error(`❌ ${req.id}の検証に失敗: ${error.message}`);
        failCount++;
      }
    }

    // サマリー
    console.log('=' .repeat(80));
    console.log('検証サマリー');
    console.log('=' .repeat(80));
    console.log(`✅ 合格: ${passCount}件`);
    console.log(`❌ 不合格: ${failCount}件`);
    console.log(`📊 合格率: ${((passCount / requirements.length) * 100).toFixed(1)}%`);

    // 違反の詳細
    if (violations.length > 0) {
      console.log('\n' + '=' .repeat(80));
      console.log('修正が必要な要求');
      console.log('=' .repeat(80));

      violations.forEach(v => {
        console.log(`\n${v.id}: ${v.title}`);
        if (v.violations) {
          v.violations.forEach(violation => {
            console.log(`  - [${violation.severity}] ${violation.code}: ${violation.message}`);
            if (violation.suggestion) {
              console.log(`    💡 ${violation.suggestion}`);
            }
          });
        }
      });
    }

    if (failCount === 0) {
      console.log('\n🎉 すべての要求が妥当性チェックに合格しました！');
    } else {
      console.log(`\n⚠️  ${failCount}件の要求に問題があります。修正が必要です。`);
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

validateRequirements();
