# City Weather API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Node.js/Express backend that accepts a city name, fetches weather + air quality data from OpenWeatherMap, persists it to `data.json`, and updates the Environmental Sensor panel and Route Tracking Map on the frontend.

**Architecture:** External device calls `GET /api/update?city=X` → server geocodes city, fetches weather + PM2.5 in parallel, writes `data.json`, returns latest data. Frontend polls `GET /api/data` every hour to update two panels and map province highlight.

**Tech Stack:** Node.js 18+ (built-in fetch), Express 4, dotenv, Jest + supertest (tests)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Create | Deps, scripts |
| `.env` | Create | API key (gitignored) |
| `.gitignore` | Create | Exclude .env, data.json, node_modules |
| `city-province.json` | Create | Static city→province lookup (~300 cities) |
| `server.js` | Create | Express server: /api/data + /api/update |
| `map-animation.js` | Modify | Add `highlightProvince(name)` method |
| `index.html` | Modify | Add IDs to sensor panel + status card DOM nodes, remove story unlock row, add polling script |

---

## Task 1: Project bootstrap

**Files:**
- Create: `package.json`
- Create: `.env`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "chaihuo-dashboard",
  "version": "1.0.0",
  "type": "commonjs",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^7.0.0"
  }
}
```

- [ ] **Step 2: Create .env**

```
OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY
PORT=3000
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
.env
data.json
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`

Expected: `node_modules/` created, no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json .gitignore
git commit -m "chore: bootstrap Node.js project"
```

(Do NOT git add `.env` or `data.json`.)

---

## Task 2: City-province mapping

**Files:**
- Create: `city-province.json`

- [ ] **Step 1: Create city-province.json**

