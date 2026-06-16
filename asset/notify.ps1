# Claude Code Toast Notifier
# 在任务完成(Stop)或需要操作(Notification)时，Windows 右上角弹出原生 Toast。
# 设计原则：零依赖、快速、永不阻塞、出错静默（绝不影响 Claude Code 主流程）。
#
# 用法：在 Claude Code settings.json 的 hooks 中注册此脚本，详见 README.md。

# ---------- 可选：开启诊断日志（调试时取消注释）----------
# $env:CLAUDE_NOTIFY_DEBUG = "1"
# if ($env:CLAUDE_NOTIFY_DEBUG -eq "1") {
#     $diagLog = Join-Path $env:USERPROFILE '.claude\notify.diag.log'
#     function Write-Diag($msg) {
#         try { Add-Content -Path $diagLog -Value $msg -Encoding UTF8 } catch { }
#     }
# } else {
#     function Write-Diag($msg) { }
# }

# ---------- 1. 解析 hook 输入 ----------
$event     = $env:CLAUDE_HOOK_EVENT
$sessionId = $env:CLAUDE_SESSION_ID
$cwd       = $env:CLAUDE_CWD
$message   = ""

# 从 stdin 读取 Claude Code 推送的 JSON（含 session_id、cwd、message 等字段）
# 关键：必须设 UTF-8 编码，否则 Claude 的中文回复会破坏 JSON 结构
$stdinRaw = ""
try {
    [Console]::InputEncoding = [System.Text.Encoding]::UTF8
    $stdinRaw = [Console]::In.ReadToEnd()
} catch { }

try {
    if ($stdinRaw) {
        $data = $stdinRaw | ConvertFrom-Json
        if (-not $event)     { $event     = $data.hook_event_name }
        if (-not $sessionId) { $sessionId = $data.session_id }
        if (-not $cwd)       { $cwd       = $data.cwd }
        if ($data.message)   { $message   = [string]$data.message }
    }
} catch {
    # JSON 解析失败不影响后续流程
}

if (-not $event) { $event = "Unknown" }
if (-not $cwd)   { $cwd   = (Get-Location).Path }

# ---------- 2. 组装通知内容 ----------
# 整个通知逻辑包在 try/catch 里，出错静默退出（绝不影响 Claude Code）
try {
    $projectName = Split-Path $cwd -Leaf
    if (-not $projectName) { $projectName = "Claude" }

    # 取会话 ID 最后 8 位，方便辨认
    $shortId = ""
    if ($sessionId) {
        $start = $sessionId.Length - 8
        if ($start -lt 0) { $start = 0 }
        $shortId = " · " + $sessionId.Substring($start)
    }

    switch ($event) {
        "Stop" {
            $title = [string][char]::ConvertFromUtf32(0x2705) + " Claude Task Completed"
            $body  = "Project: $projectName$shortId"
            break
        }
        "Notification" {
            $title = [string][char]::ConvertFromUtf32(0x1F514) + " Claude Needs Your Input"
            $body  = if ($message) { "Project: $projectName$shortId`n$message" } else { "Project: $projectName$shortId" }
            break
        }
        default {
            $title = [string][char]::ConvertFromUtf32(0x1F4AC) + " Claude [$event]"
            $body  = "Project: $projectName$shortId"
            break
        }
    }

    # ---------- 3. 通过 WinRT 发送 Toast ----------
    $null = [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]
    $null = [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType = WindowsRuntime]

    # 使用 PowerShell 已注册的 AUMID，保证通知能正常显示和聚合
    $appId = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe'

    # XML 转义，防止消息内容破坏 toast 结构
    $escTitle = $title.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;')
    $escBody  = $body.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;')

    $toastXml = '<toast activationType="protocol" duration="long">'
    $toastXml += '<visual><binding template="ToastGeneric">'
    $toastXml += "<text>$escTitle</text>"
    $toastXml += "<text>$escBody</text>"
    $toastXml += '</binding></visual>'
    $toastXml += '<audio src="ms-winsoundevent:Notification.Default" />'
    $toastXml += '</toast>'

    $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
    $xml.LoadXml($toastXml)

    $toast    = New-Object Windows.UI.Notifications.ToastNotification $xml
    $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId)
    $notifier.Show($toast)
}
catch {
    # 静默退出：hook 失败绝不能影响 Claude Code 主流程
}
