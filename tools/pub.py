#!/usr/bin/env python3
"""一键发布博客 (git add → commit → push, Cloudflare 自动构建上线)

用法:
  python tools/pub.py "post: 标题"              # 提交并推送所有改动
  python tools/pub.py "post: 标题" -i           # 先导入 Obsidian 默认文件夹再发布
  python tools/pub.py "post: 标题" -i "D:/Key-s-Obsidian/某文件夹"
  任意命令后加 --dry-run 只演示不执行

默认导入文件夹在下方 VAULT_DEFAULT 修改。
"""

import subprocess
import sys
from pathlib import Path

BLOG = Path(__file__).resolve().parent.parent
VAULT_DEFAULT = "D:/Key-s-Obsidian/01-技术学习"

args = sys.argv[1:]
dry = "--dry-run" in args
args = [a for a in args if a != "--dry-run"]
msg = args[0] if args else "post: update"
do_import = "-i" in args
if do_import:
    args.remove("-i")
folder = args[1] if len(args) > 1 else VAULT_DEFAULT


def run(cmd):
    print("+", " ".join(str(c) for c in cmd))
    if dry:
        return 0
    return subprocess.run(cmd, cwd=BLOG).returncode


if do_import:
    if run([sys.executable, "tools/import_obsidian.py", folder]) != 0:
        sys.exit("导入失败, 中止")

run(["git", "add", "-A"])

if not dry:
    unchanged = subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=BLOG).returncode == 0
    if unchanged:
        print("没有需要发布的改动")
        sys.exit(0)

if run(["git", "commit", "-m", msg]) != 0 and not dry:
    sys.exit(1)
if run(["git", "push"]) != 0:
    sys.exit("推送失败")
print("\n✅ 已推送, Cloudflare 自动构建中, 约 2-3 分钟后上线 https://blog-21k.pages.dev")