```json
{
  "北京": "北京",
  "天津": "天津",
  "上海": "上海",
  "重庆": "重庆",
  "石家庄": "河北",
  "唐山": "河北",
  "秦皇岛": "河北",
  "邯郸": "河北",
  "保定": "河北",
  "张家口": "河北",
  "承德": "河北",
  "廊坊": "河北",
  "沧州": "河北",
  "太原": "山西",
  "大同": "山西",
  "阳泉": "山西",
  "长治": "山西",
  "晋城": "山西",
  "朔州": "山西",
  "晋中": "山西",
  "运城": "山西",
  "忻州": "山西",
  "临汾": "山西",
  "吕梁": "山西",
  "呼和浩特": "内蒙古",
  "包头": "内蒙古",
  "乌海": "内蒙古",
  "赤峰": "内蒙古",
  "通辽": "内蒙古",
  "鄂尔多斯": "内蒙古",
  "呼伦贝尔": "内蒙古",
  "巴彦淖尔": "内蒙古",
  "乌兰察布": "内蒙古",
  "沈阳": "辽宁",
  "大连": "辽宁",
  "鞍山": "辽宁",
  "抚顺": "辽宁",
  "本溪": "辽宁",
  "丹东": "辽宁",
  "锦州": "辽宁",
  "营口": "辽宁",
  "阜新": "辽宁",
  "辽阳": "辽宁",
  "盘锦": "辽宁",
  "铁岭": "辽宁",
  "朝阳": "辽宁",
  "葫芦岛": "辽宁",
  "长春": "吉林",
  "吉林": "吉林",
  "四平": "吉林",
  "辽源": "吉林",
  "通化": "吉林",
  "白山": "吉林",
  "松原": "吉林",
  "白城": "吉林",
  "延边": "吉林",
  "哈尔滨": "黑龙江",
  "齐齐哈尔": "黑龙江",
  "鸡西": "黑龙江",
  "鹤岗": "黑龙江",
  "双鸭山": "黑龙江",
  "大庆": "黑龙江",
  "伊春": "黑龙江",
  "佳木斯": "黑龙江",
  "七台河": "黑龙江",
  "牡丹江": "黑龙江",
  "黑河": "黑龙江",
  "绥化": "黑龙江",
  "南京": "江苏",
  "无锡": "江苏",
  "徐州": "江苏",
  "常州": "江苏",
  "苏州": "江苏",
  "南通": "江苏",
  "连云港": "江苏",
  "淮安": "江苏",
  "盐城": "江苏",
  "扬州": "江苏",
  "镇江": "江苏",
  "泰州": "江苏",
  "宿迁": "江苏",
  "杭州": "浙江",
  "宁波": "浙江",
  "温州": "浙江",
  "嘉兴": "浙江",
  "湖州": "浙江",
  "绍兴": "浙江",
  "金华": "浙江",
  "衢州": "浙江",
  "舟山": "浙江",
  "台州": "浙江",
  "丽水": "浙江",
  "合肥": "安徽",
  "芜湖": "安徽",
  "蚌埠": "安徽",
  "淮南": "安徽",
  "马鞍山": "安徽",
  "淮北": "安徽",
  "铜陵": "安徽",
  "安庆": "安徽",
  "黄山": "安徽",
  "滁州": "安徽",
  "阜阳": "安徽",
  "宿州": "安徽",
  "六安": "安徽",
  "亳州": "安徽",
  "池州": "安徽",
  "宣城": "安徽",
  "福州": "福建",
  "厦门": "福建",
  "莆田": "福建",
  "三明": "福建",
  "泉州": "福建",
  "漳州": "福建",
  "南平": "福建",
  "龙岩": "福建",
  "宁德": "福建",
  "南昌": "江西",
  "景德镇": "江西",
  "萍乡": "江西",
  "九江": "江西",
  "新余": "江西",
  "鹰潭": "江西",
  "赣州": "江西",
  "吉安": "江西",
  "宜春": "江西",
  "抚州": "江西",
  "上饶": "江西",
  "济南": "山东",
  "青岛": "山东",
  "淄博": "山东",
  "枣庄": "山东",
  "东营": "山东",
  "烟台": "山东",
  "潍坊": "山东",
  "济宁": "山东",
  "泰安": "山东",
  "威海": "山东",
  "日照": "山东",
  "临沂": "山东",
  "德州": "山东",
  "聊城": "山东",
  "滨州": "山东",
  "菏泽": "山东",
  "郑州": "河南",
  "开封": "河南",
  "洛阳": "河南",
  "平顶山": "河南",
  "安阳": "河南",
  "鹤壁": "河南",
  "新乡": "河南",
  "焦作": "河南",
  "濮阳": "河南",
  "许昌": "河南",
  "漯河": "河南",
  "三门峡": "河南",
  "南阳": "河南",
  "商丘": "河南",
  "信阳": "河南",
  "周口": "河南",
  "驻马店": "河南",
  "武汉": "湖北",
  "黄石": "湖北",
  "十堰": "湖北",
  "宜昌": "湖北",
  "襄阳": "湖北",
  "鄂州": "湖北",
  "荆门": "湖北",
  "孝感": "湖北",
  "荆州": "湖北",
  "黄冈": "湖北",
  "咸宁": "湖北",
  "随州": "湖北",
  "长沙": "湖南",
  "株洲": "湖南",
  "湘潭": "湖南",
  "衡阳": "湖南",
  "邵阳": "湖南",
  "岳阳": "湖南",
  "常德": "湖南",
  "张家界": "湖南",
  "益阳": "湖南",
  "郴州": "湖南",
  "永州": "湖南",
  "怀化": "湖南",
  "娄底": "湖南",
  "广州": "广东",
  "深圳": "广东",
  "珠海": "广东",
  "汕头": "广东",
  "佛山": "广东",
  "韶关": "广东",
  "湛江": "广东",
  "肇庆": "广东",
  "江门": "广东",
  "茂名": "广东",
  "惠州": "广东",
  "梅州": "广东",
  "汕尾": "广东",
  "河源": "广东",
  "阳江": "广东",
  "清远": "广东",
  "东莞": "广东",
  "中山": "广东",
  "潮州": "广东",
  "揭州": "广东",
  "云浮": "广东",
  "南宁": "广西",
  "柳州": "广西",
  "桂林": "广西",
  "梧州": "广西",
  "北海": "广西",
  "防城港": "广西",
  "钦州": "广西",
  "贵港": "广西",
  "玉林": "广西",
  "百色": "广西",
  "贺州": "广西",
  "河池": "广西",
  "来宾": "广西",
  "崇左": "广西",
  "海口": "海南",
  "三亚": "海南",
  "三沙": "海南",
  "儋州": "海南",
  "成都": "四川",
  "自贡": "四川",
  "攀枝花": "四川",
  "泸州": "四川",
  "德阳": "四川",
  "绵阳": "四川",
  "广元": "四川",
  "遂宁": "四川",
  "内江": "四川",
  "乐山": "四川",
  "南充": "四川",
  "眉山": "四川",
  "宜宾": "四川",
  "广安": "四川",
  "达州": "四川",
  "雅安": "四川",
  "巴中": "四川",
  "资阳": "四川",
  "贵阳": "贵州",
  "六盘水": "贵州",
  "遵义": "贵州",
  "安顺": "贵州",
  "毕节": "贵州",
  "铜仁": "贵州",
  "昆明": "云南",
  "曲靖": "云南",
  "玉溪": "云南",
  "保山": "云南",
  "昭通": "云南",
  "丽江": "云南",
  "普洱": "云南",
  "临沧": "云南",
  "大理": "云南",
  "西双版纳": "云南",
  "拉萨": "西藏",
  "日喀则": "西藏",
  "昌都": "西藏",
  "林芝": "西藏",
  "山南": "西藏",
  "那曲": "西藏",
  "西安": "陕西",
  "铜川": "陕西",
  "宝鸡": "陕西",
  "咸阳": "陕西",
  "渭南": "陕西",
  "延安": "陕西",
  "汉中": "陕西",
  "榆林": "陕西",
  "安康": "陕西",
  "商洛": "陕西",
  "兰州": "甘肃",
  "嘉峪关": "甘肃",
  "金昌": "甘肃",
  "白银": "甘肃",
  "天水": "甘肃",
  "武威": "甘肃",
  "张掖": "甘肃",
  "平凉": "甘肃",
  "酒泉": "甘肃",
  "庆阳": "甘肃",
  "定西": "甘肃",
  "陇南": "甘肃",
  "敦煌": "甘肃",
  "西宁": "青海",
  "海东": "青海",
  "格尔木": "青海",
  "银川": "宁夏",
  "石嘴山": "宁夏",
  "吴忠": "宁夏",
  "固原": "宁夏",
  "中卫": "宁夏",
  "乌鲁木齐": "新疆",
  "克拉玛依": "新疆",
  "吐鲁番": "新疆",
  "哈密": "新疆",
  "喀什": "新疆",
  "和田": "新疆",
  "阿克苏": "新疆",
  "库尔勒": "新疆",
  "伊宁": "新疆",
  "塔城": "新疆",
  "阿勒泰": "新疆",
  "香港": "香港",
  "澳门": "澳门"
}
```

