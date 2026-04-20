'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_PATH = path.join(__dirname, 'data.json');
const CITY_PROVINCE_PATH = path.join(__dirname, 'city-province.json');

const AQI_LABELS = { 1: '优', 2: '良', 3: '轻度', 4: '中度', 5: '重度' };

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

  const API_KEY = '7fa904ddcca965c7c641d02ac563da75';

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

const PORT = 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Dashboard server running on http://localhost:${PORT}`));
}

module.exports = app;
