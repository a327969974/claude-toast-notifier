#!/usr/bin/env node
/**
 * Claude Toast Notifier — installer core logic
 *
 * 安装：复制脚本到 ~/.claude/ + 智能合并 hooks 到 settings.json
 * 卸载：移除 hooks + 删除脚本
 *
 * 零依赖，纯 Node.js 内置模块。
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- 路径常量 ----------
const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json');
const TARGET_SCRIPT = path.join(CLAUDE_DIR, 'notify.ps1');
const SOURCE_SCRIPT = path.resolve(__dirname, '..', 'asset', 'notify.ps1');

// 我们写入 settings.json 的 hook command（bash 友好的 ~ 路径）
const HOOK_COMMAND = 'powershell -NoProfile -ExecutionPolicy Bypass -File ~/.claude/notify.ps1';
const HOOK_EVENTS = ['Stop', 'Notification'];

// 用于识别「我们添加的 hook」的匹配规则：command 末尾指向 notify.ps1 即视为我们的
const OUR_HOOK_PATTERN = /notify\.ps1\s*$/;

// ---------- 终端着色（无依赖，ANSI 转义）----------
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};
const log = {
  info: (m) => console.log(`${c.cyan}•${c.reset} ${m}`),
  ok: (m) => console.log(`${c.green}✓${c.reset} ${m}`),
  warn: (m) => console.log(`${c.yellow}!${c.reset} ${m}`),
  err: (m) => console.log(`${c.red}✗${c.reset} ${m}`),
  dim: (m) => console.log(`${c.gray}  ${m}${c.reset}`),
};

// ---------- 辅助函数 ----------

/** 安全读取并解析 settings.json，不存在返回 {}，解析失败抛错 */
function readSettings() {
  if (!fs.existsSync(SETTINGS_PATH)) {
    return {};
  }
  const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(
      `无法解析 ${SETTINGS_PATH}\n` +
      `请手动检查该文件是否为合法 JSON。错误详情: ${e.message}\n` +
      `为保护你的配置，安装已中止，未做任何修改。`
    );
  }
}

/** 写回 settings.json，保持 2 空格缩进 + 末尾换行 */
function writeSettings(data) {
  fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/** 把 notify.ps1 复制到 ~/.claude/notify.ps1 */
function installScript() {
  if (!fs.existsSync(SOURCE_SCRIPT)) {
    throw new Error(`找不到包内脚本资产: ${SOURCE_SCRIPT}`);
  }
  fs.mkdirSync(CLAUDE_DIR, { recursive: true });

  const sourceContent = fs.readFileSync(SOURCE_SCRIPT);

  if (fs.existsSync(TARGET_SCRIPT)) {
    const existing = fs.readFileSync(TARGET_SCRIPT);
    if (existing.equals(sourceContent)) {
      log.info('通知脚本已存在且为最新，跳过复制');
      return;
    }
    // 内容不同，备份旧文件后覆盖
    const backup = TARGET_SCRIPT + '.bak';
    fs.copyFileSync(TARGET_SCRIPT, backup);
    log.warn(`检测到旧版脚本，已备份至 ${backup}`);
  }

  fs.copyFileSync(SOURCE_SCRIPT, TARGET_SCRIPT);
  log.ok('通知脚本已复制到 ~/.claude/notify.ps1');
}

/** 判断某个 hook 条目是否是我们添加的 */
function isOurHook(hookEntry) {
  return (
    hookEntry &&
    typeof hookEntry === 'object' &&
    Array.isArray(hookEntry.hooks) &&
    hookEntry.hooks.some(
      (h) => h && h.type === 'command' && typeof h.command === 'string' && OUR_HOOK_PATTERN.test(h.command)
    )
  );
}

/** 智能合并 hooks 到 settings 对象。返回是否有变更 */
function mergeHooks(settings) {
  if (!settings.hooks || typeof settings.hooks !== 'object') {
    settings.hooks = {};
  }

  let changed = false;

  for (const evt of HOOK_EVENTS) {
    if (!Array.isArray(settings.hooks[evt])) {
      settings.hooks[evt] = [];
    }

    // 已存在指向 notify.ps1 的 hook → 跳过，避免重复
    const alreadyExists = settings.hooks[evt].some(isOurHook);
    if (alreadyExists) {
      log.info(`${evt} hook 已存在，跳过`);
      continue;
    }

    settings.hooks[evt].push({
      matcher: '',
      hooks: [{ type: 'command', command: HOOK_COMMAND }],
    });
    changed = true;
    log.ok(`已添加 ${evt} hook`);
  }

  return changed;
}

/** 从 settings 中移除我们的 hooks。返回是否有变更 */
function removeOurHooks(settings) {
  let changed = false;

  if (!settings.hooks || typeof settings.hooks !== 'object') {
    return false;
  }

  for (const evt of HOOK_EVENTS) {
    if (!Array.isArray(settings.hooks[evt])) continue;

    const before = settings.hooks[evt].length;
    settings.hooks[evt] = settings.hooks[evt].filter((h) => !isOurHook(h));
    const removed = before - settings.hooks[evt].length;

    if (removed > 0) {
      changed = true;
      log.ok(`已移除 ${evt} 中的 ${removed} 个 hook`);
    }

    // 清理空数组
    if (settings.hooks[evt].length === 0) {
      delete settings.hooks[evt];
    }
  }

  // 如果 hooks 对象空了，整个删掉
  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
    changed = true;
  }

  return changed;
}

