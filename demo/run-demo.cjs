#!/usr/bin/env node
/**
 * デモ実行スクリプト
 * シナリオに基づいて自動的にデモを実行
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const OBSWebSocket = require('obs-websocket-js').default;

const execAsync = promisify(exec);

class DemoRunner {
  constructor(scenarioPath, options = {}) {
    this.scenarioPath = scenarioPath;
    this.options = {
      obsHost: options.obsHost || 'localhost:4455',
      obsPassword: options.obsPassword || '',
      dryRun: options.dryRun || false,
      skipRecording: options.skipRecording || false,
      ...options
    };
    this.obs = null;
  }

  async init() {
    // シナリオを読み込み
    const scenarioData = await fs.readFile(this.scenarioPath, 'utf-8');
    this.scenario = JSON.parse(scenarioData);

    console.log(`🎬 デモシナリオ: ${this.scenario.title}`);
    console.log(`⏱️  想定時間: ${this.scenario.duration}`);
    console.log(`📝 説明: ${this.scenario.description}\n`);

    // OBSに接続
    if (!this.options.skipRecording) {
      await this.connectOBS();
    }
  }

  async connectOBS() {
    try {
      this.obs = new OBSWebSocket();
      await this.obs.connect(`ws://${this.options.obsHost}`, this.options.obsPassword);
      console.log('✅ OBS WebSocketに接続しました\n');
    } catch (error) {
      console.error('⚠️  OBSに接続できませんでした:', error.message);
      console.log('   録画なしで続行します（--skip-recordingオプション）\n');
      this.options.skipRecording = true;
    }
  }

  async executeAction(action) {
    if (this.options.dryRun) {
      console.log(`   [DRY RUN] ${action.type}:`, JSON.stringify(action));
      await this.sleep(100);
      return;
    }

    // PowerShellスクリプトを呼び出して操作を実行
    const psScript = path.join(__dirname, 'automation-helper.ps1');
    const actionJson = JSON.stringify(action).replace(/"/g, '\\"');

    try {
      await execAsync(`powershell -ExecutionPolicy Bypass -File "${psScript}" "${actionJson}"`);
    } catch (error) {
      console.error(`   ❌ アクション実行エラー:`, error.message);
    }
  }

  async runScene(scene) {
    console.log(`\n📍 シーン: ${scene.id}`);
    console.log(`   ${scene.narration}\n`);

    // 音声ファイルを再生（オプション）
    const audioPath = path.join(__dirname, 'narrations', this.scenario.id, `${scene.id}.wav`);
    try {
      await fs.access(audioPath);
      console.log(`🔊 音声再生: ${scene.id}.wav`);
      if (!this.options.dryRun) {
        // Windows Media Playerで再生
        exec(`start wmplayer "${audioPath}"`);
      }
    } catch {
      console.log(`⏭️  音声ファイルなし: ${scene.id}.wav`);
    }

    // アクションを順次実行
    for (const action of scene.actions) {
      console.log(`   ⚡ ${action.type}`);
      await this.executeAction(action);
    }

    await this.sleep(scene.duration * 1000);
  }

  async run() {
    try {
      // 録画開始
      if (!this.options.skipRecording && this.obs) {
        console.log('🎥 録画開始...\n');
        await this.obs.call('StartRecord');
        await this.sleep(2000);
      }

      // 各シーンを実行
      for (const scene of this.scenario.scenes) {
        await this.runScene(scene);
      }

      // 録画停止
      if (!this.options.skipRecording && this.obs) {
        console.log('\n🎥 録画停止...');
        await this.obs.call('StopRecord');
        await this.sleep(1000);
      }

      console.log('\n🎉 デモ実行完了！');

    } catch (error) {
      console.error('\n❌ エラー:', error);
      throw error;
    } finally {
      if (this.obs) {
        await this.obs.disconnect();
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// コマンドライン引数の処理
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
使い方: node run-demo.js <scenario-file> [options]

オプション:
  --dry-run          ドライランモード（実際の操作を行わない）
  --skip-recording   録画をスキップ
  --obs-host HOST    OBS WebSocketホスト（デフォルト: localhost:4455）
  --obs-password PWD OBS WebSocketパスワード

例:
  node run-demo.js scenarios/01-basic-usage.json
  node run-demo.js scenarios/01-basic-usage.json --dry-run
  node run-demo.js scenarios/01-basic-usage.json --skip-recording
    `);
    process.exit(0);
  }

  const scenarioFile = args.find(arg => !arg.startsWith('--'));
  if (!scenarioFile) {
    console.error('❌ シナリオファイルを指定してください');
    process.exit(1);
  }

  const scenarioPath = path.resolve(scenarioFile);

  const dryRun = args.includes('--dry-run');
  const options = {
    dryRun: dryRun,
    skipRecording: args.includes('--skip-recording') || dryRun, // dry-runの場合は録画もスキップ
    obsHost: args.includes('--obs-host') ? args[args.indexOf('--obs-host') + 1] : undefined,
    obsPassword: args.includes('--obs-password') ? args[args.indexOf('--obs-password') + 1] : undefined,
  };

  const runner = new DemoRunner(scenarioPath, options);
  await runner.init();
  await runner.run();
}

main().catch(console.error);
