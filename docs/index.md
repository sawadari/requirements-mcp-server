---
title: 要求管理 MCP サーバー
layout: default
description: AIと人間の協同で、要求を構造化し、品質を自動維持。再利用とデータ互換を標準にする要求管理基盤。
---

<style>
/* ====== Minimal inline styles for a clean LP ====== */
:root {
  --fg:#111; --muted:#555; --bg:#fff; --card:#fafafa; --line:#eee; --brand:#0b5fff;
}
* {box-sizing: border-box;}
body { color:var(--fg); background:var(--bg); line-height:1.85; }
.container {max-width: 1080px; margin: 0 auto; padding: 24px;}
.hero {text-align:center; padding: 32px 0 16px;}
.hero h1 {font-size: 2.2rem; margin:.2em 0;}
.hero p {color:var(--muted); margin:.2em 0 1.2em;}
.badges {display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin: 8px 0 24px;}
.badge {border:1px solid var(--line); border-radius: 999px; padding: .25em .75em; font-size:.92rem; background:var(--card);}
.btns {display:flex; gap:12px; justify-content:center; flex-wrap:wrap;}
.btn {display:inline-block; padding:.7em 1.1em; border:1px solid var(--brand); color:#fff; background:var(--brand); border-radius:8px; text-decoration:none;}
.btn--ghost {background:transparent; color:var(--brand);}
.section {padding: 32px 0; border-top:1px solid var(--line);}
.section h2 {font-size:1.6rem; margin-bottom:.6em;}
.lead {font-weight:600;}
.grid {display:grid; gap:16px;}
.grid--3 {grid-template-columns: repeat(3, minmax(0,1fr));}
.grid--2 {grid-template-columns: repeat(2, minmax(0,1fr));}
@media (max-width: 900px) { .grid--3 {grid-template-columns:1fr 1fr;} }
@media (max-width: 640px) { .grid--3, .grid--2 {grid-template-columns:1fr;} }
.card {background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px;}
.card h3 {margin-top:0; font-size:1.1rem;}
.kicker {font-size:.85rem; letter-spacing:.04em; color:var(--muted); text-transform:uppercase;}
.table {width:100%; border-collapse: collapse; font-size:.98rem;}
.table th, .table td {border:1px solid var(--line); padding:.65em .7em; vertical-align:top;}
.table th {background:#f6f8ff; text-align:left; color:#111;}
.callout {border-left:4px solid var(--brand); background:#f6f8ff; padding:12px 14px; border-radius:6px; margin:14px 0;}
.small {font-size:.92rem; color:var(--muted);}
summary {cursor:pointer; font-weight:600;}
.hr {height:1px; background:var(--line); margin:24px 0;}
.center {text-align:center;}
.code {font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; background:#f6f8fa; padding:.2em .45em; border-radius:6px;}
</style>

<div class="container">
  <div class="hero">
    <div class="kicker">AI × Human-in-the-loop</div>
    <h1>開発要求を "資産" にする要求管理 MCP サーバー</h1>
    <p>完全性・無矛盾性・トレース性・テスト可能性・単一性を、AIと人間の協同で機械的に維持。<br>再利用・共有・連携を前提にした要求基盤。</p>
    <div class="badges">
      <span class="badge">構造化要求（階層/属性/リンク）</span>
      <span class="badge">妥当性チェックと自動修正</span>
      <span class="badge">JSON形式でデータ互換</span>
      <span class="badge">ドメイン別にカスタマイズ</span>
    </div>
    <div class="btns">
      <a class="btn" href="https://github.com/sawadari/requirements-mcp-server" target="_blank" rel="noopener">GitHubで見る</a>
      <a class="btn btn--ghost" href="{{ site.baseurl }}/blog/">ブログ</a>
      <a class="btn btn--ghost" href="#quickstart">クイックスタート</a>
    </div>
  </div>

  <!-- 要点 -->
  <div class="section">
    <h2>これだけは伝えたい</h2>
    <p class="lead">要求は開発インプットの中核。品質が高いほど再利用性と共有性が高まり、維持コストが下がる。</p>
    <div class="grid grid--3">
      <div class="card">
        <h3>品質の5原則</h3>
        <ul>
          <li><strong>完全性</strong>：目的/前提/制約/条件/検証観点の抜け漏れ防止</li>
          <li><strong>無矛盾性</strong>：同一/他レベル間の衝突を検知</li>
          <li><strong>トレース性</strong>：上位→下位→テストの連鎖を辿れる</li>
          <li><strong>テスト可能性</strong>：観測可能な受入条件を持つ</li>
          <li><strong>単一性</strong>：重複・二重定義を排除</li>
        </ul>
      </div>
      <div class="card">
        <h3>AI × 人間の協同</h3>
        <p>再利用性は<strong>構造化</strong>、品質維持は<strong>妥当性チェック＋自動修正</strong>で実現。人間は承認と意思決定に集中。</p>
      </div>
      <div class="card">
        <h3>互換・拡張</h3>
        <p>JSON形式でツール連携しやすく、語彙/テンプレ/禁止語などの<strong>チェックルール</strong>をプロジェクト別にプロファイル化。</p>
      </div>
    </div>
  </div>

  <!-- 妥当性チェック -->
  <div class="section" id="validation">
    <h2>妥当性チェックの中身</h2>
    <div class="grid grid--2">
      <div class="card">
        <h3>論理・構造の検査</h3>
        <ul>
          <li>親子整合・参照一貫性・リンク切れ検出</li>
          <li>重複/矛盾/循環参照の検出</li>
          <li>番号規則・版管理・変更理由の必須化</li>
        </ul>
      </div>
      <div class="card">
        <h3>表現・記述の検査</h3>
        <ul>
          <li>曖昧語（例：「なるべく」「適切に」）の検出と具体化提案</li>
          <li>用語統一（用語表/辞書に基づく正規化）</li>
          <li>テンプレ逸脱や受入条件欠落の検出</li>
        </ul>
      </div>
    </div>
    <div class="callout small">※ チェックルールはドメインや規格（例：ISO 26262、セキュリティ）に合わせて拡張可能</div>
  </div>

  <!-- 自動修正と人間の関与 -->
  <div class="section">
    <h2>自動修正の特徴と Human-in-the-loop</h2>
    <div class="grid grid--3">
      <div class="card">
        <h3>AIの修正提案</h3>
        <p>曖昧語の具体化、受入基準の補完、重複統合、用語統一、参照の張り直しを自動提案。</p>
      </div>
      <div class="card">
        <h3>承認フロー</h3>
        <p>AI → <strong>修正案</strong>／人 → <strong>承認/差戻し</strong>。承認後はトレース更新・差分記録を自動で反映。</p>
      </div>
      <div class="card">
        <h3>説明責任の担保</h3>
        <p>修正差分・理由・影響範囲を保持。レビューは「問題指摘」から「提案承認」にシフトし、認知負荷を低減。</p>
      </div>
    </div>
  </div>

  <!-- 使い方 -->
  <div class="section" id="howto">
    <h2>どう使うのか（フロー）</h2>
    <ol>
      <li>要望を自然文で投入（チャット/フォーム）。</li>
      <li>AIが要求候補を<strong>構造化</strong>（階層・属性・リンク）。</li>
      <li><a href="#validation">妥当性チェック</a>を実施し、修正案を提示。</li>
      <li>人間が<strong>承認</strong>（承認後にトレース・テストリンク更新）。</li>
      <li>JSON形式で保存し、テスト/タスク管理に連携。</li>
    </ol>
    <div class="callout">初期起こし・整理・統一・重複排除・テスト観点付与が自動化。<strong>レビュー時間を短縮</strong>し、改版維持を機械化。</div>
  </div>

  <!-- 互換性/カスタマイズ -->
  <div class="section">
    <h2>データ互換性とカスタマイズ性</h2>
    <div class="grid grid--2">
      <div class="card">
        <h3>データ互換性</h3>
        <ul>
          <li>入出力：JSON形式（テスト/チケット管理ツールと連携）</li>
          <li>リンク：要求ID・親子・参照・テスト・仕様章節に紐付け</li>
          <li>移行：既存データからJSON形式への再構造化を支援</li>
        </ul>
      </div>
      <div class="card">
        <h3>カスタマイズ性</h3>
        <ul>
          <li>語彙/テンプレ/禁止語/番号規則をプロジェクト別に設定</li>
          <li>安全/法規/機能安全などの属性拡張</li>
          <li>業界特有の指標や言い回しに適合</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- 比較と考察 -->
  <div class="section">
    <h2>比較と考察</h2>
    <table class="table">
      <thead>
        <tr>
          <th>観点</th>
          <th>ChatGPTだけで要求を書く</th>
          <th>人間だけで作成/維持</th>
          <th><strong>AI＋MCP（本サーバー）</strong></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>初期スピード</td>
          <td>◎ 下書きは速い</td>
          <td>△ 速度は人依存</td>
          <td>◎ 自動構造化で迅速</td>
        </tr>
        <tr>
          <td>再利用性</td>
          <td>△ 構造・リンクは手作業</td>
          <td>○ ルール化で可</td>
          <td><strong>◎ 構造＋検証が前提</strong></td>
        </tr>
        <tr>
          <td>正確性・維持</td>
          <td>△ 運用次第でばらつき</td>
          <td>○ 高精度だが維持が重い</td>
          <td><strong>◎ 機械的維持で安定</strong></td>
        </tr>
        <tr>
          <td>説明責任（差分/根拠）</td>
          <td>△ 手作業で追従</td>
          <td>○ ドキュメント化で担保</td>
          <td><strong>◎ 自動差分/影響提示</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="hr"></div>

    <p>● <strong>AIは本当に必要？ MCPだけで良い？</strong><br>
    MCPだけだと"置き場"はできますが、<strong>品質維持の自動化</strong>が不在。<br>
    <strong>AI＋MCP</strong>で「作る（人）」と「守る（機械）」を分担するのが最短距離。</p>

    <p>● <strong>AI協同の未来</strong><br>
    人間は未来を見据えたインプットの創出に集中し、AIはアウトプットの生成・維持・整合を継続実行。<br>
    その結果、<strong>変化に強いデジタル要求資産</strong>が蓄積します。</p>
  </div>

  <!-- 今後のアップデート予定 -->
  <div class="section">
    <h2>今後のアップデート予定</h2>
    <div class="card">
      <h3>📋 ReqIF対応</h3>
      <p>国際標準規格 ReqIF (Requirements Interchange Format) に対応し、他の要求管理ツールとのデータ交換を実現します。</p>
      <ul>
        <li><strong>ReqIF エクスポート</strong>：JSON形式からReqIF形式への変換</li>
        <li><strong>ReqIF インポート</strong>：ReqIF形式からJSON形式への変換</li>
        <li><strong>対応ツール</strong>：DOORS、Polarion、Codebeamerなど主要ツールとの連携</li>
      </ul>
      <p class="small">※ リリース時期は開発状況により変更される場合があります。</p>
    </div>
  </div>

  <!-- クイックスタート -->
  <div class="section" id="quickstart">
    <h2>クイックスタート</h2>
    <ol>
      <li>リポジトリを取得（<a href="https://github.com/sawadari/requirements-mcp-server" target="_blank" rel="noopener">GitHub</a>）。</li>
      <li>サンプル JSON ファイルを投入。</li>
      <li>チェックルール（語彙/テンプレ/禁止語/番号規則）を設定。</li>
      <li>要望を投入 → 構造化 → 妥当性チェック → 承認。</li>
    </ol>
    <p class="center"><a class="btn" href="https://github.com/sawadari/requirements-mcp-server" target="_blank" rel="noopener">GitHubで始める</a></p>
    <p class="small center">※ プロジェクトページの場合は <span class="code">_config.yml</span> に <span class="code">baseurl: "/requirements-mcp-server"</span> を設定してください。</p>
  </div>
</div>
