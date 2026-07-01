# claude-toast-notifier

**Windows 原生 Toast 通知 for Claude Code** — 任务完成或需要操作时，右上角弹窗提醒。

[English](#english) · [中文](#中文)

---

## 中文

### ✨ 30 秒安装

打开终端，运行一行命令：

```bash
npx claude-toast-notifier
```

然后**重启 Claude Code**。搞定。🎉

> 不想用了？卸载同样一行：`npx claude-toast-notifier --uninstall`

### 它解决什么问题？

Claude Code 跑任务可能要几十秒到几分钟。你切去干别的事，回来不知道它跑完没。这个工具让 Claude Code 在**任务完成**或**需要你操作**（比如等待权限确认）时，自动弹出 Windows 原生通知。

```
┌─────────────────────────────────┐
│ ✅ Claude Task Completed        │
│ Project: my-app · ...3f8a2b1c   │
└─────────────────────────────────┘
        ↑ 右上角自动弹出
```

### 特性

- **一行安装** — `npx` 自动完成所有配置，无需手动改 JSON
- **零依赖** — 纯 PowerShell + Windows 自带 WinRT API，不装任何包
- **智能合并** — 自动检测已有配置，不重复添加、不破坏你的其他 hooks
- **一键卸载** — 干净移除所有痕迹
- **全覆盖通知** — 11 种需要关注的 Claude Code 事件全部弹窗提醒：

| 事件 | 图标 | 含义 |
|------|------|------|
| `Stop` | ✅ | 任务完成 |
| `StopFailure` | ❌ | 任务因 API 错误中断 |
| `Notification` | 🔔 | 需要用户输入 |
| `PermissionRequest` | 🔒 | 权限审批弹窗 |
| `PermissionDenied` | ⛔ | 操作被自动拒绝 |
| `PostToolUseFailure` | ⚠️ | 工具执行失败 |
| `SubagentStop` | 🤖 | 子 agent 完成 |
| `TaskCompleted` | 🎯 | 任务标记完成 |
| `TeammateIdle` | 👥 | 团队队友空闲 |
| `Elicitation` | ❓ | MCP 服务器需要用户输入 |
| `SessionEnd` | 👋 | 会话结束 |

### 前置条件

- **Windows 10/11**（依赖 WinRT Toast API）
- **Claude Code** 已安装
- **Node.js 18+**（用于运行安装器；通知本身不需要 Node）

### 命令一览

| 命令 | 作用 |
|---|---|
| `npx claude-toast-notifier` | 安装 |
| `npx claude-toast-notifier --uninstall` | 卸载 |
| `npx claude-toast-notifier --help` | 帮助 |
| `npx claude-toast-notifier --version` | 版本 |

### 安装器做了什么？

运行 `npx claude-toast-notifier` 时，安装器会：

1. 把 `notify.ps1` 复制到 `~/.claude/notify.ps1`
2. 在 `~/.claude/settings.json` 中注册以下 11 个 hook 事件
3. **保留你所有现有配置**，只增量添加，不覆盖

### 手动安装

如果你不想用 npx，也可以手动安装：

**1. 复制脚本：**

```powershell
mkdir "$env:USERPROFILE\.claude" -Force | Out-Null
# 从本仓库 asset/ 目录下载 notify.ps1 后：
Copy-Item "notify.ps1" "$env:USERPROFILE\.claude\notify.ps1"
```

**2. 在 `~/.claude/settings.json` 顶层添加 hooks：**

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "powershell -NoProfile -ExecutionPolicy Bypass -File C:/Users/你的用户名/.claude/notify.ps1" }
        ]
      }
    ],
    "StopFailure": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "powershell -NoProfile -ExecutionPolicy Bypass -File ~/.claude/notify.ps1" }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "powershell -NoProfile -ExecutionPolicy Bypass -File C:/Users/你的用户名/.claude/notify.ps1" }
        ]
      }
    ],
    "PermissionRequest": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "powershell -NoProfile -ExecutionPolicy Bypass -File ~/.claude/notify.ps1" }
        ]
      }
    ],
    "PermissionDenied": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "powershell -NoProfile -ExecutionPolicy Bypass -File ~/.claude/notify.ps1" }
        ]
      }
    ],
    "PostToolUseFailure": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "powershell -NoProfile -ExecutionPolicy Bypass -File ~/.claude/notify.ps1" }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "powershell -NoProfile -ExecutionPolicy Bypass -File ~/.claude/notify.ps1" }
        ]
      }
    ],
    "TaskCompleted": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "powershell -NoProfile -ExecutionPolicy Bypass -File ~/.claude/notify.ps1" }
        ]
      }
    ],
    "TeammateIdle": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "powershell -NoProfile -ExecutionPolicy Bypass -File ~/.claude/notify.ps1" }
        ]
      }
    ],
    "Elicitation": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "powershell -NoProfile -ExecutionPolicy Bypass -File ~/.claude/notify.ps1" }
        ]
      }
    ],
    "SessionEnd": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "powershell -NoProfile -ExecutionPolicy Bypass -File ~/.claude/notify.ps1" }
        ]
      }
    ]
  }
}
```

> ⚠️ 路径必须用绝对路径（如 `C:/Users/你的用户名/.claude/notify.ps1`），`~` 和 `%USERPROFILE%` 在最新版 Claude Code 中可能不会被展开。

### 调试

通知没弹出来？开启诊断日志：

1. 编辑 `~/.claude/notify.ps1`，取消顶部诊断日志部分的注释
2. 触发一次任务，查看日志：`~/.claude/notify.diag.log`
3. 日志记录每次调用的：事件名、stdin 内容、解析结果、错误信息

### 工作原理

```
Claude Code 任务完成/需要操作
        │
        ▼