/** 删除脚本文件 */
function removeScript() {
  if (fs.existsSync(TARGET_SCRIPT)) {
    fs.unlinkSync(TARGET_SCRIPT);
    log.ok('已删除 ~/.claude/notify.ps1');
  } else {
    log.info('脚本文件不存在，跳过');
  }
}

// ---------- 主流程 ----------

export function install() {
  console.log(`\n${c.bold}Claude Toast Notifier — 安装${c.reset}\n`);

  // 0. 平台检查
  if (process.platform !== 'win32') {
    log.err('此工具仅支持 Windows（依赖 WinRT Toast API）');
    log.dim(`当前平台: ${process.platform}`);
    process.exit(1);
  }

  try {
    // 1. 复制脚本
    installScript();

    // 2. 读取并合并 settings.json
    const settings = readSettings();
    const changed = mergeHooks(settings);

    if (changed) {
      writeSettings(settings);
      log.ok('settings.json 已更新');
    } else {
      log.info('settings.json 无需修改（hooks 已全部就位）');
    }

    console.log(`\n${c.green}${c.bold}安装成功！${c.reset}`);
    console.log(`\n${c.bold}下一步：${c.reset}`);
    log.dim('重启 Claude Code（关闭当前会话，重新打开）');
    log.dim('之后每次任务完成 / 需要操作时，右上角会自动弹窗通知');
    console.log('');
  } catch (e) {
    log.err(e.message);
    process.exit(1);
  }
}

export function uninstall() {
  console.log(`\n${c.bold}Claude Toast Notifier — 卸载${c.reset}\n`);

  try {
    // 1. 从 settings.json 移除 hooks
    if (fs.existsSync(SETTINGS_PATH)) {
      const settings = readSettings();
      const changed = removeOurHooks(settings);
      if (changed) {
        writeSettings(settings);
        log.ok('settings.json 已更新（移除了我们的 hooks）');
      } else {
        log.info('settings.json 中未找到我们的 hooks');
      }
    } else {
      log.info('settings.json 不存在，跳过');
    }

    // 2. 删除脚本
    removeScript();

    console.log(`\n${c.green}${c.bold}卸载完成！${c.reset}`);
    log.dim('如果 Claude Code 正在运行，重启后配置变更生效');
    console.log('');
  } catch (e) {
    log.err(e.message);
    process.exit(1);
  }
}

export function showHelp() {
  console.log(`
${c.bold}claude-toast-notifier${c.reset} ${c.gray}v${getVersion()}${c.reset}

Windows 原生 Toast 通知 for Claude Code。

${c.bold}用法：${c.reset}
  npx claude-toast-notifier              ${c.dim}安装（复制脚本 + 注册 hooks）${c.reset}
  npx claude-toast-notifier --uninstall  ${c.dim}卸载（移除 hooks + 删除脚本）${c.reset}
  npx claude-toast-notifier --help       ${c.dim}显示帮助${c.reset}
  npx claude-toast-notifier --version    ${c.dim}显示版本号${c.reset}

${c.bold}更多信息：${c.reset}
  https://github.com/a327969974/claude-toast-notifier
`);
}

export function getVersion() {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8')
    );
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}
