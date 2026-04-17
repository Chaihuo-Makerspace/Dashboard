# 城市天气接口 & 面板联动设计

**日期**：2026-04-17  
**范围**：第一步——环境传感器数据面板 + 路径追踪图面板的后端化  
**其余 4 个模块（AI 共创进度、社区互动、综合运行状态、车辆与生命维持）暂不改动**

---

## 1. 目标

外部设备获取当地城市名后，调用一个 HTTP 接口将位置推送给后端。后端拉取实时天气与空气质量数据，持久化到本地文件，前端定期读取并更新两个面板。

---

## 2. 技术栈

| 层 | 选型 |
|----|------|
| 后端 | Node.js + Express |
| 数据持久化 | `data.json`（本地文件，服务重启不丢数据） |
| 天气数据 | OpenWeatherMap Current Weather API + Air Pollution API |
| 地理编码 | OpenWeatherMap Geocoding API（城市名 → 经纬度） |
| 省份映射 | 后端静态 JSON 表（城市 → 省份，覆盖主要中国城市） |
| 前端更新 | 页面加载时 + 每 1 小时轮询 `GET /api/data` |

---

## 3. 目录结构

```
dashboard/
├── index.html          # 现有，最小改动
├── map-config.js       # 现有，不动
├── map-animation.js    # 现有，新增 highlightProvince() 方法
├── server.js           # 新增：Express 后端
├── city-province.json  # 新增：城市→省份静态映射表
├── data.json           # 新增：天气缓存（git ignore）
├── .env                # 新增：API Key（git ignore）
├── .gitignore          # 新增/更新
└── package.json        # 新增
```

---

## 4. API 接口

### 4.1 `GET /api/update?city={城市名}`

由外部设备调用，每天自动触发一次。

**流程：**
1. 调用 OpenWeatherMap Geocoding API，将城市名转为经纬度
2. 并行请求：
   - Current Weather API → 温度、湿度、气压、风速、天气图标 code
   - Air Pollution API → PM2.5 值、AQI 等级
3. 查询 `city-province.json` 获取省份名
4. 如果城市名与上次不同，重置"在此城市逗留天数"起始时间
5. 将结果写入 `data.json`
6. 返回最新数据（同 `/api/data` 格式）

**响应示例（200 OK）：**
```json
{
  "city": "成都",
  "province": "四川",
  "weatherIcon": "04d",
  "temperature": 18.3,
  "humidity": 72,
  "pressure": 944,
  "windSpeed": 2.1,
  "pm25": 35,
  "aqi": "良",
  "cityArrivedAt": "2026-04-15T08:00:00Z",
  "updatedAt": "2026-04-17T10:00:00Z"
}
```

**错误响应（400/500）：**
```json
{ "error": "城市名无法识别" }
```

---

### 4.2 `GET /api/data`

前端轮询，返回 `data.json` 当前内容。若文件不存在（首次启动），返回 `{ "empty": true }`，前端保持默认硬编码数据不变。

---

## 5. 数据持久化格式（data.json）

```json
{
  "city": "成都",
  "province": "四川",
  "weatherIcon": "04d",
  "temperature": 18.3,
  "humidity": 72,
  "pressure": 944,
  "windSpeed": 2.1,
  "pm25": 35,
  "aqi": "良",
  "cityArrivedAt": "2026-04-15T08:00:00Z",
  "updatedAt": "2026-04-17T10:00:00Z"
}
```

---

## 6. 前端改动

### 6.1 环境传感器面板（左上）

- **顶部位置行**：`[天气图标 <img>] [城市名]`（图标在左，城市在右），替换原硬编码"深圳南山区"
- **PM2.5 行**：数值动态更新，AQI 等级标签（优/良/轻度/中度/重度）同步更新
- **温度**：大数字 + 折线图数据点追加最新值
- **湿度**：仪表盘进度更新
- **气压**：大数字替换
- **风速**：替换原"海拔"位置，显示 `X.X m/s`，标签改为"风速 (Wind Speed)"

### 6.2 路径追踪图状态卡（中央右上角）

原三行改为：

| 字段 | 计算方式 |
|------|----------|
| 当前位置 | `data.city`（动态） |
| 在此逗留 | `Math.floor((now - cityArrivedAt) / 86400000)` 天 |
| 出发至今 | `Math.floor((now - new Date('2026-04-22')) / 86400000)` 天 |

移除"故事解锁"行。

### 6.3 路径追踪图地图高亮

`map-animation.js` 新增方法：

```js
highlightProvince(provinceName)
```

调用 ECharts `dispatchAction` 的 `select` 动作，将对应省份从默认深蓝色改为高亮青色（复用现有 `mapEmphasisColor`）。每次收到新数据时先取消上次高亮，再高亮新省份。

### 6.4 轮询机制

- 页面加载时立即请求一次 `GET /api/data`
- 之后每 **1 小时** 轮询一次
- 若返回 `{ "empty": true }`，保持页面默认值不变

---

## 7. 省份映射

后端维护 `city-province.json`，格式：

```json
{
  "成都": "四川",
  "深圳": "广东",
  "北京": "北京",
  "拉萨": "西藏",
  ...
}
```

覆盖约 300 个主要中国城市。若城市不在表中，`province` 字段返回 `null`，前端不触发地图高亮。

---

## 8. 安全

- API Key 存于 `.env` 文件，通过 `dotenv` 加载，不进入代码
- `.env` 和 `data.json` 加入 `.gitignore`
- `/api/update` 暂不加鉴权（内网/设备直调场景），后续如需上线可加简单 token

---

## 9. 出行配置

| 参数 | 值 |
|------|-----|
| 出发城市 | 深圳 |
| 出发日期 | 2026-04-22 |
| 总行程 | 200 天环中国 |

出发日期硬编码在 `server.js` 顶部常量，便于修改。

---

## 10. 不在本次范围内

- 历史路径绘制（地图上的轨迹线）
- 城市自动定位（GPS 集成）
- 其余 4 个面板的后端化
- `/api/update` 鉴权
