/**
 * Fetch live matches and upcoming fixtures from Football-Data.org
 * Includes: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League
 */
export async function fetchLiveMatchesAndFixtures() {
  const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY || process.env.VITE_FOOTBALL_DATA_API_KEY;
  
  if (!FOOTBALL_DATA_API_KEY) {
    console.warn('FOOTBALL_DATA_API_KEY not set. Returning mock matches for UI.');

    // Return a small set of mock matches so the UI shows content while no API key is present.
    const now = new Date();
    const addMinutes = (m: number) => new Date(now.getTime() + m * 60000).toISOString();
    const mockMatches = [
      {
        matchId: 'mock-1',
        homeTeam: 'FC Zurich',
        awayTeam: 'Grasshoppers',
        homeScore: null,
        awayScore: null,
        league: 'Swiss Super League',
        leagueCountry: 'Switzerland',
        matchDate: addMinutes(60),
        status: 'scheduled',
        homeTeamLogo: null,
        awayTeamLogo: null,
      },
      {
        matchId: 'mock-2',
        homeTeam: 'Real Madrid',
        awayTeam: 'FC Barcelona',
        homeScore: 2,
        awayScore: 1,
        league: 'La Liga',
        leagueCountry: 'Spain',
        matchDate: addMinutes(-30),
        status: 'live',
        homeTeamLogo: null,
        awayTeamLogo: null,
      },
      {
        matchId: 'mock-3',
        homeTeam: 'Manchester United',
        awayTeam: 'Liverpool',
        homeScore: 1,
        awayScore: 3,
        league: 'Premier League',
        leagueCountry: 'England',
        matchDate: addMinutes(-180),
        status: 'finished',
        homeTeamLogo: null,
        awayTeamLogo: null,
      },
    ];

    return mockMatches;
  }

  try {
    // League codes for Football-Data.org (reduced to 3 to avoid rate limit)
    const leagues = [
      { code: 'PL', name: 'Premier League', country: 'England' },
      { code: 'CL', name: 'Champions League', country: 'Europe' },
      { code: 'LA', name: 'La Liga', country: 'Spain' },
    ];

    const allMatches: any[] = [];

    for (const league of leagues) {
      try {
        const url = `https://api.football-data.org/v4/competitions/${league.code}/matches`;
        const response = await fetch(url, {
          headers: { 'X-Auth-Token': FOOTBALL_DATA_API_KEY },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // Some competitions may be unavailable out of season or on free tier
            console.info(`[Matches] ${league.name} not available (404) — skipping`);
            continue;
          }
          if (response.status === 429) {
            console.info(`[Matches] Rate limited for ${league.name} (429) — will retry on next cycle`);
            continue;
          }
          console.warn(`Failed to fetch ${league.name} matches: ${response.status}`);
          continue;
        }

        const data = await response.json();

        if (data.matches && Array.isArray(data.matches)) {
          const now = new Date();
          
          // Get all matches and sort by date, prioritizing upcoming matches
          const matches = data.matches
            .filter((match: any) => {
              const matchDate = new Date(match.utcDate);
              const sevenDaysAgo = new Date(now);
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              const thirtyDaysFromNow = new Date(now);
              thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
              
              // Include matches from last 7 days and next 30 days (recent + upcoming)
              return matchDate >= sevenDaysAgo && matchDate <= thirtyDaysFromNow;
            })
            .sort((a: any, b: any) => {
              // Sort by status: SCHEDULED > LIVE > FINISHED
              const statusOrder = { 'SCHEDULED': 0, 'LIVE': 1, 'FINISHED': 2 };
              const statusDiff = (statusOrder[a.status as keyof typeof statusOrder] || 3) - (statusOrder[b.status as keyof typeof statusOrder] || 3);
              if (statusDiff !== 0) return statusDiff;
              // Then sort by date
              return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
            })
            .slice(0, 15)
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
        console.error(`Error fetching ${league.name} matches:`, error);
        continue;
      }
      
      // Add 7-second delay between leagues to respect 10 requests/minute rate limit
      await new Promise(resolve => setTimeout(resolve, 7000));
    }

    return allMatches;
  } catch (error) {
    console.error('Failed to fetch match results:', error);
    return [];
  }
}

/**
 * Fetch Zurich weather data from Open-Meteo API
 */
export async function fetchZurichWeather() {
  try {
    const response = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=47.3769&longitude=8.5472&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto'
    );

    if (!response.ok) {
      console.warn('Failed to fetch weather data');
      return null;
    }

    const data = await response.json();
    const current = data.current;

    // Map WMO weather codes to descriptions
    const weatherDescriptions: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Foggy',
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

    return {
      temperature: current.temperature_2m,
      weatherCode: current.weather_code,
      description: weatherDescriptions[current.weather_code] || 'Unknown',
      windSpeed: current.wind_speed_10m,
      humidity: current.relative_humidity_2m,
    };
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return null;
  }
}

