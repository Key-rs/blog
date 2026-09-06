#!/usr/bin/env python3
"""Obsidian 笔记 -> Hugo 博客 导入器

用法:
    python tools/import_obsidian.py <笔记文件夹> [更多文件夹...]

功能:
  - [[链接]]       -> 若目标也已导入则生成站内链接, 否则转为加粗文本
  - ![[图片.png]]  -> 图片复制到 static/images/ 并改写路径
  - > [!callout]   -> FixIt admonition shortcode
  - ==高亮==       -> <mark>高亮</mark>
  - 代码块内部不做任何转换 (支持 ``` 与 ```` 嵌套)
  - frontmatter: title/date/tags 保留, 缺 date 用文件修改时间
"""

import re
import sys
import shutil
import hashlib
from pathlib import Path

BLOG = Path(__file__).resolve().parent.parent
POSTS = BLOG / "content" / "posts"
IMAGES = BLOG / "static" / "images"

CALLOUT_MAP = {
    "note": "note", "abstract": "abstract", "summary": "abstract", "tldr": "abstract",
    "info": "info", "todo": "todo", "tip": "tip", "hint": "tip", "important": "tip",
    "success": "success", "check": "success", "done": "success",
    "question": "question", "help": "question", "faq": "question",
    "warning": "warning", "caution": "warning", "attention": "warning",
    "danger": "danger", "error": "danger", "bug": "bug",
    "example": "example", "quote": "quote", "cite": "quote",
}

FENCE_RE = re.compile(r"^\s*(`{3,}|~{3,})")
WIKILINK_RE = re.compile(r"(!?)\[\[([^\[\]]+)\]\]")
MD_IMAGE_RE = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)")
HIGHLIGHT_RE = re.compile(r"==([^=\n]+)==")
CALLOUT_RE = re.compile(r"^>\s*\[!(\w+)\]([+-])?\s*(.*)$")


def find_vault_root(src: Path) -> Path:
    for p in [src, *src.parents]:
        if (p / ".obsidian").is_dir():
            return p
    return src


def parse_frontmatter(text: str):
    fm, body = {}, text
    m = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n?(.*)$", text, re.S)
    if m:
        raw, body = m.group(1), m.group(2)
        key = None
        for line in raw.splitlines():
            s = line.strip()
            if not s:
                continue
            if s.startswith("- ") and isinstance(fm.get(key), list):
                fm[key].append(s[2:].strip().strip('"'))
            elif ":" in s:
                k, v = s.split(":", 1)
                key, v = k.strip(), v.strip()
                if v.startswith("[") and v.endswith("]"):
                    fm[key] = [x.strip().strip('"') for x in v[1:-1].split(",") if x.strip()]
                elif v:
                    fm[key] = v.strip('"')
                else:
                    fm[key] = []  # 可能是块列表
    return fm, body


def yq(s: str) -> str:
    """给 frontmatter 字符串加引号 (用 json 转义, 与 yaml 兼容)"""
    import json
    return json.dumps(s, ensure_ascii=False)


