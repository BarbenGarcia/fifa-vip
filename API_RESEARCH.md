# API Research for FIFA VIP Dashboard

## Weather API - Open-Meteo ✅

**Selected: Open-Meteo**

- **URL**: https://open-meteo.com/
- **Type**: Free, open-source weather API
- **Key Features**:
  - No API key required
  - Free for non-commercial use
  - Hourly weather data with high resolution (1-11 km)
  - Historical data (80 years available)
  - Rapid updates (every hour)
  - Supports any location worldwide
  
**For Zurich**:
- Latitude: 47.3769
- Longitude: 8.5472

**API Endpoint Example**:
```
https://api.open-meteo.com/v1/forecast?latitude=47.3769&longitude=8.5472&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,precipitation,weather_code&timezone=Europe/Zurich
```

**Response Includes**:
- Current temperature, weather condition, wind speed, humidity
- Hourly forecasts
- Weather codes (0=Clear, 1=Cloudy, 2=Rainy, etc.)

---

## News API - NewsAPI.org ✅

**Selected: NewsAPI.org**

- **URL**: https://newsapi.org/
- **Type**: REST API for news articles
- **Free Tier**:
  - Free "Developer" plan available
  - No credit card required
  - Covers 150,000+ news sources worldwide
  - Returns JSON with article data
  
**Key Endpoints**:
1. `/v2/top-headlines` - Breaking news and top stories
2. `/v2/everything` - Search all articles

**Query Parameters**:
- `q` - Search keyword (e.g., "football", "FIFA", "World Cup")
- `category` - sports, general, world
- `sortBy` - publishedAt, relevancy, popularity
- `language` - en, es, fr, etc.
- `pageSize` - articles per request (max 100)

**For FIFA VIP Dashboard**:
- World News: `category=general` or broad keywords
- Football/FIFA News: `q=football OR FIFA OR soccer` with `category=sports`

**Response Includes**:
- Article title, description, URL
- Author, publication date
- Image URL
- Source name

---

## Implementation Plan

### Backend (tRPC Procedures)
1. Create `news.getWorldNews()` - fetches general world news
2. Create `news.getFootballNews()` - fetches football/FIFA news
3. Create `weather.getZurichWeather()` - fetches Zurich weather

### Frontend Components
1. Weather widget - displays current conditions and forecast
2. News cards - displays articles with images and links
3. Auto-refresh mechanism - updates every 5-10 minutes for news, 15-30 minutes for weather

### Environment Variables Needed
- `NEWS_API_KEY` - NewsAPI.org API key (free, no key needed but will get one for reliability)

