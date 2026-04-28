# 响应式布局适配 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `index.html` 的 `<style>` 块末尾追加三组 `@media` 规则，使仪表盘在 1280~1920px 笔记本屏幕上正常显示。

**Architecture:** 所有改动为纯 CSS，集中在 `index.html` 第 213 行（现有 `.right-panel` 媒体查询末行）之后、第 214 行 `</style>` 之前插入。调整四个方面：网格 gap/padding/列比、面板内边距、panel-title 密度、大数字字体和地图状态卡最小宽度。不修改任何 HTML 或 JS。

**Tech Stack:** Vanilla CSS, Tailwind CDN (用 `!important` 覆盖 Tailwind 工具类)

---

### Task 1: 追加全部响应式 @media 规则

**Files:**
- Modify: `index.html:213–214`（在现有最后一个 `@media` 行之后、`</style>` 之前）

- [ ] **Step 1: 启动服务器，确认当前 1280px 状态**

```bash
npm start
```

在浏览器打开 http://localhost:3000，用开发者工具（F12 → 响应式模式）将视口设为 **1280px 宽**，观察当前拥挤程度（gap 过大、两侧面板被压缩、大数字溢出）。

- [ ] **Step 2: 将以下 CSS 插入 `index.html` 第 213 行之后**

在 `index.html` 第 213 行（`@media (max-width: 1280px) { .right-panel { --panel-scale: 0.85; } }`）末尾按回车，粘贴以下内容，确保 `</style>` 在所有 @media 块之后：

```css
    /* =============================================
       响应式断点：笔记本屏幕自适应 (1280 ~ 1680px)
       ============================================= */

    /* 1680px：轻量调整 — gap/padding 缩减，状态卡略收窄 */
    @media (max-width: 1680px) {
      #dashboard {
        gap: 1.2rem;
        padding: 1.2rem 1.2rem 0.4rem 1.2rem;
      }
      .min-w-\[240px\] { min-width: 220px !important; }
    }

    /* 1440px：中等压缩 — 面板内边距、panel-title、大字体同步缩减 */
    @media (max-width: 1440px) {
      #dashboard {
        gap: 0.9rem;
        padding: 0.9rem 0.9rem 0.35rem 0.9rem;
      }
      /* 覆盖 Tailwind p-4（仅顶层 panel 直接子元素） */
      #dashboard > .panel.p-4 {
        padding: 0.75rem !important;
      }
      .panel-title {
        font-size: 0.8rem;
        margin-bottom: 0.6rem;
        padding-bottom: 0.4rem;
      }
      /* 左上面板大数字（温度 text-4xl、气压/风速 text-3xl） */
      #dashboard .panel-tl .text-4xl { font-size: 1.9rem !important; }
      #dashboard .panel-tl .text-3xl { font-size: 1.5rem !important; }
      .min-w-\[240px\] { min-width: 190px !important; }
    }

    /* 1280px：紧凑模式 — 中央列略宽，全面最小化间距和字体 */
    @media (max-width: 1280px) {
      #dashboard {
        grid-template-columns: 2.8fr 6fr 2.8fr;
        gap: 0.65rem;
        padding: 0.65rem 0.65rem 0.3rem 0.65rem;
      }
      /* 覆盖 Tailwind p-4 */
      #dashboard > .panel.p-4 {
        padding: 0.6rem !important;
      }
      .panel-title {
        font-size: 0.75rem;
        margin-bottom: 0.4rem;
        padding-bottom: 0.3rem;
      }
      #dashboard .panel-tl .text-4xl { font-size: 1.6rem !important; }
      #dashboard .panel-tl .text-3xl { font-size: 1.2rem !important; }
      .min-w-\[240px\] { min-width: 165px !important; }
    }
```

- [ ] **Step 3: 确认 `</style>` 标签位置正确**

编辑后第 213 行开始应为上述 CSS，原来的 `</style>` 应在所有新增 @media 块之后。`<style>` 块结尾结构应如下：

```
...
    @media (max-width: 1280px) { .right-panel { --panel-scale: 0.85; } }

    /* ===== 以下为新增响应式断点 ===== */
    @media (max-width: 1680px) { ... }
    @media (max-width: 1440px) { ... }
    @media (max-width: 1280px) { ... }
  </style>
```

- [ ] **Step 4: 提交**

```bash
git add index.html
git commit -m "feat: add responsive media queries for 1280-1680px laptop screens"
```

---

### Task 2: 全断点视觉验证

**Files:** 无新改动，仅验证

- [ ] **Step 1: 在浏览器依次测试四个宽度**

用开发者工具响应式模式，将视口依次设为以下尺寸并截图对比：

| 视口宽度 | 期望表现 |
|---------|----------|
| 1920px | 与改动前完全一致（baseline 不变） |
| 1680px | gap/padding 轻微缩小，状态卡略收窄，布局比例不变 |
| 1440px | 面板内容更紧凑，大数字适中，三列均无截断 |
| 1280px | 中央列略宽，所有面板内容可见，无横向滚动条 |

- [ ] **Step 2: 检查无横向溢出**

1280px 下 `body` 设有 `overflow: hidden`，不应出现滚动条。若出现，在浏览器控制台运行以下命令找到溢出元素：

```js
[...document.querySelectorAll('*')].filter(el => el.scrollWidth > document.body.clientWidth).map(el => el.className)
```

最常见原因：`min-w-[240px]` 状态卡未被正确覆盖（检查 CSS 选择器中 `[` `]` 是否正确转义为 `\[` `\]`）。

- [ ] **Step 3: 微调（如需要）并提交**

若某个断点有溢出或内容截断，在对应 `@media` 块内调整数值后提交：

```bash
git add index.html
git commit -m "fix: responsive layout tweaks after cross-breakpoint verification"
```

---

## 验收标准

1. 1280px 宽度下，所有面板内容可见，无横向滚动条
2. 1440px 下各面板内容不被截断，数字清晰可读
3. 1920px 外观与改动前完全一致
4. 右侧 `panel-merged` 的 scale 行为与改动前一致（不受新规则影响）
