# Weather Dashboard

A responsive weather dashboard built with React + Vite that integrates with the [Open-Meteo API](https://open-meteo.com) to display real-time and historical weather data.

## Features

### Page 1 — Today (Current Weather)
- Auto-detects location via browser GPS (falls back to IP geolocation instantly)
- Select any past or current date via calendar picker
- Toggle temperature between °C and °F
- Displays individual weather variables:
  - Temperature (Current, Min, Max)
  - Precipitation, Relative Humidity, UV Index
  - Sunrise & Sunset times (IST)
  - Max Wind Speed, Precipitation Probability Max
- Air Quality section: AQI, PM10, PM2.5, CO, NO₂, SO₂
- Hourly charts for the selected date:
  - Temperature, Relative Humidity, Precipitation
  - Visibility, Wind Speed (10m), PM10 & PM2.5 (combined)

### Page 2 — Historical (Up to 2 Years)
- Select a custom date range (max 2 years)
- Charts for daily trends:
  - Temperature (Mean, Max, Min)
  - Sunrise & Sunset
  - Precipitation
  - Max Wind Speed & Dominant Wind Direction
  - PM10 & PM2.5

### Chart Features
- Horizontal scrolling for dense datasets
- Zoom in / Zoom out / Reset controls
- Mobile responsive

## Tech Stack

| Package | Version |
|---------|---------|
| React | 18.3 |
| Vite | 5.4 |
| Tailwind CSS | 3.4 |
| Recharts | 2.12 |
| Axios | 1.6 |
| react-router-dom | 6.26 |
| react-datepicker | 7.5 |
| date-fns | 3.6 |

> No API key required — Open-Meteo is free and open.

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

Open [[weather-dashboard-xi-red.vercel.app](https://vercel.com/oshin-lilanis-projects/weather-dashboard)](https://weather-dashboard-xi-red.vercel.app/) in your browser.

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ChartComponent.jsx   # Reusable scrollable/zoomable chart
│   │   ├── WeatherCard.jsx      # Stat display card
│   │   └── Loader.jsx           # Loading spinner
│   ├── pages/
│   │   ├── CurrentWeather.jsx   # Page 1 — today/single date
│   │   └── Historical.jsx       # Page 2 — date range
│   ├── services/
│   │   └── api.js               # All Open-Meteo API calls + caching
│   ├── App.jsx                  # Routing, GPS, layout
│   └── main.jsx
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## API Sources

| Data | Endpoint |
|------|----------|
| Current & forecast weather | `api.open-meteo.com/v1/forecast` |
| Historical weather | `historical-forecast-api.open-meteo.com/v1/forecast` |
| Air quality | `air-quality-api.open-meteo.com/v1/air-quality` |
| IP geolocation (fallback) | `ipapi.co/json` |

## Performance

- IP geolocation fires immediately on load so the fetch starts before GPS resolves
- GPS runs in parallel with a 5s timeout
- API responses cached in `sessionStorage` for 5 minutes — revisiting the same date is instant
- All API calls run in parallel via `Promise.allSettled`
