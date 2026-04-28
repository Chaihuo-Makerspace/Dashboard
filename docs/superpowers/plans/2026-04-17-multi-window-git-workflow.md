# 多 CC 窗口 Git 工作流 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建项目级 CLAUDE.md 和全局 ~/.claude/CLAUDE.md，建立多 CC 窗口并行开发的 git 工作流规范。

**Architecture:** 两份 CLAUDE.md 分工明确——全局文件存放跨项目通用的工作流规则，项目文件存放当前项目的上下文与变更历史。CC 启动时自动读取两份文件，无需任何额外配置。

**Tech Stack:** Markdown 文档，git，Claude Code

---

## 文件变更清单

| 操作 | 路径 | 说明 |
|------|------|------|
| 创建 | `/Users/allen/Desktop/resourse/ChaiHuoCar/dashboard/CLAUDE.md` | 项目上下文文档 |
| 创建 | `/Users/allen/.claude/CLAUDE.md` | 全局工作流规则 |

---

### Task 1：创建项目级 CLAUDE.md

**Files:**
- Create: `CLAUDE.md`（项目根目录）

- [ ] **Step 1：创建文件，写入 ChaiHuoCar 项目上下文**

创建 `/Users/allen/Desktop/resourse/ChaiHuoCar/dashboard/CLAUDE.md`，内容如下：

```markdown
# ChaiHuoCar Dashboard

## 项目简介
柴火创客中心车辆追踪仪表盘——实时展示路径追踪、环境传感器数据、天气与空气质量信息，前端单页应用 + Node.js 后端。

## 技术栈
- 后端：Node.js + Express（server.js）
- 前端：Vanilla JS + HTML/CSS（index.html）
- 数据持久化：data.json（本地文件）
- 天气数据：OpenWeatherMap API（Current Weather + Air Pollution + Geocoding）
- 地理映射：city-province.json（城市 → 省份静态表）
- 动画：horse-animator.js、map-animation.js
- 测试：Jest + supertest（server.test.js）
- 环境变量：dotenv（.env 文件，不提交 git）

## 目录结构
```
index.html          # 前端单页应用（所有面板）
server.js           # Express 后端（/api/data、/api/update）
server.test.js      # Jest 测试
horse-animator.js   # 马匹动画叠加层
map-animation.js    # 地图动画控制
map-config.js       # 地图配置
data.json           # 运行时数据持久化（城市、天气、AQI）
city-province.json  # 城市→省份静态映射（覆盖主要中国城市）
.env                # API Key 等敏感配置（不提交）
docs/               # 设计文档、实施计划
```

## 当前状态

### 活跃分支
（每次新开 CC 窗口时更新此处）
- 无

### 已完成功能
- Express 后端：/api/data（GET）、/api/update（POST）
- 城市天气 & 空气质量接入（OpenWeatherMap）
- 前端轮询更新（每 1 小时）
- 环境传感器面板 + 路径追踪状态卡片
- 马匹动画叠加层（跟随缩放、粒子效果）
- 城市→省份高亮联动

## 重要约定
- `.env` 包含 `OPENWEATHER_API_KEY`，不得提交 git
- `data.json` 是运行时产物，已加入 .gitignore（如需持久化需手动处理）
- 启动命令：`npm start`（端口 3000）
- 测试命令：`npm test`
- 前端直接引用 CDN 资源（Leaflet、ECharts），无构建步骤

## 变更日志
| 日期 | 分支 | 说明 |
|------|------|------|
| 2026-04-17 | main | 初始化项目 CLAUDE.md，建立多窗口 git 工作流 |
```

- [ ] **Step 2：确认文件已创建**

```bash
ls -la CLAUDE.md
```

预期输出：文件存在，大小 > 0

- [ ] **Step 3：提交**

```bash
git add CLAUDE.md
git commit -m "docs: add project CLAUDE.md with ChaiHuoCar context"
```

---

### Task 2：创建全局 ~/.claude/CLAUDE.md

**Files:**
- Create: `/Users/allen/.claude/CLAUDE.md`

