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
 * Fetch football/FIFA news from NewsAPI (soccer only, excluding American Football)
 */
export async function fetchFootballNews() {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=soccer%20OR%20(football%20AND%20(fifa%20OR%20goal%20OR%20premier%20OR%20champions%20OR%20league))&language=en&sortBy=publishedAt&pageSize=30&apiKey=${NEWS_API_KEY}`
    );
    
    if (!response.ok) {
      console.error('NewsAPI error:', response.statusText);
      return [];
    }
    
    const data = await response.json();
    // Filter out non-soccer articles
    const filtered = (data.articles || []).filter((article: any) => {
      const title = article.title?.toLowerCase() || '';
      const desc = article.description?.toLowerCase() || '';
      const source = article.source?.name?.toLowerCase() || '';
      const content = (title + ' ' + desc + ' ' + source).toLowerCase();
      
      // Exclude non-soccer sports and American football variants
      const excludeKeywords = [
        'nfl', 'american football', 'nfl draft', 'super bowl', 'nfl playoffs',
        'basketball', 'nba', 'baseball', 'mlb', 'hockey', 'nhl',
        'tennis', 'golf', 'cricket', 'rugby', 'nba draft',
        'auburn', 'alabama', 'clemson', 'ohio state', 'college football',
        'ncaa', 'sec football', 'acc football', 'big ten', 'football coach',
        'touchdown', 'nfl season', 'nfl game', 'college sports',
        'georgia football', 'texas football', 'florida football', 'lsu football',
        'michigan football', 'notre dame', 'penn state', 'florida state',
        'athletic director', 'coach hire', 'recruiting', 'transfer portal'
      ];
      
      for (const keyword of excludeKeywords) {
        if (content.includes(keyword)) {
          return false;
        }
      }
      
      // Include only if it has soccer-specific keywords
      const soccerKeywords = ['soccer', 'fifa', 'premier league', 'champions league', 
                              'la liga', 'bundesliga', 'serie a', 'world cup', 'euro',
                              'messi', 'ronaldo', 'haaland', 'neymar', 'vinicius',
                              'manchester united', 'liverpool', 'manchester city', 'arsenal',
                              'real madrid', 'barcelona', 'psg', 'juventus', 'inter milan',
                              'tottenham', 'chelsea', 'aston villa', 'newcastle', 'brighton',
                              'ac milan', 'napoli', 'lazio', 'roma', 'fiorentina',
                              'dortmund', 'hamburg', 'schalke', 'cologne', 'leverkusen',
                              'lyon', 'marseille', 'monaco', 'toulouse', 'lens', 'goal', 'match'];
      
      // Check for soccer keywords
      const hasSoccerKeyword = soccerKeywords.some(keyword => content.includes(keyword));
      
      // If it has soccer keywords, include it
      if (hasSoccerKeyword) {
        return true;
      }
      
      // Otherwise exclude
      return false;
    });
    
    return filtered.slice(0, 10);
  } catch (error) {
    console.error('Failed to fetch football news:', error);
    return [];
  }
}

/**
 * Fetch recent match results from API-Football
 */
export async function fetchMatchResults() {
  try {
    // Using free API-Football endpoint for recent matches
    // This gets the latest matches from major leagues
    const response = await fetch(
      'https://api.api-football.com/v3/fixtures?last=10&league=39&season=2025',
      {
        headers: {
          'x-apisports-key': 'demo' // Using demo key - can be upgraded with paid plan
        }
      }
    );
    
    if (!response.ok) {
      console.error('API-Football error:', response.statusText);
      // Fallback: return empty array if API fails
      return [];
    }
    
    const data = await response.json();
    
    if (!data.response || !Array.isArray(data.response)) {
      return [];
    }
    
    // Transform API response to match results format
    return data.response.map((match: any) => ({
      id: match.fixture.id,
      homeTeam: match.teams.home.name,
      awayTeam: match.teams.away.name,
      homeScore: match.goals.home,
      awayScore: match.goals.away,
      date: match.fixture.date,
      league: match.league.name,
      status: match.fixture.status.short,
      homeTeamLogo: match.teams.home.logo,
      awayTeamLogo: match.teams.away.logo,
    }));
  } catch (error) {
    console.error('Failed to fetch match results:', error);
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