- [ ] **Step 2: Commit**

```bash
git add city-province.json
git commit -m "feat: add city-to-province static mapping"
```

---

## Task 3: Express server — /api/data endpoint

**Files:**
- Create: `server.js`
- Create: `server.test.js`

- [ ] **Step 1: Write failing test for /api/data (no data.json)**

Create `server.test.js`:

```js
const request = require('supertest');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data.json');

// Clean up data.json before each test
beforeEach(() => {
  if (fs.existsSync(DATA_PATH)) fs.unlinkSync(DATA_PATH);
});

afterEach(() => {
  if (fs.existsSync(DATA_PATH)) fs.unlinkSync(DATA_PATH);
});

let app;
beforeAll(() => {
  process.env.OPENWEATHER_API_KEY = 'test_key';
  app = require('./server');
});

afterAll(() => {
  // Close server if exported
  if (app.close) app.close();
});

describe('GET /api/data', () => {
  it('returns { empty: true } when no data.json exists', async () => {
    const res = await request(app).get('/api/data');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ empty: true });
  });

  it('returns stored data when data.json exists', async () => {
    const mockData = {
      city: '成都',
      province: '四川',
      weatherIcon: '04d',
      temperature: 18.3,
      humidity: 72,
      pressure: 944,
      windSpeed: 2.1,
      pm25: 35,
      aqi: '良',
      cityArrivedAt: '2026-04-15T08:00:00.000Z',
      updatedAt: '2026-04-17T10:00:00.000Z'
    };
    fs.writeFileSync(DATA_PATH, JSON.stringify(mockData));

    const res = await request(app).get('/api/data');
    expect(res.status).toBe(200);
    expect(res.body.city).toBe('成都');
    expect(res.body.province).toBe('四川');
    expect(res.body.temperature).toBe(18.3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest server.test.js --testNamePattern="GET /api/data" 2>&1 | head -30`