- [ ] **Step 1：创建全局 CLAUDE.md，写入工作流规则**

创建 `/Users/allen/.claude/CLAUDE.md`，内容如下：

```markdown
# 全局工作流规则

适用于所有项目。每个项目根目录应有独立的 CLAUDE.md 存放项目上下文。

---

## Git 工作流

### 每个 CC 窗口启动时
1. 读取本文件（了解工作流规则）
2. 读取项目根目录 CLAUDE.md（了解项目现状、活跃分支、重要约定）
3. 确认当前在 main 分支，然后创建新分支开始工作

### 分支命名
| 前缀 | 用途 |
|------|------|
| `feature/` | 新功能 |
| `fix/` | 缺陷修复 |
| `refactor/` | 重构 |
| `docs/` | 文档 |

示例：`feature/horse-overlay`、`fix/weather-api-timeout`

### 提交信息规范
```
feat: 描述      # 新功能
fix: 描述       # 修复
docs: 描述      # 文档
chore: 描述     # 杂项
refactor: 描述  # 重构
```

### 任务完成后
1. 确保所有改动已提交到当前分支
2. 告知用户：「任务完成，分支 <branch-name> 已就绪，可以合并到 main」
3. **等待用户确认**，不要主动执行合并

### 合并到 main（用户确认后执行）
```bash
git checkout main
git merge --no-ff <branch-name> -m "merge: <branch-name> into main"
```

**遇到冲突时：立即停止，列出所有冲突文件，等待用户决策，禁止自动解决冲突。**

合并成功后：
- 更新项目 CLAUDE.md 的变更日志（追加一行）
- 更新项目 CLAUDE.md 的「活跃分支」（移除已合并的分支）
- 分支保留不删，方便回溯

### GitHub 推送
- **不主动推送**，必须等用户明确说「推送」或「push」再执行
- 推送命令：`git push origin main`

---

## 项目 CLAUDE.md 规范

每个项目根目录必须有 CLAUDE.md，包含以下章节：

```markdown
# 项目名称

## 项目简介
## 技术栈
## 目录结构
## 当前状态
  - 活跃分支（正在进行的分支及任务）
  - 已完成功能
## 重要约定
## 变更日志（表格：日期 | 分支 | 说明）
```

### 更新时机
- 每次 merge 完成后：追加变更日志一行，移除已合并分支
- 新功能完成时：更新「已完成功能」
- 发现重要约定时：立即更新「重要约定」
- 新窗口开始工作时：在「活跃分支」加入自己的分支和任务描述
```

- [ ] **Step 2：确认文件已创建**

```bash
ls -la /Users/allen/.claude/CLAUDE.md
```

预期输出：文件存在，大小 > 0

- [ ] **Step 3：验证全局 CLAUDE.md 不在 git 追踪范围内**

全局 CLAUDE.md 位于 `~/.claude/`，不属于任何项目 git 仓库，无需提交。确认即可：

```bash
git status
```

预期输出：`nothing to commit` 或仅显示项目内文件变动，不包含 `~/.claude/CLAUDE.md`

---

### Task 3：自检与收尾

- [ ] **Step 1：验证项目 CLAUDE.md 已提交**

```bash
git log --oneline -3
```

预期输出：最近一条提交包含 `docs: add project CLAUDE.md`

- [ ] **Step 2：验证全局文件内容完整**

```bash
wc -l /Users/allen/.claude/CLAUDE.md
```

预期输出：行数 > 50

- [ ] **Step 3：模拟新 CC 窗口读取流程**

确认以下两个文件都可正常读取，内容完整：
- `/Users/allen/.claude/CLAUDE.md`（工作流规则）
- `/Users/allen/Desktop/resourse/ChaiHuoCar/dashboard/CLAUDE.md`（项目上下文）

一个新 CC 窗口读完这两份文档，应该能回答：
- 这个项目是做什么的？（项目简介）
- 主要有哪些文件？（目录结构）
- 如何启动和测试？（重要约定）
- 开新分支应该叫什么名字？（全局规则）
- 完成后如何合并？（全局规则）
