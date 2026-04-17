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
