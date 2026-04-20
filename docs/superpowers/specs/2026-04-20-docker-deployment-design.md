# Docker 部署设计

**目标：** 将 ChaiHuoCar 仪表板（Express + 静态前端）打包为 Docker 镜像，运维工程师从 GitHub 拉取代码后一条命令启动，同事通过公网 URL 访问网站并调用 API 推送数据。

---

## 架构

```
同事设备
  └── HTTP GET /api/update?city=深圳
          ↓
   [Docker 容器: Node.js 20 + Express]
     ├── 静态文件服务 (index.html, map-animation.js 等)
     ├── GET /api/data       ← 前端每秒轮询
     └── GET /api/update     ← 同事推数据
          ↓ fs.writeFileSync
   [Docker Volume → 宿主机 data.json]  ← 容器重启数据不丢失
```

---

## 部署流程

```
开发者 (你)              运维工程师                服务器
──────────              ──────────               ─────────
写代码
  ↓
git push
  → GitHub 仓库  →  git clone/pull
                         ↓
                    docker build -t chaihuo-dashboard .
                         ↓
                    docker run (见下方命令)  →  公网可访问
```

**更新代码：** 你 `git push` → 运维 `git pull` → 重新 `docker build` + `docker run`。

---

## 文件改动

### 1. `server.js`

将第 52 行：
```javascript
const API_KEY = process.env.OPENWEATHER_API_KEY;
```
改为：
```javascript
const API_KEY = '7fa904ddcca965c7c641d02ac563da75';
```

同时移除 `require('dotenv').config()` 调用（如果存在），以及 `dotenv` 依赖可选保留（不影响运行）。

### 2. 新建 `Dockerfile`

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

### 3. 新建 `.dockerignore`

```
node_modules
.env
.DS_Store
docs
```

`data.json` **不列入** `.dockerignore`——容器内初始无此文件时 server.js 已有兜底（返回 `{ empty: true }`），Volume 挂载后写入的数据落到宿主机。

---

## 运维工程师操作命令

```bash
# 1. 拉取代码（首次）
git clone https://github.com/Chaihuo-Makerspace/Dashboard.git
cd Dashboard

# 2. 在宿主机创建数据文件（首次）
echo '{}' > /host/path/data.json

# 3. 构建镜像
docker build -t chaihuo-dashboard .

# 4. 启动容器
docker run -d \
  --name chaihuo-dashboard \
  -p 3000:3000 \
  -v /host/path/data.json:/app/data.json \
  chaihuo-dashboard:latest
```

访问：`http://服务器IP:3000`

---

## API 接口说明（给同事）

| 接口 | 方法 | 参数 | 说明 |
|------|------|------|------|
| `/api/update` | GET | `?city=城市名` | 推送城市数据，触发天气刷新 |
| `/api/data` | GET | 无 | 获取当前数据（前端内部使用） |

示例：`http://服务器IP:3000/api/update?city=深圳`

---

## 验证

1. `docker build` 无报错
2. `docker run` 后 `docker ps` 显示容器运行中
3. 浏览器访问 `http://服务器IP:3000` 正常显示仪表板
4. 调用 `/api/update?city=深圳` 返回成功，仪表板数据刷新
5. 重启容器后 `data.json` 数据依然存在（Volume 生效）
