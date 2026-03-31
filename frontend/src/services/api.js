import axios from 'axios';

const WEATHER_BASE = 'https://api.open-meteo.com/v1';
const AIR_BASE = 'https://air-quality-api.open-meteo.com/v1';
const HIST_BASE = 'https://historical-forecast-api.open-meteo.com/v1';

function cacheKey(...args) {
  return 'wx_' + args.join('_');
}
function fromCache(key) {
  try {
    const item = sessionStorage.getItem(key);
    if (!item) return null;
    const { ts, data } = JSON.parse(item);
    if (Date.now() - ts < 5 * 60 * 1000) return data; // 5 min TTL
    sessionStorage.removeItem(key);
  } catch { /* ignore */ }
  return null;
}
function toCache(key, data) {
  try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch { /* ignore */ }
}

// Fetch current + hourly weather for a single date
export async function fetchDayWeather(lat, lon, date) {
  const key = cacheKey('day', lat.toFixed(2), lon.toFixed(2), date);
  const cached = fromCache(key);
  if (cached) return cached;
  const dateStr = date;
  const today = new Date().toISOString().slice(0, 10);
  const isArchive = dateStr < today;
  const weatherEndpoint = isArchive ? `${WEATHER_BASE}/archive` : `${WEATHER_BASE}/forecast`;

  const dailyParams = [
    'temperature_2m_max', 'temperature_2m_min',
    'precipitation_sum', 'sunrise', 'sunset',
    'windspeed_10m_max', 'uv_index_max',
    'precipitation_probability_max',
  ];
  const archiveDailyParams = [
    'temperature_2m_max', 'temperature_2m_min',
    'precipitation_sum', 'sunrise', 'sunset',
    'windspeed_10m_max',
  ];

  // archive doesn't support pm10/pm2_5 in hourly or current_weather
  const hourlyParams = isArchive
    ? ['temperature_2m', 'relativehumidity_2m', 'precipitation', 'visibility', 'windspeed_10m']
    : ['temperature_2m', 'relativehumidity_2m', 'precipitation', 'visibility', 'windspeed_10m', 'pm10', 'pm2_5'];

  const weatherParams = {
    latitude: lat,
    longitude: lon,
    daily: (isArchive ? archiveDailyParams : dailyParams).join(','),
    hourly: hourlyParams.join(','),
    timezone: 'auto',
    start_date: dateStr,
    end_date: dateStr,
  };
  if (!isArchive) weatherParams.current_weather = true;

  const airParams = {
    latitude: lat,
    longitude: lon,
    hourly: ['pm10', 'pm2_5', 'carbon_monoxide', 'nitrogen_dioxide', 'sulphur_dioxide', 'european_aqi'].join(','),
    timezone: 'auto',
    start_date: dateStr,
    end_date: dateStr,
  };
  if (!isArchive) {
    airParams.current = ['pm10', 'pm2_5', 'carbon_monoxide', 'nitrogen_dioxide', 'sulphur_dioxide', 'european_aqi'].join(',');
  }

  const [weatherRes, airRes] = await Promise.allSettled([
    axios.get(weatherEndpoint, { params: weatherParams }),
    axios.get(`${AIR_BASE}/air-quality`, { params: airParams }),
  ]);

  if (weatherRes.status === 'rejected') throw weatherRes.reason;

  const result = {
    weather: weatherRes.value.data,
    air: airRes.status === 'fulfilled' ? airRes.value.data : { hourly: {}, current: {} },
  };
  toCache(key, result);
  return result;
}

// Fetch historical data for a date range (max 2 years)
// Uses the historical-forecast API which covers past + recent dates seamlessly
export async function fetchHistoricalWeather(lat, lon, startDate, endDate) {
  const key = cacheKey('hist', lat.toFixed(2), lon.toFixed(2), startDate, endDate);
  const cached = fromCache(key);
  if (cached) return cached;

  const dailyParams = [
    'temperature_2m_mean', 'temperature_2m_max', 'temperature_2m_min',
    'sunrise', 'sunset', 'precipitation_sum',
    'windspeed_10m_max', 'winddirection_10m_dominant',
  ].join(',');

  const [weatherRes, airRes] = await Promise.allSettled([
    axios.get(`${HIST_BASE}/forecast`, {
      params: {
        latitude: lat,
        longitude: lon,
        daily: dailyParams,
        timezone: 'auto',
        start_date: startDate,
        end_date: endDate,
      },
    }),
    axios.get(`${AIR_BASE}/air-quality`, {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: ['pm10', 'pm2_5'].join(','),
        timezone: 'auto',
        start_date: startDate,
        end_date: endDate,
      },
    }),
  ]);

  if (weatherRes.status === 'rejected') throw weatherRes.reason;

  const result = {
    weather: { daily: weatherRes.value.data.daily },
    air: airRes.status === 'fulfilled' ? airRes.value.data : { hourly: {} },
  };
  toCache(key, result);
  return result;
}
