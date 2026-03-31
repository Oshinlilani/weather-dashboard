import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, subYears } from 'date-fns';
import { fetchHistoricalWeather } from '../services/api';
import ChartComponent from '../components/ChartComponent';
import Loader from '../components/Loader';

function toIST(utcStr) {
  if (!utcStr) return null;
  const d = new Date(utcStr);
  // Return minutes since midnight for chart plotting
  const ist = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return ist.getHours() * 60 + ist.getMinutes();
}

function toISTLabel(utcStr) {
  if (!utcStr) return '—';
  const d = new Date(utcStr);
  return d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
}

export default function Historical({ coords }) {
  const today = new Date();
  const [startDate, setStartDate] = useState(subYears(today, 1));
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const maxStart = subYears(endDate, 2);

  async function handleFetch() {
    if (!coords) return;
    setLoading(true);
    setError(null);
    try {
      const s = format(startDate, 'yyyy-MM-dd');
      const e = format(endDate, 'yyyy-MM-dd');
      const result = await fetchHistoricalWeather(coords.lat, coords.lon, s, e);
      setData(result);
    } catch (err) {
      console.error('Historical fetch error:', err?.response?.data || err.message);
      setError(`Failed to fetch historical data: ${err?.response?.data?.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const daily = data?.weather?.daily;
  const airHourly = data?.air?.hourly;

  // Build daily chart data
  const dailyData = daily?.time?.map((t, i) => ({
    date: t,
    tempMean: daily.temperature_2m_mean?.[i],
    tempMax: daily.temperature_2m_max?.[i],
    tempMin: daily.temperature_2m_min?.[i],
    sunrise: toIST(daily.sunrise?.[i]),
    sunset: toIST(daily.sunset?.[i]),
    sunriseLabel: toISTLabel(daily.sunrise?.[i]),
    sunsetLabel: toISTLabel(daily.sunset?.[i]),
    precipitation: daily.precipitation_sum?.[i],
    windMax: daily.windspeed_10m_max?.[i],
    windDir: daily.winddirection_10m_dominant?.[i],
  })) || [];

  // Aggregate hourly air quality to daily averages
  const airDailyMap = {};
  airHourly?.time?.forEach((t, i) => {
    const day = t.slice(0, 10);
    if (!airDailyMap[day]) airDailyMap[day] = { pm10: [], pm25: [] };
    if (airHourly.pm10?.[i] != null) airDailyMap[day].pm10.push(airHourly.pm10[i]);
    if (airHourly.pm2_5?.[i] != null) airDailyMap[day].pm25.push(airHourly.pm2_5[i]);
  });

  const airData = Object.entries(airDailyMap).map(([date, v]) => ({
    date,
    pm10: v.pm10.length ? +(v.pm10.reduce((a, b) => a + b, 0) / v.pm10.length).toFixed(1) : null,
    pm25: v.pm25.length ? +(v.pm25.reduce((a, b) => a + b, 0) / v.pm25.length).toFixed(1) : null,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-white font-bold text-xl mb-4">Historical Weather (up to 2 years)</h2>

      {/* Date range picker */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-blue-200 text-xs uppercase tracking-wide">Start Date</label>
          <DatePicker
            selected={startDate}
            onChange={setStartDate}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            minDate={maxStart}
            maxDate={endDate}
            dateFormat="dd MMM yyyy"
            className="bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-blue-200 text-xs uppercase tracking-wide">End Date</label>
          <DatePicker
            selected={endDate}
            onChange={setEndDate}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            maxDate={today}
            dateFormat="dd MMM yyyy"
            className="bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          onClick={handleFetch}
          disabled={!coords || loading}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-colors"
        >
          {loading ? 'Loading...' : 'Fetch Data'}
        </button>
      </div>

      {!coords && <div className="text-blue-200 text-center py-8">Waiting for GPS location...</div>}
      {loading && <Loader />}
      {error && <div className="text-red-400 text-center py-8">{error}</div>}

      {!loading && data && dailyData.length > 0 && (
        <>
          <ChartComponent
            title="Temperature — Mean, Max & Min (°C)"
            data={dailyData}
            keys={[
              { key: 'tempMean', name: 'Mean °C', color: '#fbbf24' },
              { key: 'tempMax', name: 'Max °C', color: '#f87171' },
              { key: 'tempMin', name: 'Min °C', color: '#60a5fa' },
            ]}
            xKey="date"
            type="line"
            unit="°C"
          />
          <ChartComponent
            title="Sunrise & Sunset (minutes since midnight IST)"
            data={dailyData}
            keys={[
              { key: 'sunrise', name: 'Sunrise (min)', color: '#fbbf24' },
              { key: 'sunset', name: 'Sunset (min)', color: '#f97316' },
            ]}
            xKey="date"
            type="line"
            unit="min"
          />
          <ChartComponent
            title="Precipitation Sum (mm)"
            data={dailyData}
            keys={[{ key: 'precipitation', name: 'Precipitation mm', color: '#34d399' }]}
            xKey="date"
            type="bar"
            unit="mm"
          />
          <ChartComponent
            title="Max Wind Speed (km/h)"
            data={dailyData}
            keys={[{ key: 'windMax', name: 'Max Wind km/h', color: '#a78bfa' }]}
            xKey="date"
            type="line"
            unit="km/h"
          />
          <ChartComponent
            title="Dominant Wind Direction (°)"
            data={dailyData}
            keys={[{ key: 'windDir', name: 'Wind Direction °', color: '#38bdf8' }]}
            xKey="date"
            type="bar"
            unit="°"
          />
          {airData.length > 0 && (
            <ChartComponent
              title="PM10 & PM2.5 Daily Average (μg/m³)"
              data={airData}
              keys={[
                { key: 'pm10', name: 'PM10', color: '#f97316' },
                { key: 'pm25', name: 'PM2.5', color: '#ec4899' },
              ]}
              xKey="date"
              type="line"
              unit="μg/m³"
            />
          )}
        </>
      )}
    </div>
  );
}
