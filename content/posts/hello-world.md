---
title: "你好，世界：博客的第一篇文章"
date: 2026-09-06
draft: false
tags:
  - 随笔
---

博客搭好了，用这篇文章来验证一切正常，顺便当一篇 Markdown 速查。

## 常用写法

**加粗**、*斜体*、`行内代码`，还有 [链接](https://gohugo.io/)。

引用长这样：

> 学技术最好的方式就是把学的东西写出来。

### 列表

1. 写文章 = 在 `content/posts/` 新建一个 `.md` 文件
2. 本地预览：`hugo server -D`
3. 发布：`git push`，Cloudflare 一分钟后自动上线

### 代码块

写技术笔记最常用的就是代码块，带高亮和复制按钮：

```c
/* 老朋友：STM32 点灯 */
while (1) {
    HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_13);
    HAL_Delay(500);
}
```

### 表格

| 快捷操作 | 命令 |
|---|---|
| 新建文章 | `hugo new content posts/xxx.md` |
| 本地预览 | `hugo server -D` |
| 正式发布 | `git push` |

## 插图片怎么放

把图片丢进 `static/images/` 目录，然后这样引用：

```markdown
![描述文字](/images/xxx.png)
```

---

写完记得把开头 `draft: true` 改成 `false`（或删掉），否则正式构建时不会发布这篇。
