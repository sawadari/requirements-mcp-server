# view-server安全再起動スクリプト
# Claude Codeを止めずにview-serverのみを再起動

param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "🔄 View Server 再起動スクリプト" -ForegroundColor Cyan
Write-Host ""

# PIDファイルのパス
$pidFile = Join-Path $PSScriptRoot ".." "data" "view-server.pid"
$logFile = Join-Path $PSScriptRoot ".." "logs" "view-server.log"

# ログディレクトリ作成
$logsDir = Join-Path $PSScriptRoot ".." "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}

# 既存のview-serverプロセスを停止
if (Test-Path $pidFile) {
    $pid = Get-Content $pidFile
    Write-Host "📋 PIDファイル検出: $pid" -ForegroundColor Yellow

    try {
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "⏹️  既存プロセス停止中 (PID: $pid)..." -ForegroundColor Yellow
            $process.Kill()
            Start-Sleep -Seconds 2

            # プロセスが終了したか確認
            $stillRunning = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($stillRunning) {
                Write-Host "⚠️  プロセスが終了しませんでした。強制終了します。" -ForegroundColor Red
                taskkill /F /PID $pid
                Start-Sleep -Seconds 1
            }

            Write-Host "✅ プロセス停止完了" -ForegroundColor Green
        } else {
            Write-Host "ℹ️  PIDファイルのプロセスは既に終了しています" -ForegroundColor Gray
        }
    } catch {
        Write-Host "⚠️  プロセス停止エラー: $_" -ForegroundColor Yellow
    }

    Remove-Item $pidFile -Force
}

# ポート5002を使用しているプロセスを探して停止
Write-Host "🔍 ポート5002使用プロセスをチェック中..." -ForegroundColor Cyan
$portProcess = netstat -ano | Select-String ":5002.*LISTENING"
if ($portProcess) {
    $portPid = ($portProcess -split '\s+')[-1]
    Write-Host "⚠️  ポート5002を使用中のプロセス発見 (PID: $portPid)" -ForegroundColor Yellow

    try {
        $process = Get-Process -Id $portPid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "⏹️  ポート5002使用プロセス停止中..." -ForegroundColor Yellow
            $process.Kill()
            Start-Sleep -Seconds 2
            Write-Host "✅ プロセス停止完了" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  プロセス停止エラー: $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🚀 新しいview-serverを起動中..." -ForegroundColor Cyan

# プロジェクトディレクトリ
$projectDir = Join-Path $PSScriptRoot ".."

# ビルド実行
Write-Host "🔨 ビルド中..." -ForegroundColor Cyan
Push-Location $projectDir
try {
    npm run build 2>&1 | Out-File -FilePath $logFile -Encoding utf8
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ビルド失敗" -ForegroundColor Red
        Get-Content $logFile -Tail 20
        exit 1
    }
    Write-Host "✅ ビルド完了" -ForegroundColor Green
} finally {
    Pop-Location
}

# view-serverをバックグラウンドで起動
$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = "node"
$startInfo.Arguments = "build/view-server.js"
$startInfo.WorkingDirectory = $projectDir
$startInfo.UseShellExecute = $false
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError = $true
$startInfo.CreateNoWindow = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $startInfo

# 出力をログファイルにリダイレクト
$process.OutputDataReceived += {
    if ($null -ne $EventArgs.Data) {
        Add-Content -Path $logFile -Value $EventArgs.Data
    }
}
$process.ErrorDataReceived += {
    if ($null -ne $EventArgs.Data) {
        Add-Content -Path $logFile -Value "[ERROR] $($EventArgs.Data)"
    }
}

$process.Start() | Out-Null
$process.BeginOutputReadLine()
$process.BeginErrorReadLine()

# PIDを保存
$process.Id | Out-File -FilePath $pidFile -Encoding utf8

Write-Host "✅ View Server起動完了 (PID: $($process.Id))" -ForegroundColor Green
Write-Host "📊 ログファイル: $logFile" -ForegroundColor Gray
Write-Host "🌐 URL: http://localhost:5002" -ForegroundColor Cyan
Write-Host ""
Write-Host "停止するには: Get-Process -Id $($process.Id) | Stop-Process" -ForegroundColor Gray