Claude Code 通过 Git Bash 触发 Hook
        │
        ▼
notify.ps1 被调用
   ├─ 从 stdin JSON 读取事件信息（UTF-8 解码）
   ├─ 解析 hook_event_name / session_id / cwd / message
   └─ 调用 WinRT ToastNotificationManager 弹出原生通知
```

### 开发踩坑记录

本项目开发中遇到并解决的三个关键问题：

| 问题 | 根因 | 解决方案 |
|------|------|----------|
| `~` 路径不生效 | Claude Code hook 未展开 `~`，PowerShell 收到字面值 | 用绝对路径（安装器自动使用 `os.homedir()` 拼接） |
| emoji 导致弹窗崩溃 | PS 5.1 的 `[char]` 是 16 位，🔔(U+1F514) 超限 | 用 `[char]::ConvertFromUtf32()` |
| Stop 事件不弹窗 | `[Console]::In` 按 GBK 读 UTF-8 中文 JSON，破坏结构 | 读前设 `[Console]::InputEncoding = UTF8` |

### License

MIT

---

## English

### ✨ 30-Second Install

Open a terminal and run:

```bash
npx claude-toast-notifier
```

Then **restart Claude Code**. Done. 🎉

> Want to remove it? `npx claude-toast-notifier --uninstall`

### What Problem Does It Solve?

Claude Code tasks can take seconds to minutes. You switch away, come back, and don't know if it's done. This tool makes Claude Code pop up a native Windows notification when a **task completes** or it **needs your input** (e.g., waiting for permission).

### Features

- **One-line install** — `npx` configures everything automatically, no manual JSON editing
- **Zero dependencies** — Pure PowerShell + Windows built-in WinRT API
- **Smart merge** — Detects existing config, never duplicates or breaks your other hooks
- **Clean uninstall** — Removes all traces in one command
- **Full coverage** — 11 Claude Code events that need your attention, all trigger a toast:

| Event | Icon | Meaning |
|-------|------|---------|
| `Stop` | ✅ | Task completed |
| `StopFailure` | ❌ | Task failed due to API error |
| `Notification` | 🔔 | Needs your input |
| `PermissionRequest` | 🔒 | Permission approval dialog |
| `PermissionDenied` | ⛔ | Operation auto-denied |
| `PostToolUseFailure` | ⚠️ | Tool execution failed |
| `SubagentStop` | 🤖 | Sub-agent finished |
| `TaskCompleted` | 🎯 | Task marked completed |
| `TeammateIdle` | 👥 | Team teammate went idle |
| `Elicitation` | ❓ | MCP server needs user input |
| `SessionEnd` | 👋 | Session ended |

### Prerequisites

- **Windows 10/11** (requires WinRT Toast API)
- **Claude Code** installed
- **Node.js 18+** (only for the installer; notifications run without Node)

### Commands

| Command | Action |
|---|---|
| `npx claude-toast-notifier` | Install |
| `npx claude-toast-notifier --uninstall` | Uninstall |
| `npx claude-toast-notifier --help` | Help |
| `npx claude-toast-notifier --version` | Version |

### What the Installer Does

1. Copies `notify.ps1` to `~/.claude/notify.ps1`
2. Registers 11 hook events in `~/.claude/settings.json` (Stop, StopFailure, Notification, PermissionRequest, PermissionDenied, PostToolUseFailure, SubagentStop, TaskCompleted, TeammateIdle, Elicitation, SessionEnd)
3. **Preserves all your existing config** — incremental add only

### How It Works

```
Claude Code task completes / needs input
        │
        ▼
Claude Code triggers Hook via Git Bash
        │
        ▼
notify.ps1 is invoked
   ├─ Reads event info from stdin JSON (UTF-8 decoded)
   ├─ Parses hook_event_name / session_id / cwd / message
   └─ Calls WinRT ToastNotificationManager to show native toast
```

### Known Pitfalls

Three critical issues were solved during development:

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| `~` path not expanded | Claude Code hook passes `~` literally to PowerShell | Use absolute path (installer uses `os.homedir()`) |
| Emoji crashes the script | PS 5.1 `[char]` is 16-bit; 🔔(U+1F514) overflows | Use `[char]::ConvertFromUtf32()` |
| Stop event never fires | `[Console]::In` reads UTF-8 JSON as GBK, corrupting structure | Set `[Console]::InputEncoding = UTF8` before reading |

### License

MIT
