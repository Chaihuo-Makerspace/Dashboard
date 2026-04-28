# 柴火创客中心 · 车辆追踪仪表盘

实时展示路径追踪、环境传感器数据、天气与空气质量信息的全屏看板应用。  
由车载设备通过 HTTP 接口上报位置，服务端自动拉取天气/空气质量数据并推送给前端。

![Node.js](https://img.shields.io/badge/Node.js-20-green) ![Express](https://img.shields.io/badge/Express-4-lightgrey) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## 功能概览

| 面板 | 内容 |
|------|------|
| 环境传感器 | 温度、湿度、气压、风速、PM2.5、AQI |
| 路径追踪地图 | ECharts 地图 + 省份高亮 + 到达时间 |
| 系统状态 | 服务运行状态卡片 |
| AI 进度 | 任务进度展示 |
| 照片轮播 | 读取本地 `photos/` 目录自动轮播 |
| 评论轮播 | 随机用户评论 + DiceBear 头像 |

**响应式布局**：支持 1280px ~ 1920px 宽度屏幕（笔记本 → 大屏显示器）。

---

## 快速开始

### 前置条件

- Node.js ≥ 18
- [OpenWeatherMap](https://openweathermap.org/api) 免费 API Key

### 安装

```bash
git clone https://github.com/Allenkzl/chaihuo-car-dashboard.git
cd chaihuo-car-dashboard
npm install
```

### 配置

在项目根目录创建 `.env` 文件：

```env
OPENWEATHER_API_KEY=你的_API_KEY
```

### 启动

```bash
npm start
# 浏览器打开 http://localhost:3000
```

### 测试

```bash
npm test
```

---

## Docker 部署

```bash
# 构建镜像
docker build -t chaihuo-dashboard .

# 运行容器（需传入 API Key）
docker run -d \
  -p 3000:3000 \
  -e OPENWEATHER_API_KEY=你的_API_KEY \
  --name chaihuo-dashboard \
  chaihuo-dashboard
```

---

## 数据接口

服务启动后监听 `http://localhost:3000`，提供以下接口：

---

### `GET /api/update` — 上报当前城市（车载设备调用）

车载设备到达新城市时调用此接口，服务端自动拉取天气、AQI 并持久化。

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `city` | string | ✅ | 中文城市名，如 `上海`、`深圳` |

**示例**

```bash
# 本地开发（直接传中文即可）
curl "http://localhost:3000/api/update?city=上海"

# 线上/通过反向代理访问时，中文必须 URL 编码，否则代理会拒绝请求
curl "https://your-domain.com/api/update?city=%E4%B8%8A%E6%B5%B7"
```

大多数 HTTP 库会自动处理编码，无需手动转换：

```python
# Python — requests 自动编码
import requests
requests.get("https://your-domain.com/api/update", params={"city": "上海"})
```

```javascript
// JavaScript — encodeURIComponent 手动编码
fetch(`https://your-domain.com/api/update?city=${encodeURIComponent("上海")}`);
```

**成功响应** `200 OK`

```json
{
  "city": "上海",
  "province": "上海",
  "weatherIcon": "01d",
  "temperature": 22.4,
  "humidity": 65,
  "pressure": 1013,
  "windSpeed": 3.5,
  "pm25": 18.3,
  "aqi": "良",
  "cityArrivedAt": "2026-04-28T09:00:00.000Z",
  "updatedAt": "2026-04-28T09:00:00.000Z"
}
```

**错误响应**

| 状态码 | 原因 |
|--------|------|
| `400` | 城市名为空，或城市不在省份映射表中 |
| `500` | 天气 API 调用失败 |

---

### `GET /api/data` — 获取当前数据（前端轮询）

返回最近一次 `/api/update` 写入的完整数据，前端每小时自动轮询。

**示例**

```bash
curl "http://localhost:3000/api/data"
```

**响应**（有数据时）：与 `/api/update` 返回结构相同。  
**响应**（无数据时）：`{ "empty": true }`

---

### `GET /api/photos` — 照片列表

返回 `photos/` 目录下所有图片文件的路径数组，供前端轮播使用。

**示例**

```bash
curl "http://localhost:3000/api/photos"
```

**响应**

```json
["/photos/photo1.jpg", "/photos/photo2.png"]
```

支持格式：`.jpg` `.jpeg` `.png` `.gif` `.webp`

---

## 目录结构

```
├── index.html          # 前端单页应用（所有面板）
├── server.js           # Express 后端
├── server.test.js      # Jest 测试
├── map-animation.js    # 地图动画控制
├── map-config.js       # 地图配置
├── city-province.json  # 城市 → 省份静态映射（覆盖主要中国城市）
├── photos/             # 本地照片目录（照片轮播素材）
├── data.json           # 运行时数据持久化（gitignore，自动生成）
├── Dockerfile
└── .env                # API Key（不提交 git）
```

---

## 技术栈

- **后端**：Node.js + Express
- **前端**：Vanilla JS / HTML / CSS
- **地图**：Leaflet + ECharts
- **样式**：Tailwind CSS CDN
- **天气数据**：OpenWeatherMap API（Current Weather + Air Pollution + Geocoding）
- **头像**：DiceBear Avataaars

---

## License

[MIT](LICENSE)
