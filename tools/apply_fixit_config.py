#!/usr/bin/env python3
"""基于 themes/FixIt/hugo.toml 生成站点配置 hugo.toml（站点信息 + 中文化 + 菜单）。
用法: 先 cp themes/FixIt/hugo.toml hugo.toml, 再 python tools/apply_fixit_config.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
p = ROOT / "hugo.toml"
s = p.read_text(encoding="utf-8")

# 主题版本号从主题 package.json 读取, 保证与 params.version 一致
theme_version = json.loads((ROOT / "themes/FixIt/package.json").read_text(encoding="utf-8"))["version"]


def rep(old, new):
    global s
    if old not in s:
        print(f"⚠ 未找到(跳过): {old[:50]!r}")
        return
    s = s.replace(old, new, 1)


rep('title = ""', 'title = "Shibo 的博客"')
rep('baseURL = "http://localhost:1313"', 'baseURL = "https://blog-21k.pages.dev/"')
rep('defaultContentLanguage = "en"', 'defaultContentLanguage = "zh-cn"')
rep('locale = "en"', 'locale = "zh-CN"')
rep('label = "English"', 'label = "简体中文"')
rep('hasCJKLanguage = false', 'hasCJKLanguage = true')
rep('# theme = ["FixIt"]', 'theme = "FixIt"')
s = re.sub(r'(?m)^version = "[^"]*"', f'version = "{theme_version}"', s, count=1)
rep('[params.author]\nname = ""', '[params.author]\nname = "Shibo"')
rep('name = "Archives"', 'name = "归档"')
rep('name = "Categories"', 'name = "分类"')
rep('name = "Tags"', 'name = "标签"')

# 首页: 启用个人资料区 + 副标题
i = s.index("[params.home.profile]")
seg = s[i:i + 1500]
seg = seg.replace("enable = false", "enable = true", 1)
if 'subtitle = ""' in seg:
    seg = seg.replace('subtitle = ""', 'subtitle = "嵌入式 / 机器人 / 硬件折腾笔记"', 1)
s = s[:i] + seg + s[i + 1500:]

# 补充菜单: 文章、关于
s += '''
[[menus.main]]
identifier = "posts"
name = "文章"
url = "posts/"
weight = 0

[menus.main.params]
icon = "fa-solid fa-feather-pointed"

[[menus.main]]
identifier = "about"
name = "关于"
url = "about/"
weight = 4

[menus.main.params]
icon = "fa-regular fa-user"
'''
p.write_text(s, encoding="utf-8")
print(f"配置完成 (FixIt {theme_version})")