Expected: FAIL — `Cannot find module './server'`

- [ ] **Step 3: Create server.js with /api/data**

```js
'use strict';

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_PATH = path.join(__dirname, 'data.json');
const CITY_PROVINCE_PATH = path.join(__dirname, 'city-province.json');
const DEPARTURE_DATE = new Date('2026-04-22T00:00:00.000Z');

// Serve static files (index.html, js, etc.)
app.use(express.static(__dirname));

// GET /api/data — frontend polling endpoint
app.get('/api/data', (req, res) => {
  if (!fs.existsSync(DATA_PATH)) {
    return res.json({ empty: true });
  }
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return res.json(JSON.parse(raw));
  } catch {
    return res.json({ empty: true });
  }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Dashboard server running on http://localhost:${PORT}`));
}

module.exports = app;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest server.test.js --testNamePattern="GET /api/data" --verbose`

Expected: PASS — 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add server.js server.test.js
git commit -m "feat: add Express server with /api/data endpoint"
```

---

## Task 4: Express server — /api/update endpoint

**Files:**
- Modify: `server.js`
- Modify: `server.test.js`

- [ ] **Step 1: Write failing tests for /api/update**

Append to the `describe` blocks in `server.test.js`:

```js
describe('GET /api/update', () => {
  it('returns 400 when city param is missing', async () => {
    const res = await request(app).get('/api/update');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/城市名/);
  });

  it('returns 400 when city is not in province map', async () => {
    // Mock fetch to avoid real HTTP calls
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ([{ lat: 0, lon: 0, name: 'Unknown' }])
    });

    const res = await request(app).get('/api/update?city=不存在城市XYZ');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/未找到/);
  });

  it('fetches weather and writes data.json on valid city', async () => {
    // Mock all three fetch calls: geocode, weather, air pollution
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([{ lat: 30.66, lon: 104.06 }])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          main: { temp: 18.3, humidity: 72, pressure: 944 },
          wind: { speed: 2.1 },
          weather: [{ icon: '04d' }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          list: [{ main: { aqi: 2 }, components: { pm2_5: 35.0 } }]
        })
      });

    const res = await request(app).get('/api/update?city=成都');
    expect(res.status).toBe(200);
    expect(res.body.city).toBe('成都');
    expect(res.body.province).toBe('四川');
    expect(res.body.temperature).toBe(18.3);
    expect(res.body.humidity).toBe(72);
    expect(res.body.pressure).toBe(944);
    expect(res.body.windSpeed).toBe(2.1);
    expect(res.body.pm25).toBe(35.0);
    expect(res.body.aqi).toBe('良');
    expect(res.body.weatherIcon).toBe('04d');
    expect(fs.existsSync(DATA_PATH)).toBe(true);
  });

  it('preserves cityArrivedAt when same city is called again', async () => {
    const firstArrival = '2026-04-15T08:00:00.000Z';
    const existing = {
      city: '成都', province: '四川', weatherIcon: '04d',
      temperature: 18, humidity: 70, pressure: 940, windSpeed: 2,
      pm25: 30, aqi: '良', cityArrivedAt: firstArrival,
      updatedAt: '2026-04-16T00:00:00.000Z'
    };
    fs.writeFileSync(DATA_PATH, JSON.stringify(existing));

    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ([{ lat: 30.66, lon: 104.06 }]) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ main: { temp: 19, humidity: 71, pressure: 941 }, wind: { speed: 2.2 }, weather: [{ icon: '03d' }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ list: [{ main: { aqi: 2 }, components: { pm2_5: 32 } }] }) });

    const res = await request(app).get('/api/update?city=成都');
    expect(res.status).toBe(200);
    expect(res.body.cityArrivedAt).toBe(firstArrival);
  });

  it('resets cityArrivedAt when city changes', async () => {
    const existing = {
      city: '深圳', province: '广东', weatherIcon: '01d',
      temperature: 25, humidity: 80, pressure: 1010, windSpeed: 3,
      pm25: 20, aqi: '优', cityArrivedAt: '2026-04-10T00:00:00.000Z',
      updatedAt: '2026-04-16T00:00:00.000Z'
    };
    fs.writeFileSync(DATA_PATH, JSON.stringify(existing));

    const before = Date.now();
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ([{ lat: 30.66, lon: 104.06 }]) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ main: { temp: 18, humidity: 72, pressure: 944 }, wind: { speed: 2 }, weather: [{ icon: '04d' }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ list: [{ main: { aqi: 2 }, components: { pm2_5: 35 } }] }) });

    const res = await request(app).get('/api/update?city=成都');
    expect(res.status).toBe(200);
    const arrivedAt = new Date(res.body.cityArrivedAt).getTime();
    expect(arrivedAt).toBeGreaterThanOrEqual(before);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest server.test.js --testNamePattern="GET /api/update" --verbose 2>&1 | head -30`