/**
 * Fetch next 3 days forecast for Zurich (daily min/max + weather code)
 */
export async function fetchZurichForecast() {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=47.3769&longitude=8.5472&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7';
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('Failed to fetch Zurich forecast');
      return [] as Array<{ date: string; weatherCode: number; tMax: number; tMin: number }>;
    }
    const data = await response.json();
    const daily = data.daily || {};
    const result: Array<{ date: string; weatherCode: number; tMax: number; tMin: number }> = [];
    const len = Math.min(7, (daily.time?.length || 0));
    for (let i = 0; i < len; i++) {
      result.push({
        date: daily.time[i],
        weatherCode: daily.weather_code?.[i] ?? 0,
        tMax: daily.temperature_2m_max?.[i] ?? null,
        tMin: daily.temperature_2m_min?.[i] ?? null,
      });
    }
    return result;
  } catch (error) {
    console.error('Failed to fetch forecast:', error);
    return [];
  }
}


/**
 * Fetch world news from NewsAPI
 */
export async function fetchWorldNews() {
  const NEWS_API_KEY = process.env.NEWS_API_KEY;
  
  if (!NEWS_API_KEY) {
    console.warn('NEWS_API_KEY not set');
    return [];
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&apiKey=${NEWS_API_KEY}`
    );

    if (!response.ok) {
      console.warn('Failed to fetch world news');
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
 * Fetch football/soccer news from NewsAPI
 */
export async function fetchFootballNews() {
  const NEWS_API_KEY = process.env.NEWS_API_KEY;
  
  if (!NEWS_API_KEY) {
    console.warn('NEWS_API_KEY not set');
    return [];
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=soccer OR football OR FIFA OR "Champions League" OR "Premier League" OR "La Liga" OR "Serie A" OR "Bundesliga" OR "Ligue 1"&language=en&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`
    );

    if (!response.ok) {
      console.warn('Failed to fetch football news');
      return [];
    }

    const data = await response.json();
    
    // Filter out American Football articles
    const excludeKeywords = [
      'NFL', 'nfl', 'american football', 'college football', 'Auburn', 'Alabama', 'Texas', 'Oklahoma', 'Georgia', 'Ohio State',
      'Michigan', 'LSU', 'Clemson', 'Notre Dame', 'USC', 'Florida', 'Tennessee', 'Penn State', 'Nebraska', 'Wisconsin',
      'Iowa', 'Minnesota', 'Illinois', 'Indiana', 'Purdue', 'Northwestern', 'Michigan State', 'Ohio', 'Kentucky', 'Vanderbilt',
      'Missouri', 'Texas A&M', 'Arkansas', 'Ole Miss', 'Mississippi State', 'South Carolina', 'Georgia Tech', 'Virginia Tech',
      'Boston College', 'Wake Forest', 'Duke', 'North Carolina', 'Virginia', 'Pitt', 'Syracuse', 'Louisville', 'Rutgers',
      'Maryland', 'Cincinnati', 'Houston', 'SMU', 'TCU', 'Baylor', 'Kansas', 'Kansas State', 'Iowa State', 'West Virginia',
      'BYU', 'Utah', 'Colorado', 'Arizona', 'Arizona State', 'Oregon', 'Washington', 'Stanford', 'Cal', 'UCLA',
      'USC Trojans', 'Broncos', 'Chiefs', 'Raiders', 'Chargers', 'Patriots', 'Bills', 'Dolphins', 'Jets',
      'Ravens', 'Steelers', 'Browns', 'Bengals', 'Titans', 'Colts', 'Jaguars', 'Texans', 'Cowboys', 'Eagles',
      'Washington', 'Giants', 'Panthers', 'Falcons', 'Saints', 'Buccaneers', 'Lions', 'Packers', 'Vikings', 'Bears',
      '49ers', 'Seahawks', 'Cardinals', 'Rams', 'Chargers', 'Broncos', 'Chiefs', 'Raiders', 'Titans', 'Colts',
      'Jaguars', 'Texans', 'Cowboys', 'Eagles', 'Washington', 'Giants', 'Panthers', 'Falcons', 'Saints', 'Buccaneers',
      'Lions', 'Packers', 'Vikings', 'Bears', '49ers', 'Seahawks', 'Cardinals', 'Rams'
    ];

    const filtered = data.articles.filter((article: any) => {
      const title = article.title || '';
      const description = article.description || '';
      const content = `${title} ${description}`.toLowerCase();
      
      return !excludeKeywords.some(keyword => content.includes(keyword.toLowerCase()));
    });

    return filtered;
  } catch (error) {
    console.error('Failed to fetch football news:', error);
    return [];
  }
}

/**
 * Fetch match results (alias for fetchLiveMatchesAndFixtures)
 */
export async function fetchMatchResults() {
  return fetchLiveMatchesAndFixtures();
}
