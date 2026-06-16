# claude-toast-notifier

**Windows 原生 Toast 通知 for Claude Code** — 任务完成或需要操作时，右上角弹窗提醒，零依赖。

[English](#english) · [中文](#中文)

---

## 中文

### 它是什么？

当 Claude Code 完成任务（Stop）或需要你操作（Notification，如等待权限确认）时，自动在 Windows 右上角弹出原生 Toast 通知。

![](docs/screenshot.png) <!-- 替换为实际截图 -->

### 特性

- **零依赖** — 纯 PowerShell 5.1 + Windows 11 自带 WinRT API，无需安装任何包
- **两种事件** — 任务完成 ✅ / 需要操作 🔔
- **信息丰富** — 通知显示项目名 + 会话 ID，多项目并行不混淆
- **永不阻塞** — 所有异常静默捕获，hook 失败不影响 Claude Code 主流程
- **兼容性** — 同时支持 VSCode 扩展版和 CLI 版 Claude Code

### 前置条件

- Windows 10/11（需支持 WinRT Toast API）
- Claude Code 已安装并配置好
- PowerShell 5.1+（系统自带）

### 安装

**只需两步：**

#### 1. 复制脚本到 Claude Code 配置目录

```powershell
# 确保 ~/.claude 目录存在
mkdir "$env:USERPROFILE\.claude" -Force | Out-Null

# 复制脚本（把下面的路径换成你 clone 下来的实际路径）
Copy-Item "notify.ps1" "$env:USERPROFILE\.claude\notify.ps1"
```

#### 2. 在 settings.json 中注册 Hook

编辑 `~/.claude/settings.json`，在顶层添加 `hooks` 键：

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -NoProfile -ExecutionPolicy Bypass -File ~/.claude/notify.ps1"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -NoProfile -ExecutionPolicy Bypass -File ~/.claude/notify.ps1"
          }
        ]
      }
    ]
  }
}
```

> ⚠️ 注意：请勿在 `command` 中使用 `%USERPROFILE%`（cmd 语法）。Claude Code 在 Windows 上通过 Git Bash 执行 hook 命令，应使用 `~`（bash 会自动展开为用户主目录）。

#### 3. 重启 Claude Code

`settings.json` 仅在启动时加载。关闭当前 Claude Code 会话，重新打开即可。

### 验证安装

```powershell
# 模拟 Stop 事件，应弹出 ✅ 通知
$env:CLAUDE_HOOK_EVENT = "Stop"
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\notify.ps1"
```

### 调试

如果通知未按预期弹出，可开启诊断日志：

1. 编辑 `notify.ps1`，取消文件顶部诊断日志部分的注释（将 `# $env:CLAUDE_NOTIFY_DEBUG = "1"` 的 `#` 删除）
2. 重现问题后查看日志：`~/.claude/notify.diag.log`
3. 日志会记录每次 hook 调用的事件名、stdin 内容、解析结果、错误信息

### 工作原理

```
Claude Code 任务完成/需要操作
        │
        ▼
Claude Code 通过 Git Bash 触发 Hook
        │
        ▼
notify.ps1 被调用
   ├─ 从环境变量 + stdin JSON 读取事件信息
   ├─ 解析 hook_event_name / session_id / cwd / message
   └─ 调用 WinRT ToastNotificationManager 弹出原生通知
```

### 已知踩坑记录（开发笔记）

在开发过程中遇到并解决了三个关键问题，记录于此供参考：

| 问题 | 根因 | 解决方案 |
|------|------|----------|
| `%USERPROFILE%` 不生效 | Claude Code 用 Git Bash 执行 hook，不是 cmd.exe | 改用 `~`（bash 原生展开） |
| emoji 导致弹窗崩溃 | PS 5.1 的 `[char]` 是 16 位，🔔(U+1F514) 超限 | 改用 `[char]::ConvertFromUtf32()` |
| Stop 事件不弹窗 | `[Console]::In` 按 GBK 读 UTF-8 中文 JSON，破坏结构 | 读前设 `[Console]::InputEncoding = UTF8` |

### License

MIT

---

## English

### What is it?

A native Windows Toast notification script for Claude Code. Automatically pops up a system notification in the top-right corner when Claude Code finishes a task (Stop) or needs your input (Notification).

### Features

- **Zero dependencies** — Pure PowerShell 5.1 + Windows 11 built-in WinRT API. No packages to install.
- **Two event types** — Task completed ✅ / Needs your input 🔔
- **Context-aware** — Shows project name + session ID so you can tell which Claude instance is notifying you
- **Non-blocking** — All exceptions silently caught; hook failure never affects Claude Code
- **Cross-client** — Works with both VSCode extension and CLI versions of Claude Code

### Prerequisites

- Windows 10/11 with WinRT Toast API support
- Claude Code installed and configured
- PowerShell 5.1+ (comes with Windows)

### Installation

**Two steps:**

#### 1. Copy the script to your Claude Code config directory

```powershell
mkdir "$env:USERPROFILE\.claude" -Force | Out-Null
Copy-Item "notify.ps1" "$env:USERPROFILE\.claude\notify.ps1"
```

#### 2. Register hooks in settings.json

Add a `hooks` key to the top level of `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -NoProfile -ExecutionPolicy Bypass -File ~/.claude/notify.ps1"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -NoProfile -ExecutionPolicy Bypass -File ~/.claude/notify.ps1"
          }
        ]
      }
    ]
  }
}
```

> ⚠️ **Important:** Do NOT use `%USERPROFILE%` in the command (that's cmd.exe syntax). Claude Code on Windows executes hooks via Git Bash. Use `~` instead (bash auto-expands it to the user's home directory).

#### 3. Restart Claude Code

`settings.json` is loaded at startup only. Close and reopen Claude Code.

### Verify Installation

```powershell
# Simulate a Stop event — should pop up a ✅ notification
$env:CLAUDE_HOOK_EVENT = "Stop"
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\notify.ps1"
```

### Debugging

If notifications don't appear as expected:

1. Edit `notify.ps1` and uncomment the diagnostic logging block at the top
2. Reproduce the issue, then check the log: `~/.claude/notify.diag.log`
3. The log records every hook invocation: event name, raw stdin, parse results, and errors

### How It Works

```
Claude Code task completes / needs input
        │
        ▼
Claude Code triggers Hook via Git Bash
        │
        ▼
notify.ps1 is invoked
   ├─ Reads event info from env vars + stdin JSON
   ├─ Parses hook_event_name / session_id / cwd / message
   └─ Calls WinRT ToastNotificationManager to show native toast
```

### Known Pitfalls (Development Notes)

Three critical issues were encountered and resolved during development:

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| `%USERPROFILE%` not working | Claude Code uses Git Bash for hooks, not cmd.exe | Use `~` (native bash expansion) |
| Emoji crashes the script | PS 5.1 `[char]` is 16-bit; 🔔(U+1F514) overflows | Use `[char]::ConvertFromUtf32()` |
| Stop event never fires | `[Console]::In` reads UTF-8 JSON as GBK, corrupting structure | Set `[Console]::InputEncoding = UTF8` before reading |

### License

MIT