Expected: FAIL — `Cannot GET /api/update`

- [ ] **Step 3: Add /api/update route to server.js**

Add the following constants and helper after the existing `const DEPARTURE_DATE` line, then add the route before `module.exports`:

```js
const AQI_LABELS = { 1: '优', 2: '良', 3: '轻度', 4: '中度', 5: '重度' };

function loadCityProvince() {
  return JSON.parse(fs.readFileSync(CITY_PROVINCE_PATH, 'utf8'));
}

function loadCurrentData() {
  if (!fs.existsSync(DATA_PATH)) return null;
  try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); } catch { return null; }
}

// GET /api/update?city={cityName} — called by external device
app.get('/api/update', async (req, res) => {
  const city = (req.query.city || '').trim();
  if (!city) {
    return res.status(400).json({ error: '城市名不能为空' });
  }

  const cityProvince = loadCityProvince();
  const province = cityProvince[city] || null;
  if (!province) {
    return res.status(400).json({ error: `未找到城市 "${city}" 对应的省份，请检查城市名` });
  }

  const API_KEY = process.env.OPENWEATHER_API_KEY;

  try {
    // 1. Geocode city → lat/lon
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)},CN&limit=1&appid=${API_KEY}`
    );
    if (!geoRes.ok) throw new Error('Geocoding API failed');
    const geoData = await geoRes.json();
    if (!geoData.length) throw new Error(`城市 "${city}" 无法地理编码`);
    const { lat, lon } = geoData[0];

    // 2. Fetch weather + air pollution in parallel
    const [weatherRes, airRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
    ]);
    if (!weatherRes.ok) throw new Error('Weather API failed');
    if (!airRes.ok) throw new Error('Air Pollution API failed');

    const weather = await weatherRes.json();
    const air = await airRes.json();

    const pm25 = air.list[0].components.pm2_5;
    const aqiIndex = air.list[0].main.aqi;

    // 3. Determine cityArrivedAt
    const existing = loadCurrentData();
    const now = new Date().toISOString();
    const cityArrivedAt = (existing && existing.city === city)
      ? existing.cityArrivedAt
      : now;

    // 4. Build and persist payload
    const payload = {
      city,
      province,
      weatherIcon: weather.weather[0].icon,
      temperature: weather.main.temp,
      humidity: weather.main.humidity,
      pressure: weather.main.pressure,
      windSpeed: weather.wind.speed,
      pm25: Math.round(pm25 * 10) / 10,
      aqi: AQI_LABELS[aqiIndex] || String(aqiIndex),
      cityArrivedAt,
      updatedAt: now
    };

    fs.writeFileSync(DATA_PATH, JSON.stringify(payload, null, 2));
    return res.json(payload);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 4: Run all tests**

Run: `npx jest server.test.js --verbose`

Expected: All tests PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add server.js server.test.js
git commit -m "feat: add /api/update endpoint with OpenWeatherMap integration"
```

---

## Task 5: Map province highlight

**Files:**
- Modify: `map-animation.js`

- [ ] **Step 1: Add highlightProvince() to MapAnimator**

In `map-animation.js`, add the following method inside the `MapAnimator` class, after `bindEvents()`:

```js
  highlightProvince(provinceName) {
    this.chart.setOption({
      geo: {
        regions: provinceName
          ? [{
              name: provinceName,
              itemStyle: {
                areaColor: 'rgba(34, 211, 238, 0.45)',
                borderColor: '#22d3ee',
                shadowColor: '#22d3ee',
                shadowBlur: 25
              },
              label: { color: '#fff', fontWeight: 'bold' }
            }]
          : []
      }
    });
  }
