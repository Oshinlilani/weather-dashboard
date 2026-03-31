import { useState, useEffect, useCallback, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { fetchDayWeather } from '../services/api';
import WeatherCard from '../components/WeatherCard';
import ChartComponent from '../components/ChartComponent';
import Loader from '../components/Loader';

function toIST(utcStr) {
  if (!utcStr) return '—';
  const d = new Date(utcStr);
  return d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
}

function fmtHour(isoStr) {
  if (!isoStr) return '';
  return isoStr.slice(11, 16); // HH:MM
}

export default function CurrentWeather({ coords }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tempUnit, setTempUnit] = useState('C');
  // track which coords we last fetched with, so GPS refinement doesn't re-fetch
  const fetchedCoordsRef = useRef(null);

  const toF = (c) => c != null ? +(c * 9 / 5 + 32).toFixed(1) : null;
  const displayTemp = (c) => tempUnit === 'F' ? toF(c) : c;
  const tempSuffix = `°${tempUnit}`;

  const load = useCallback(async (forceCoords) => {
    const activeCoords = forceCoords || coords;
    if (!activeCoords) return;
    setLoading(true);
    setError(null);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const result = await fetchDayWeather(activeCoords.lat, activeCoords.lon, dateStr);
      fetchedCoordsRef.current = activeCoords;
      setData(result);
    } catch (e) {
      setError('Failed to fetch weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [coords, selectedDate]);

  // Fetch when date changes (always)
  useEffect(() => {
    if (!coords) return;
    load();
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch when coords first become available; ignore GPS refinement if data already loaded
  useEffect(() => {
    if (!coords) return;
    if (!fetchedCoordsRef.current) {
      // first time we have coords — fetch
      load(coords);
    }
    // if coords update (GPS refines IP location) but we already have data, skip re-fetch
  }, [coords]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!coords) return (
    <div className="flex items-center justify-center h-64 text-blue-200">
      Waiting for GPS location...
    </div>
  );

  const daily = data?.weather?.daily;
  const current = data?.weather?.current_weather;
  const hourly = data?.weather?.hourly;
  const airCurrent = data?.air?.current;
  const airHourly = data?.air?.hourly;

  // Build hourly chart data
  const hourlyData = hourly?.time?.map((t, i) => ({
    time: fmtHour(t),
    temp: displayTemp(hourly.temperature_2m?.[i]),
    humidity: hourly.relativehumidity_2m?.[i],
    precipitation: hourly.precipitation?.[i],
    visibility: hourly.visibility?.[i] != null ? +(hourly.visibility[i] / 1000).toFixed(2) : null,
    windspeed: hourly.windspeed_10m?.[i],
    pm10: hourly.pm10?.[i] ?? airHourly?.pm10?.[i],
    pm25: hourly.pm2_5?.[i] ?? airHourly?.pm2_5?.[i],
  })) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Date picker + temp toggle */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <label className="text-blue-200 text-xs uppercase tracking-wide">Select Date</label>
          <DatePicker
            selected={selectedDate}
            onChange={setSelectedDate}
            maxDate={new Date()}
            dateFormat="dd MMM yyyy"
            className="bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
            calendarClassName="weather-calendar"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-blue-200 text-xs uppercase tracking-wide">Temperature Unit</label>
          <div className="flex rounded-xl overflow-hidden border border-white/20">
            {['C', 'F'].map(u => (
              <button
                key={u}
                onClick={() => setTempUnit(u)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${tempUnit === u ? 'bg-blue-500 text-white' : 'bg-white/10 text-blue-200 hover:bg-white/20'}`}
              >°{u}</button>
            ))}
          </div>
        </div>
      </div>

      {loading && <Loader />}
      {error && !data && <div className="text-red-400 text-center py-8">{error}</div>}

      {!loading && data && (
        <>
          {/* Current weather cards */}
          <h2 className="text-white font-bold text-lg mb-3">
            Weather for {format(selectedDate, 'dd MMM yyyy')}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            <WeatherCard label="Current Temp" value={displayTemp(current?.temperature)} unit={tempSuffix} icon="🌡️" />
            <WeatherCard label="Max Temp" value={displayTemp(daily?.temperature_2m_max?.[0])} unit={tempSuffix} icon="🔺" />
            <WeatherCard label="Min Temp" value={displayTemp(daily?.temperature_2m_min?.[0])} unit={tempSuffix} icon="🔻" />
            <WeatherCard label="Precipitation" value={daily?.precipitation_sum?.[0]} unit="mm" icon="🌧️" />
            <WeatherCard label="Sunrise" value={toIST(daily?.sunrise?.[0])} icon="🌅" />
            <WeatherCard label="Sunset" value={toIST(daily?.sunset?.[0])} icon="🌇" />
            <WeatherCard label="Max Wind Speed" value={daily?.windspeed_10m_max?.[0]} unit="km/h" icon="💨" />
            <WeatherCard label="UV Index" value={daily?.uv_index_max?.[0]} icon="☀️" />
            <WeatherCard label="Precip. Prob. Max" value={daily?.precipitation_probability_max?.[0]} unit="%" icon="🌦️" />
            <WeatherCard label="Relative Humidity" value={hourly?.relativehumidity_2m?.[new Date().getHours()] ?? hourly?.relativehumidity_2m?.[0]} unit="%" icon="💧" />
          </div>

          {/* Air Quality */}
          <h2 className="text-white font-bold text-lg mb-3">Air Quality</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            <WeatherCard label="AQI (European)" value={airCurrent?.european_aqi} icon="🌫️" />
            <WeatherCard label="PM10" value={airCurrent?.pm10} unit="μg/m³" icon="🔵" />
            <WeatherCard label="PM2.5" value={airCurrent?.pm2_5} unit="μg/m³" icon="🟣" />
            <WeatherCard label="Carbon Monoxide" value={airCurrent?.carbon_monoxide} unit="μg/m³" icon="⚫" />
            <WeatherCard label="Carbon Dioxide" value="—" unit="ppm" icon="🟤" />
            <WeatherCard label="Nitrogen Dioxide" value={airCurrent?.nitrogen_dioxide} unit="μg/m³" icon="🟡" />
            <WeatherCard label="Sulphur Dioxide" value={airCurrent?.sulphur_dioxide} unit="μg/m³" icon="🟠" />
          </div>

          {/* Hourly Charts */}
          <h2 className="text-white font-bold text-lg mb-3">Hourly Data</h2>
          <ChartComponent
            title={`Temperature (${tempSuffix})`}
            data={hourlyData}
            keys={[{ key: 'temp', name: `Temp ${tempSuffix}`, color: '#f87171' }]}
            xKey="time"
            type="line"
            unit={tempSuffix}
          />
          <ChartComponent
            title="Relative Humidity (%)"
            data={hourlyData}
            keys={[{ key: 'humidity', name: 'Humidity %', color: '#60a5fa' }]}
            xKey="time"
            type="line"
            unit="%"
          />
          <ChartComponent
            title="Precipitation (mm)"
            data={hourlyData}
            keys={[{ key: 'precipitation', name: 'Precipitation mm', color: '#34d399' }]}
            xKey="time"
            type="bar"
            unit="mm"
          />
          <ChartComponent
            title="Visibility (km)"
            data={hourlyData}
            keys={[{ key: 'visibility', name: 'Visibility km', color: '#fbbf24' }]}
            xKey="time"
            type="line"
            unit="km"
          />
          <ChartComponent
            title="Wind Speed 10m (km/h)"
            data={hourlyData}
            keys={[{ key: 'windspeed', name: 'Wind Speed km/h', color: '#a78bfa' }]}
            xKey="time"
            type="line"
            unit="km/h"
          />
          <ChartComponent
            title="PM10 & PM2.5 (μg/m³)"
            data={hourlyData}
            keys={[
              { key: 'pm10', name: 'PM10', color: '#f97316' },
              { key: 'pm25', name: 'PM2.5', color: '#ec4899' },
            ]}
            xKey="time"
            type="line"
            unit="μg/m³"
          />
        </>
      )}
    </div>
  );
}
