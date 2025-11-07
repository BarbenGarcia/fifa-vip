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
      `https://newsapi.org/v2/everything?q=FIFA%20OR%20world%20cup%20OR%20euro%20OR%20copa%20america%20OR%20international%20football%20OR%20national%20team%20OR%20UEFA%20OR%20CONMEBOL%20OR%20CAF%20OR%20qualifying%20OR%20nations%20league&language=en&sortBy=publishedAt&pageSize=50&apiKey=${NEWS_API_KEY}`
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
      
      // Include if it mentions soccer/football keywords
      const hasSoccerKeywords = /soccer|football|champions league|premier league|la liga|serie a|bundesliga|ligue 1|world cup|euro|copa america|fifa|uefa|conmebol|caf|international football|national team|nations league/i.test(title + ' ' + desc);
      
      // Exclude if it mentions American football
      const hasAmericanFootballKeywords = /nfl|american football|college football|auburn|alabama|clemson|ohio state|texas|georgia|michigan|lsu|oklahoma|notre dame|ncaa|super bowl|nfl draft|quarterback|nfl team|football coach|football game|football season|football player|football league|football championship/i.test(title + ' ' + desc);
      
      return hasSoccerKeywords && !hasAmericanFootballKeywords;
    });
    
    return filtered.slice(0, 15);
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

/**
 * Fetch live matches and upcoming fixtures from Football-Data.org
 * Includes: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League
 */
export async function fetchLiveMatchesAndFixtures() {
  const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
  
  if (!FOOTBALL_DATA_API_KEY) {
    console.warn('FOOTBALL_DATA_API_KEY not set');
    return [];
  }

  try {
    // League codes for Football-Data.org
    const leagues = [
      { code: 'PL', name: 'Premier League', country: 'England' },
      { code: 'LA', name: 'La Liga', country: 'Spain' },
      { code: 'SA', name: 'Serie A', country: 'Italy' },
      { code: 'BL1', name: 'Bundesliga', country: 'Germany' },
      { code: 'FL1', name: 'Ligue 1', country: 'France' },
      { code: 'CL', name: 'Champions League', country: 'International' }
    ];

    const allMatches: any[] = [];

    // Fetch matches for each league
    for (const league of leagues) {
      try {
        // Get matches from Football-Data.org
        const response = await fetch(
          `https://api.football-data.org/v4/competitions/${league.code}/matches?status=LIVE,SCHEDULED,FINISHED`,
          {
            headers: {
              'X-Auth-Token': FOOTBALL_DATA_API_KEY
            }
          }
        );

        if (!response.ok) {
          console.warn(`Failed to fetch ${league.name} matches:`, response.statusText);
          continue;
        }

        const data = await response.json();

        if (data.matches && Array.isArray(data.matches)) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const matches = data.matches
            .filter((match: any) => {
              const matchDate = new Date(match.utcDate);
              
              // Include live matches
              if (match.status === 'LIVE') return true;
              
              // Include scheduled matches within next 30 days
              if (match.status === 'SCHEDULED') {
                const thirtyDaysFromNow = new Date(today);
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                return matchDate >= today && matchDate <= thirtyDaysFromNow;
              }
              
              // Include finished matches from last 7 days
              if (match.status === 'FINISHED') {
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return matchDate >= sevenDaysAgo && matchDate <= today;
              }
              
              return false;
            })
            .sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
            .slice(0, 10)
            .map((match: any) => ({
              matchId: `${match.id}`,
              homeTeam: match.homeTeam.name,
              awayTeam: match.awayTeam.name,
              homeScore: match.score.fullTime.home,
              awayScore: match.score.fullTime.away,
              league: league.name,
              leagueCountry: league.country,
              matchDate: new Date(match.utcDate),
              status: match.status === 'LIVE' ? 'live' : 
                     match.status === 'SCHEDULED' ? 'scheduled' : 'finished',
              homeTeamLogo: match.homeTeam.crest || null,
              awayTeamLogo: match.awayTeam.crest || null,
            }));

          allMatches.push(...matches);
        }
      } catch (error) {
        console.warn(`Error fetching ${league.name}:`, error);
        continue;
      }
    }

    return allMatches;
  } catch (error) {
    console.error('Failed to fetch live matches and fixtures:', error);
    return [];
  }
}
