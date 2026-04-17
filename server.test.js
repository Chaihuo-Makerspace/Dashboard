'use strict';

const request = require('supertest');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data.json');

beforeEach(() => {
  if (fs.existsSync(DATA_PATH)) fs.unlinkSync(DATA_PATH);
  jest.resetModules();
});

afterEach(() => {
  if (fs.existsSync(DATA_PATH)) fs.unlinkSync(DATA_PATH);
});

let app;
beforeAll(() => {
  process.env.OPENWEATHER_API_KEY = 'test_key';
  app = require('./server');
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

describe('GET /api/update', () => {
  it('returns 400 when city param is missing', async () => {
    const res = await request(app).get('/api/update');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/城市名/);
  });

  it('returns 400 when city is not in province map', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ([{ lat: 0, lon: 0, name: 'Unknown' }])
    });

    const res = await request(app).get('/api/update?city=不存在城市XYZ');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/未找到/);
  });

  it('fetches weather and writes data.json on valid city', async () => {
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
