# Shibo 的博客

基于 [Shirone](https://github.com/LyraVoid/Shirone)（Astro）主题，托管在 Cloudflare Pages：https://blog-21k.pages.dev

## 写文章

文章目录 `src/content/posts/`，一个 `.md` 一篇，frontmatter 必填 `title` 和 `published`：

```bash
pnpm dev        # 本地预览 http://localhost:4321
git push        # 发布，Cloudflare 自动构建
```

## 从 Obsidian 导入笔记

```bash
python tools/import_obsidian.py "D:/Key-s-Obsidian/01-技术学习"
```

自动转换 wikilink（目标已导入则站内链接，否则加粗）、`==高亮==`、图片路径；callout（`> [!note]`）原生支持不用转；代码块内一律不转换。

## 备注

- 旧 Hugo + FixIt 版本完整保留在 `hugo-fixit-backup` 分支，想回退 `git checkout hugo-fixit-backup` 即可
- Cloudflare Pages 构建配置：构建命令 `pnpm build`，输出目录 `dist`，环境变量 `NODE_VERSION=22`