```

- [ ] **Step 2: Verify syntax is correct**

Run: `node -e "require('./map-animation.js'); console.log('OK')" 2>&1`

Expected: `OK` (no errors, since `window.MapAnimator = MapAnimator` runs in browser context but node won't crash on the class definition — actually this will fail due to `window` not defined. So instead verify with:)

Run: `node -e "const src = require('fs').readFileSync('map-animation.js','utf8'); new Function('window', src)({MapAnimator:null}); console.log('OK')"`

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add map-animation.js
git commit -m "feat: add highlightProvince() to MapAnimator"
```

---

## Task 6: Update Environmental Sensor panel DOM

**Files:**
- Modify: `index.html` (lines 225–263)

- [ ] **Step 1: Update the location row (line ~228)**

Find this block in `index.html`:
```html
        <div class="flex items-center gap-2 text-lg text-white font-bold">
          <i class="fas fa-cloud-sun text-yellow-400 text-2xl"></i> 深圳南山区
        </div>
```

Replace with:
```html
        <div class="flex items-center gap-2 text-lg text-white font-bold">
          <img id="weatherIcon" src="" alt="weather" class="w-8 h-8" style="display:none;">
          <i id="weatherIconFallback" class="fas fa-cloud-sun text-yellow-400 text-2xl"></i>
          <span id="sensorCityName">深圳南山区</span>
        </div>
```

- [ ] **Step 2: Update PM2.5 row (line ~231)**

Find:
```html
          <span class="text-green-400 text-xs border border-green-400 px-1 py-0.5 rounded shadow-[0_0_5px_#4ade80]">优</span>
          <span class="font-mono text-lg">12</span> <span class="text-xs text-gray-400">µg/m³ PM2.5</span>
```

Replace with:
```html
          <span id="sensorAqi" class="text-green-400 text-xs border border-green-400 px-1 py-0.5 rounded shadow-[0_0_5px_#4ade80]">优</span>
          <span id="sensorPm25" class="font-mono text-lg">12</span> <span class="text-xs text-gray-400">µg/m³ PM2.5</span>
```

- [ ] **Step 3: Add ID to humidity value (line ~244)**

Find:
```html
          <div class="text-4xl font-bold text-white font-mono tracking-wider absolute top-3 right-3 z-10">45<span class="text-lg text-cyan-500">%</span></div>
```

Replace with:
```html
          <div class="text-4xl font-bold text-white font-mono tracking-wider absolute top-3 right-3 z-10"><span id="sensorHumidity">45</span><span class="text-lg text-cyan-500">%</span></div>
```

- [ ] **Step 4: Update temperature value (line ~239)**

Find:
```html
          <div class="text-4xl font-bold text-white font-mono tracking-wider">21.5<span class="text-lg text-cyan-500">°C</span></div>
```

Replace with:
```html
          <div class="text-4xl font-bold text-white font-mono tracking-wider"><span id="sensorTemp">21.5</span><span class="text-lg text-cyan-500">°C</span></div>
```

- [ ] **Step 5: Update pressure value (line ~253)**

Find:
```html
            <div class="text-3xl font-bold text-white font-mono">720 <span class="text-sm text-cyan-500">hPa</span></div>
```

Replace with:
```html
            <div class="text-3xl font-bold text-white font-mono"><span id="sensorPressure">720</span> <span class="text-sm text-cyan-500">hPa</span></div>
```

- [ ] **Step 7: Replace Altitude block with Wind Speed (lines ~257–260)**

Find:
```html
          <div class="text-right z-10">
            <div class="text-xs text-cyan-300/80 mb-1">海拔 (Altitude)</div>
            <div class="text-3xl font-bold text-white font-mono flex items-center justify-end gap-2">
              <i class="fas fa-arrow-up text-cyan-400 text-sm"></i> 3600<span class="text-sm text-cyan-500">m+</span>
            </div>
          </div>
```

Replace with:
```html
          <div class="text-right z-10">
            <div class="text-xs text-cyan-300/80 mb-1">风速 (Wind Speed)</div>
            <div class="text-3xl font-bold text-white font-mono flex items-center justify-end gap-2">
              <i class="fas fa-wind text-cyan-400 text-sm"></i> <span id="sensorWind">--</span><span class="text-sm text-cyan-500">m/s</span>
            </div>
          </div>
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add IDs to environmental sensor panel DOM nodes"
```

