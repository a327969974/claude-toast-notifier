#!/usr/bin/env node
/**
 * claude-toast-notifier — CLI 入口
 *
 * 解析命令行参数，分发到 install / uninstall / help / version。
 */
import { install, uninstall, showHelp, getVersion } from '../src/install.mjs';

const arg = process.argv.slice(2)[0];

switch (arg) {
  case undefined:
  case 'install':
    install();
    break;
  case '--uninstall':
  case '-u':
  case 'uninstall':
    uninstall();
    break;
  case '--help':
  case '-h':
    showHelp();
    break;
  case '--version':
  case '-v':
    console.log(getVersion());
    break;
  default:
    console.error(`未知参数: ${arg}`);
    console.error('运行 claude-toast-notifier --help 查看可用命令');
    process.exit(1);
}
