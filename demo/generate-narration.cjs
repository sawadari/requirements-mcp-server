#!/usr/bin/env node
/**
 * 音声生成スクリプト
 * シナリオファイルから音声ファイルを生成
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function generateAudioWithPowerShell(text, outputPath) {
  // 一時PowerShellスクリプトファイルを作成
  const tempScriptPath = path.join(__dirname, 'temp-tts.ps1');
  const psScript = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SetOutputToWaveFile("${outputPath.replace(/\\/g, '\\\\')}")
$synth.Rate = 0
$synth.Speak(@"
${text}
"@)
$synth.Dispose()
  `.trim();

  // UTF8 BOMでスクリプトファイルを作成
  await fs.writeFile(tempScriptPath, '\uFEFF' + psScript, 'utf-8');

  try {
    await execAsync(`powershell -ExecutionPolicy Bypass -File "${tempScriptPath}"`);
  } finally {
    // 一時ファイルを削除
    await fs.unlink(tempScriptPath).catch(() => {});
  }
}

async function generateNarration(scenarioPath) {
  console.log(`📖 シナリオを読み込み中: ${scenarioPath}`);

  // シナリオファイルを読み込み
  const scenarioData = await fs.readFile(scenarioPath, 'utf-8');
  const scenario = JSON.parse(scenarioData);

  console.log(`🎬 シナリオ: ${scenario.title}`);
  console.log(`⏱️  想定時間: ${scenario.duration}\n`);

  // narrations ディレクトリを作成
  const narrationsDir = path.join(__dirname, 'narrations', scenario.id);
  await fs.mkdir(narrationsDir, { recursive: true });

  // 各シーンのナレーションを生成
  for (const scene of scenario.scenes) {
    if (!scene.narration) {
      console.log(`⏭️  スキップ: ${scene.id} (ナレーションなし)`);
      continue;
    }

    const outputPath = path.join(narrationsDir, `${scene.id}.wav`);

    console.log(`🎙️  生成中: ${scene.id}`);
    console.log(`   テキスト: "${scene.narration.substring(0, 50)}..."`);

    try {
      // PowerShell TTS で音声生成
      await generateAudioWithPowerShell(scene.narration, outputPath);
      console.log(`✅ 完了: ${outputPath}\n`);
    } catch (error) {
      console.error(`❌ エラー: ${scene.id}`, error.message);
    }
  }

  console.log(`\n🎉 音声生成完了: ${scenario.id}`);
  console.log(`📁 出力先: ${narrationsDir}`);
}

async function generateAllNarrations() {
  const scenariosDir = path.join(__dirname, 'scenarios');

  try {
    const files = await fs.readdir(scenariosDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    console.log(`📚 ${jsonFiles.length}個のシナリオを発見\n`);

    for (const file of jsonFiles) {
      const scenarioPath = path.join(scenariosDir, file);
      await generateNarration(scenarioPath);
      console.log('─'.repeat(50) + '\n');
    }

    console.log('🎊 すべての音声生成が完了しました！');
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

// コマンドライン引数の処理
const args = process.argv.slice(2);

if (args.length > 0) {
  // 特定のシナリオのみ生成
  const scenarioPath = path.resolve(args[0]);
  generateNarration(scenarioPath).catch(console.error);
} else {
  // すべてのシナリオを生成
  generateAllNarrations().catch(console.error);
}