class Converter:
    def __init__(self, vault_root: Path, slug_map: dict, stats: dict):
        self.vault = vault_root
        self.slug_map = slug_map
        self.stats = stats

    def copy_image(self, fname: str) -> str | None:
        hits = [p for p in self.vault.rglob(fname) if p.is_file()]
        if not hits:
            return None
        src = hits[0]
        IMAGES.mkdir(parents=True, exist_ok=True)
        dst = IMAGES / fname
        if dst.exists() and hashlib.md5(dst.read_bytes()).hexdigest() != hashlib.md5(src.read_bytes()).hexdigest():
            dst = IMAGES / (hashlib.md5(src.read_bytes()).hexdigest()[:6] + "-" + fname)
        shutil.copy2(src, dst)
        return f"/images/{dst.name}"

    def convert_wikilinks(self, line: str) -> str:
        def repl(m):
            bang, inner = m.group(1), m.group(2)
            parts = inner.split("|")
            target = parts[0].strip()
            display = parts[1].strip() if len(parts) > 1 else target.split("#")[0].split("/")[-1]
            display = display.split("#")[0] or target
            if bang:  # 嵌入 ![[xxx]]
                if "." in target and target.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg")):
                    fname = target.split("/")[-1]
                    url = self.copy_image(fname)
                    if url:
                        self.stats["图片"] += 1
                        return f"![{fname}]({url})"
                    return f"*(缺少图片: {fname})*"
                self.stats["嵌入笔记"] += 1
                return f"**[笔记: {display}]**"
            # 普通双链
            base = target.split("#")[0].split("^")[0].strip()
            anchor = target.split("#", 1)[1] if "#" in target else ""
            if base and base in self.slug_map:
                self.stats["站内链接"] += 1
                label = display if display != base or not anchor else (display or base)
                return f"[{label}](/posts/{self.slug_map[base]}/)"
            if not base and anchor:  # [[#标题]] 自身锚点
                return f"**{display}**"
            self.stats["双链转加粗"] += 1
            return f"**{display}**"
        return WIKILINK_RE.sub(repl, line)

    def convert_md_images(self, line: str, src_dir: Path) -> str:
        def repl(m):
            alt, path = m.group(1), m.group(2).strip()
            if path.startswith(("http://", "https://", "/")):
                return m.group(0)
            f = (src_dir / path).resolve()
            if f.is_file():
                url = self.copy_image(f.name)
                if url:
                    self.stats["图片"] += 1
                    return f"![{alt}]({url})"
            return m.group(0)
        return MD_IMAGE_RE.sub(repl, line)

    def convert_line(self, line: str, src_dir: Path) -> str:
        line = self.convert_wikilinks(line)
        line = self.convert_md_images(line, src_dir)
        line = HIGHLIGHT_RE.sub(r"<mark>\1</mark>", line)
        return line

    def convert_callout(self, lines: list[str], i: int):
        """lines[i] 是 callout 首行, 返回 (shortcode文本, 下一行下标)"""
        m = CALLOUT_RE.match(lines[i])
        ctype, fold, title = m.group(1).lower(), m.group(2), m.group(2 and m.group(3)) if False else m.group(3)
        ctype = CALLOUT_MAP.get(ctype, "note")
        title = title.strip()
        body = []
        j = i + 1
        while j < len(lines):
            s = lines[j]
            if s.startswith(">"):
                body.append(re.sub(r"^>\s?", "", s))
                j += 1
            elif s.strip() == "" and j + 1 < len(lines) and lines[j + 1].startswith(">"):
                body.append("")
                j += 1
            else:
                break
        # 清理 body 尾部空行并转换其中语法
        while body and body[-1].strip() == "":
            body.pop()
        src_dir = Path(".")
        body = [self.convert_line(b, src_dir) if not FENCE_RE.match(b) else b for b in body]
        args = [ctype]
        args.append(yq(title) if title else yq({"tip": "技巧", "note": "说明", "warning": "注意"}.get(ctype, "")))
        if fold == "-":
            args.append("false")
        elif fold == "+":
            args.append("true")
        out = "{{< admonition " + " ".join(a for a in args if a != yq("")) + " >}}\n"
        out += "\n".join(body) + "\n{{< /admonition >}}"
        self.stats["callout"] += 1
        return out, j


def slugify(stem: str) -> str:
    return re.sub(r"\s+", "-", stem.strip())


def main():
    folders = [Path(a) for a in sys.argv[1:]]
    if not folders:
        print("用法: python tools/import_obsidian.py <笔记文件夹> [更多...]")
        sys.exit(1)

    # 收集所有笔记, 建 slug 映射供双链转站内链接
    files, slug_map = [], {}
    for folder in folders:
        for f in sorted(folder.rglob("*.md")):
            if ".obsidian" in f.parts:
                continue
            files.append(f)
            slug_map[f.stem] = slugify(f.stem)

    POSTS.mkdir(parents=True, exist_ok=True)
    total = dict(图片=0, 双链转加粗=0, 站内链接=0, callout=0, 嵌入笔记=0)
    imported = []

    for f in files:
        text = f.read_text(encoding="utf-8")
        fm, body = parse_frontmatter(text)
        lines = body.splitlines()
        conv = Converter(find_vault_root(f), slug_map, total)

        out_lines, i, in_fence, fence_len, fence_ch = [], 0, False, 0, ""
        while i < len(lines):
            line = lines[i]
            fm_ = FENCE_RE.match(line)
            if fm_:
                marker = fm_.group(1)
                if not in_fence:
                    in_fence, fence_len, fence_ch = True, len(marker), marker[0]
                elif marker[0] == fence_ch and len(marker) >= fence_len and line.strip() == marker:
                    in_fence = False  # 关闭围栏不允许带语言名
                out_lines.append(line)
                i += 1
                continue
            if not in_fence and CALLOUT_RE.match(line):
                block, i = conv.convert_callout(lines, i)
                out_lines.append(block)
                continue
            out_lines.append(line if in_fence else conv.convert_line(line, f.parent))
            i += 1

        date = fm.get("date") or __import__("datetime").date.fromtimestamp(f.stat().st_mtime).isoformat()
        tags = fm.get("tags") or []
        fm_out = ["---", f"title: {yq(fm.get('title') or f.stem)}", f"date: {date}", "draft: false"]
        if tags:
            fm_out.append("tags:")
            fm_out += [f"  - {t}" for t in tags]
        fm_out.append("---")
        target = POSTS / (slugify(f.stem) + ".md")
        target.write_text("\n".join(fm_out) + "\n" + "\n".join(out_lines).lstrip("\n") + "\n", encoding="utf-8")
        imported.append(target)
        print(f"导入: {f.name}  ->  {target.name}")

    print(f"\n共 {len(imported)} 篇 | 转换: {total['callout']} 个callout, "
          f"{total['站内链接']} 个站内链接, {total['双链转加粗']} 个双链, {total['图片']} 张图片")
    if total["嵌入笔记"]:
        print(f"⚠ {total['嵌入笔记']} 处嵌入了其他笔记, 已转为文字引用")


if __name__ == "__main__":
    main()
