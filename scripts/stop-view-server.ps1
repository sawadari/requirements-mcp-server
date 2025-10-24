# view-server stop script

$ErrorActionPreference = "Stop"

Write-Host "Stopping View Server..." -ForegroundColor Yellow
Write-Host ""

$pidFile = Join-Path $PSScriptRoot ".." "data" "view-server.pid"

if (Test-Path $pidFile) {
    $pid = Get-Content $pidFile
    Write-Host "PID file found: $pid" -ForegroundColor Yellow

    try {
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Stopping process (PID: $pid)..." -ForegroundColor Yellow
            $process.Kill()
            Start-Sleep -Seconds 2
            Write-Host "Process stopped successfully" -ForegroundColor Green
        } else {
            Write-Host "Process already stopped" -ForegroundColor Gray
        }
    } catch {
        Write-Host "Error: $_" -ForegroundColor Yellow
    }

    Remove-Item $pidFile -Force
} else {
    Write-Host "PID file not found" -ForegroundColor Gray

    # Find process using port 5002
    $portProcess = netstat -ano | Select-String ":5002.*LISTENING"
    if ($portProcess) {
        $portPid = ($portProcess -split '\s+')[-1]
        Write-Host "Found process using port 5002 (PID: $portPid)" -ForegroundColor Yellow

        try {
            $process = Get-Process -Id $portPid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "Stopping process..." -ForegroundColor Yellow
                $process.Kill()
                Start-Sleep -Seconds 2
                Write-Host "Process stopped successfully" -ForegroundColor Green
            }
        } catch {
            Write-Host "Error: $_" -ForegroundColor Yellow
        }
    } else {
        Write-Host "No process using port 5002" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Done" -ForegroundColor Green