---

## Task 7: Update Route Tracking Map status card

**Files:**
- Modify: `index.html` (lines 336–354)

- [ ] **Step 1: Replace the three status rows and remove story unlock**

Find the entire inner content of the status card (inside the `bg-black/70` div), specifically these three rows:
```html
          <div class="text-sm text-gray-300 flex items-center gap-2 justify-between">
            <span class="flex items-center gap-2"><i class="fas fa-crosshairs text-cyan-400 w-4 text-center"></i> 当前位置</span>
            <span id="currentLocText" class="text-white font-bold bg-cyan-900/30 px-2 py-0.5 rounded">出发点: 深圳</span>
          </div>
          <div class="text-sm text-gray-300 flex items-center gap-2 justify-between">
            <span class="flex items-center gap-2"><i class="fas fa-clock text-cyan-400 w-4 text-center"></i> 存在</span>
            <span class="text-cyan-300 font-mono font-bold text-base">5 <span class="text-xs text-gray-400 font-sans">天 (Days)</span></span>
          </div>
          <div class="text-sm text-gray-300 flex items-center gap-2 justify-between">
            <span class="flex items-center gap-2"><i class="fas fa-book-open text-cyan-400 w-4 text-center"></i> 故事解锁</span>
            <span class="text-yellow-400 font-mono font-bold text-base">12</span>
          </div>
```

Replace with:
```html
          <div class="text-sm text-gray-300 flex items-center gap-2 justify-between">
            <span class="flex items-center gap-2"><i class="fas fa-crosshairs text-cyan-400 w-4 text-center"></i> 当前位置</span>
            <span id="currentLocText" class="text-white font-bold bg-cyan-900/30 px-2 py-0.5 rounded">出发点: 深圳</span>
          </div>
          <div class="text-sm text-gray-300 flex items-center gap-2 justify-between">
            <span class="flex items-center gap-2"><i class="fas fa-map-marker-alt text-cyan-400 w-4 text-center"></i> 在此逗留</span>
            <span class="text-cyan-300 font-mono font-bold text-base"><span id="cityDaysText">0</span> <span class="text-xs text-gray-400 font-sans">天 (Days)</span></span>
          </div>
          <div class="text-sm text-gray-300 flex items-center gap-2 justify-between">
            <span class="flex items-center gap-2"><i class="fas fa-clock text-cyan-400 w-4 text-center"></i> 出发至今</span>
            <span class="text-cyan-300 font-mono font-bold text-base"><span id="totalDaysText">0</span> <span class="text-xs text-gray-400 font-sans">天 (Days)</span></span>
          </div>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: update route tracking status card, remove story unlock"
```

---

## Task 8: Frontend polling & panel update logic

**Files:**
- Modify: `index.html` (inside `<script>` at bottom)

- [ ] **Step 1: Add updateDashboard function and polling to the inline script**

Find the `// Resize handler` block near the bottom of the `<script>` tag. **Before** it, insert:

