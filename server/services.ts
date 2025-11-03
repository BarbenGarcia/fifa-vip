/**
 * External API services for fetching news and weather data
 */

const NEWS_API_KEY = process.env.NEWS_API_KEY || 'demo';
const ZURICH_LAT = 47.3769;
const ZURICH_LON = 8.5472;

/**
 * Fetch world news from NewsAPI
 */
export async function fetchWorldNews() {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?category=general&language=en&pageSize=10&apiKey=${NEWS_API_KEY}`
    );
    
    if (!response.ok) {
      console.error('NewsAPI error:', response.statusText);
      return [];
    }
    
    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error('Failed to fetch world news:', error);
    return [];
  }
}

/**
 * Fetch football/FIFA news from NewsAPI
 */
export async function fetchFootballNews() {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=football%20OR%20FIFA%20OR%20soccer&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`
    );
    
    if (!response.ok) {
      console.error('NewsAPI error:', response.statusText);
      return [];
    }
    
    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error('Failed to fetch football news:', error);
    return [];
  }
}

/**
 * Fetch weather for Zurich from Open-Meteo
 */
export async function fetchZurichWeather() {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${ZURICH_LAT}&longitude=${ZURICH_LON}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=Europe/Zurich`
    );
    
    if (!response.ok) {
      console.error('Open-Meteo error:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    const current = data.current;
    
    return {
      temperature: current.temperature_2m,
      weatherCode: current.weather_code,
      windSpeed: current.wind_speed_10m,
      humidity: current.relative_humidity_2m,
      description: getWeatherDescription(current.weather_code),
    };
  } catch (error) {
    console.error('Failed to fetch Zurich weather:', error);
    return null;
  }
}

/**
 * Convert WMO weather code to human-readable description
 */
function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  
  return descriptions[code] || 'Unknown';
}
