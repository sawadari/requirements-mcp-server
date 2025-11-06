# PowerShell Automation Helper
# キーボード・マウス操作を自動化

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# キー送信関数
function Send-Keys {
    param([string]$Keys, [int]$Wait = 500)
    [System.Windows.Forms.SendKeys]::SendWait($Keys)
    Start-Sleep -Milliseconds $Wait
}

# テキスト入力関数
function Type-Text {
    param([string]$Text, [int]$DelayPerChar = 50, [int]$Wait = 500)
    foreach ($char in $Text.ToCharArray()) {
        [System.Windows.Forms.SendKeys]::SendWait([string]$char)
        Start-Sleep -Milliseconds $DelayPerChar
    }
    Start-Sleep -Milliseconds $Wait
}

# マウス移動関数
function Move-Mouse {
    param([int]$X, [int]$Y, [int]$Wait = 500)
    [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($X, $Y)
    Start-Sleep -Milliseconds $Wait
}

# マウスクリック関数
function Click-Mouse {
    param([int]$Wait = 500)
    Add-Type -AssemblyName System.Windows.Forms
    $signature = @'
    [DllImport("user32.dll", CharSet = CharSet.Auto, CallingConvention = CallingConvention.StdCall)]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint cButtons, uint dwExtraInfo);
'@
    $SendMouseClick = Add-Type -MemberDefinition $signature -Name "Win32MouseEventNew" -Namespace Win32Functions -PassThru
    $SendMouseClick::mouse_event(0x02, 0, 0, 0, 0)  # MOUSEEVENTF_LEFTDOWN
    $SendMouseClick::mouse_event(0x04, 0, 0, 0, 0)  # MOUSEEVENTF_LEFTUP
    Start-Sleep -Milliseconds $Wait
}

# ウィンドウアクティブ化関数
function Activate-Window {
    param([string]$WindowTitle)
    $shell = New-Object -ComObject WScript.Shell
    $shell.AppActivate($WindowTitle)
    Start-Sleep -Milliseconds 500
}

# アクション実行関数
function Execute-Action {
    param([PSCustomObject]$Action)

    switch ($Action.type) {
        "keystroke" {
            Send-Keys -Keys $Action.keys -Wait $Action.wait
        }
        "text" {
            Type-Text -Text $Action.content -Wait $Action.wait
        }
        "mouse_move" {
            Move-Mouse -X $Action.x -Y $Action.y -Wait $Action.wait
        }
        "mouse_click" {
            Click-Mouse -Wait $Action.wait
        }
        "focus" {
            switch ($Action.target) {
                "vscode" { Activate-Window "Visual Studio Code" }
                "browser" { Activate-Window "Chrome" }
                "claude-code" {
                    Activate-Window "Visual Studio Code"
                    Start-Sleep -Milliseconds 500
                    Send-Keys -Keys "^+p" -Wait 500  # Ctrl+Shift+P でコマンドパレット
                    Type-Text -Text "Claude" -Wait 500
                    Send-Keys -Keys "{ENTER}" -Wait 1000
                }
            }
            Start-Sleep -Milliseconds $Action.wait
        }
        "wait" {
            Start-Sleep -Milliseconds $Action.duration
        }
        default {
            Write-Host "未知のアクション: $($Action.type)" -ForegroundColor Yellow
        }
    }
}

# JSON入力を受け取る
$jsonInput = $args[0]
if ($jsonInput) {
    $action = $jsonInput | ConvertFrom-Json
    Execute-Action -Action $action
}