```js
    // ── 城市天气面板更新 ──────────────────────────────────────────
    const DEPARTURE = new Date('2026-04-22T00:00:00.000Z');

    function daysBetween(from, to) {
      return Math.max(0, Math.floor((to - from) / 86400000));
    }

    const AQI_COLOR = {
      '优': { text: 'text-green-400', border: 'border-green-400', shadow: 'shadow-[0_0_5px_#4ade80]' },
      '良': { text: 'text-green-300', border: 'border-green-300', shadow: 'shadow-[0_0_5px_#86efac]' },
      '轻度': { text: 'text-yellow-400', border: 'border-yellow-400', shadow: 'shadow-[0_0_5px_#facc15]' },
      '中度': { text: 'text-orange-400', border: 'border-orange-400', shadow: 'shadow-[0_0_5px_#fb923c]' },
      '重度': { text: 'text-red-400', border: 'border-red-400', shadow: 'shadow-[0_0_5px_#f87171]' }
    };

    function updateSensorPanel(data) {
      // Weather icon
      const iconEl = document.getElementById('weatherIcon');
      const iconFallback = document.getElementById('weatherIconFallback');
      if (data.weatherIcon) {
        iconEl.src = `https://openweathermap.org/img/wn/${data.weatherIcon}@2x.png`;
        iconEl.style.display = '';
        iconFallback.style.display = 'none';
      }

      // City name
      document.getElementById('sensorCityName').textContent = data.city;

      // PM2.5 & AQI
      document.getElementById('sensorPm25').textContent = Math.round(data.pm25);
      const aqiEl = document.getElementById('sensorAqi');
      aqiEl.textContent = data.aqi;
      const colors = AQI_COLOR[data.aqi] || AQI_COLOR['良'];
      aqiEl.className = `text-xs border px-1 py-0.5 rounded ${colors.text} ${colors.border} ${colors.shadow}`;

      // Temperature
      document.getElementById('sensorTemp').textContent = data.temperature.toFixed(1);

      // Humidity value + gauge update
      document.getElementById('sensorHumidity').textContent = data.humidity;
      const humPct = Math.min(1, data.humidity / 100);
      humChart.setOption({
        series: [{
          axisLine: {
            lineStyle: {
              color: [[humPct, '#06b6d4'], [1, 'rgba(255,255,255,0.1)']]
            }
          }
        }]
      });

      // Pressure
      document.getElementById('sensorPressure').textContent = data.pressure;

      // Wind speed
      document.getElementById('sensorWind').textContent = data.windSpeed.toFixed(1);
    }

    function updateTrackingCard(data) {
      const now = new Date();
      document.getElementById('currentLocText').textContent = data.city;
      document.getElementById('cityDaysText').textContent =
        daysBetween(new Date(data.cityArrivedAt), now);
      document.getElementById('totalDaysText').textContent =
        daysBetween(DEPARTURE, now);
    }

    function applyDashboardData(data) {
      if (!data || data.empty) return;
      updateSensorPanel(data);
      updateTrackingCard(data);
      if (mapAnimator && data.province) {
        mapAnimator.highlightProvince(data.province);
      }
    }

    async function fetchAndApply() {
      try {
        const res = await fetch('/api/data');
        const data = await res.json();
        applyDashboardData(data);
      } catch (e) {
        console.warn('fetchAndApply failed:', e);
      }
    }

    // Initial load + hourly polling
    fetchAndApply();
    setInterval(fetchAndApply, 60 * 60 * 1000);
    // ── END 城市天气 ──────────────────────────────────────────────
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add frontend polling and panel update logic"
```

---

## Task 9: Integration smoke test

- [ ] **Step 1: Start the server**

Run: `node server.js`

Expected output: `Dashboard server running on http://localhost:3000`

- [ ] **Step 2: Open the dashboard**

Open `http://localhost:3000` in a browser. Confirm:
- Dashboard loads normally
- No console errors
- Environmental sensor panel shows hardcoded defaults (since no `data.json` yet)
- Status card shows "在此逗留 0 天" and "出发至今 0 天" (or correct days if after 2026-04-22)

- [ ] **Step 3: Call /api/update to test the full flow**

In a new terminal:

```bash
curl "http://localhost:3000/api/update?city=成都"
```

Expected: JSON response with city, province, temperature, humidity, pressure, windSpeed, pm25, aqi, weatherIcon fields.

- [ ] **Step 4: Verify dashboard updated**

Refresh `http://localhost:3000`. Confirm:
- City name changed to "成都"
- Weather icon appears (replacing the fallback icon)
- Temperature, humidity, pressure, wind speed reflect fetched data
- PM2.5 and AQI badge updated
- Map highlights 四川 province in bright cyan
- Status card shows "成都" as current location

- [ ] **Step 5: Test city change resets counter**

```bash
curl "http://localhost:3000/api/update?city=西安"
```

Refresh dashboard. Confirm:
- City changes to "西安"
- "在此逗留" resets to 0
- Map highlights 陕西 province

- [ ] **Step 6: Run full test suite**

Run: `npx jest --verbose`

Expected: All tests PASS.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete city weather API integration - step 1 done"
```

---

## Test interface for device

调用示例（外部设备每天调用一次）：

```
GET http://your-server-host:3000/api/update?city=成都
```

返回 200 + JSON 即为成功。可用 `curl` 验证：

```bash
curl "http://localhost:3000/api/update?city=拉萨"
```
