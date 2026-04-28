# Docker Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Express 仪表板打包为 Docker 镜像，供运维工程师从 GitHub 拉取代码后一条命令启动，同事通过公网 URL 访问并调用 API 推数据。

**Architecture:** Express 静态文件服务 + API 全部在同一个 Node.js 进程里，打包进单阶段 Docker 镜像。`data.json` 通过 Docker Volume 挂载到宿主机，容器重启数据不丢。API Key 直接硬编码在 `server.js`，运维无需传环境变量。

**Tech Stack:** Node.js 20-alpine, Express 4, Docker

---

## 文件结构

| 文件 | 操作 | 说明 |
|------|------|------|
| `server.js` | 修改第 3、52、108 行 | 移除 dotenv，hardcode API key，固定端口 3000 |
| `Dockerfile` | 新建 | 单阶段镜像，暴露 3000 端口 |
| `.dockerignore` | 新建 | 排除 node_modules、.env、docs 等 |

---

### Task 1: 修改 server.js — 移除 dotenv，hardcode API key

**Files:**
- Modify: `server.js:3` (移除 dotenv)
- Modify: `server.js:52` (hardcode API key)
- Modify: `server.js:108` (移除 PORT 环境变量，固定 3000)

- [ ] **Step 1: 移除第 3 行的 dotenv 调用**

将：
```javascript
require('dotenv').config();
```
删除这一行（整行删除）。

- [ ] **Step 2: Hardcode API key（第 52 行）**

将：
```javascript
  const API_KEY = process.env.OPENWEATHER_API_KEY;
```
改为：
```javascript
  const API_KEY = '7fa904ddcca965c7c641d02ac563da75';
```

- [ ] **Step 3: 固定端口为 3000（第 108 行）**

将：
```javascript
const PORT = process.env.PORT || 3000;
```
改为：
```javascript
const PORT = 3000;
```

- [ ] **Step 4: 本地验证 server 仍可正常启动**

```bash
cd ~/Desktop/resourse/ChaiHuoCar/dashboard
node server.js
```
Expected：终端打印 `Dashboard server running on http://localhost:3000`，无报错。Ctrl+C 停止。

- [ ] **Step 5: 提交**

```bash
git add server.js
git commit -m "chore: hardcode API key and port for Docker deployment"
```

---

### Task 2: 新建 Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: 创建 Dockerfile**

在项目根目录创建文件 `Dockerfile`，内容如下：

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server.js"]
```

逐行说明：
- `node:20-alpine`：轻量镜像，约 180MB
- `npm ci --omit=dev`：只装生产依赖（不装 jest、supertest）
- `COPY . .`：复制所有源码（.dockerignore 会排除无关文件）
- `EXPOSE 3000`：声明容器监听端口（实际端口映射由 `docker run -p` 决定）

- [ ] **Step 2: 提交**

```bash
git add Dockerfile
git commit -m "chore: add Dockerfile for production deployment"
```

---

### Task 3: 新建 .dockerignore

**Files:**
- Create: `.dockerignore`

- [ ] **Step 1: 创建 .dockerignore**

在项目根目录创建文件 `.dockerignore`，内容如下：

```
node_modules
.env
.DS_Store
docs
*.test.js
```

说明：
- `node_modules`：镜像内会重新 `npm ci`，不需要复制本地的
- `.env`：API key 已 hardcode，不需要 .env 文件进镜像
- `docs`：设计文档不需要打进镜像
- `*.test.js`：测试文件不需要打进镜像
- `data.json` **不排除**：Volume 挂载会覆盖，保留兜底（空文件/无文件时 server 有处理）

- [ ] **Step 2: 提交**

```bash
git add .dockerignore
git commit -m "chore: add .dockerignore"
```

---

### Task 4: 本地 Docker 构建验证

> 需要本地已安装 Docker Desktop。如果没有安装，跳过此 Task，直接给运维工程师执行。

**Files:** 无文件改动，仅验证

- [ ] **Step 1: 构建镜像**

```bash
cd ~/Desktop/resourse/ChaiHuoCar/dashboard
docker build -t chaihuo-dashboard .
```

Expected：最后一行输出类似：
```
Successfully built xxxxxxxx
Successfully tagged chaihuo-dashboard:latest
```

- [ ] **Step 2: 启动容器**

```bash
# 在宿主机创建初始 data.json（首次必须先建文件，否则 Volume 挂载会变成目录）
echo '{}' > /tmp/chaihuo-data.json

docker run -d \
  --name chaihuo-test \
  -p 3000:3000 \
  -v /tmp/chaihuo-data.json:/app/data.json \
  chaihuo-dashboard:latest
```

- [ ] **Step 3: 验证容器正在运行**

```bash
docker ps
```

Expected：看到 `chaihuo-test` 容器状态为 `Up`。

- [ ] **Step 4: 验证页面可访问**

浏览器打开 `http://localhost:3000`，确认仪表板正常显示，无 JS 报错。

- [ ] **Step 5: 验证 API 推数据**

```bash
curl "http://localhost:3000/api/update?city=深圳"
```

Expected：返回 JSON 包含 `city`, `temperature`, `humidity` 等字段。

- [ ] **Step 6: 验证 Volume 持久化**

```bash
cat /tmp/chaihuo-data.json
```

Expected：文件内容已更新为深圳的天气数据（不再是 `{}`）。

- [ ] **Step 7: 验证重启后数据仍存在**

```bash
docker restart chaihuo-test
cat /tmp/chaihuo-data.json
```

Expected：文件内容依然是深圳数据（不因容器重启而清空）。

- [ ] **Step 8: 清理测试容器**

```bash
docker stop chaihuo-test && docker rm chaihuo-test
```

---

### Task 5: 推送到 GitHub 供运维使用

**Files:** 无文件改动

- [ ] **Step 1: 推送所有提交到 GitHub**

```bash
git push origin main
```

- [ ] **Step 2: 将以下命令交给运维工程师**

```bash
# 1. 克隆仓库
git clone https://github.com/Chaihuo-Makerspace/Dashboard.git
cd Dashboard

# 2. 在宿主机创建初始数据文件（必须先建文件）
echo '{}' > /host/path/data.json

# 3. 构建镜像
docker build -t chaihuo-dashboard .

# 4. 启动容器（将 /host/path/data.json 替换为实际路径）
docker run -d \
  --name chaihuo-dashboard \
  -p 3000:3000 \
  --restart unless-stopped \
  -v /host/path/data.json:/app/data.json \
  chaihuo-dashboard:latest
```

注：`--restart unless-stopped` 让容器在服务器重启后自动拉起。

- [ ] **Step 3: 告知同事 API 调用方式**

```
推送城市数据：
GET http://服务器IP:3000/api/update?city=城市名

示例：
http://服务器IP:3000/api/update?city=深圳
http://服务器IP:3000/api/update?city=北京
```

---

## 后续更新流程（代码有改动时）

```bash
# 运维工程师在服务器上执行：
cd Dashboard
git pull
docker build -t chaihuo-dashboard .
docker stop chaihuo-dashboard && docker rm chaihuo-dashboard
docker run -d \
  --name chaihuo-dashboard \
  -p 3000:3000 \
  --restart unless-stopped \
  -v /host/path/data.json:/app/data.json \
  chaihuo-dashboard:latest
```
