# Horse Overlay Animation Design

**Goal:** 在中国地图上叠加一个马奔腾形状的金色轮廓，金色粒子沿轮廓顺时针缓慢流动，随地图缩放/平移同步更新。

**Architecture:** Canvas overlay 绑定 ECharts `georoam` 事件实现缩放跟随，`convertToPixel('geo', ...)` 将经纬度实时换算为屏幕像素坐标，`requestAnimationFrame` 驱动粒子动画。

---

## 马形坐标设计

马面朝西（左），头在新疆东部，尾在东北，蹄在华南。

| 部位 | 地理位置 | 坐标范围 |
|------|---------|---------|
| 鼻尖 | 新疆东部 | ~83°E, 42°N |
| 两耳 | 新疆北部 | ~84-88°E, 47-49°N |
| 背脊 | 内蒙古横向延伸 | ~89-121°E, 43-44°N |
| 马尾 | 东北（大庆方向弧起） | ~126-130°E, 46-50°N |
| 后腿（两条） | 山东/江苏 → 广东 | ~113-120°E, 22-38°N |
| 腹部底线 | 华南横向 | ~92-114°E, 22-30°N |
| 前腿（两条，奔腾） | 四川/云南 → 西藏方向 | ~89-105°E, 22-35°N |
| 胸/颈前侧 | 甘肃/青海 | ~84-88°E, 35-42°N |

顺时针路径从鼻尖出发：鼻 → 下颌 → 胸 → 前腿（向西南） → 腹部 → 后腿（向东南） → 臀 → 马尾 → 背脊（向西）→ 颈顶 → 双耳 → 额头 → 回到鼻尖。

约 55-60 个锚点，整体呈奔腾姿态。

---

## 缩放跟随

在 `ensureChinaMapLoaded().then(...)` 中添加：
```javascript
mapChart.on('georoam', () => horseAnimator.computePixelPath());
```

`computePixelPath()` 调用 `chart.convertToPixel('geo', [lng, lat])`，该方法自动使用当前地图的缩放/平移状态，因此无需额外处理。

---

## Canvas 尺寸 Bug 修复

`syncHorseCanvas` 中将：
```javascript
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
```
改为：
```javascript
ctx.resetTransform();
ctx.scale(dpr, dpr);
```
防止多次 resize 后 scale 累积导致坐标偏移。

---

## 粒子系统

| 参数 | 当前值 | 新值 |
|-----|-------|-----|
| SPEED | 0.10 | 0.04 |
| PARTICLE_COUNT | 12 | 12 |
| TRAIL_STEPS | 5 | 5 |
| TRAIL_SPACING | 0.012 | 0.012 |

一圈约 25 秒，顺时针流动，金色发光拖尾效果保留。

---

## 文件改动

- **修改** `horse-animator.js`：更新 `HORSE_PATH` 坐标（55-60点）、`SPEED = 0.04`、修复 `resetTransform`
- **修改** `index.html`：在 map 初始化回调中添加 `georoam` 监听

---

## 验证

1. `node server.js` 启动服务
2. 浏览器打开 `http://localhost:3000`
3. 确认马形轮廓金色线条覆盖在中国地图上，形似奔腾马
4. 滚轮缩放地图 → 马形同步缩放，不偏移
5. 拖拽平移地图 → 马形同步移动
6. 粒子顺时针流动，约 25 秒一圈
7. DevTools Console 无报错
