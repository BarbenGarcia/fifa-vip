/**
 * Fetch live matches and upcoming fixtures from Football-Data.org
 * Includes: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League
 */
export async function fetchLiveMatchesAndFixtures() {
  const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY || process.env.VITE_FOOTBALL_DATA_API_KEY;
  
  if (!FOOTBALL_DATA_API_KEY) {
    console.warn('FOOTBALL_DATA_API_KEY not set. Please add your Football-Data.org token.');
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
      { code: 'CL', name: 'Champions League', country: 'Europe' },
    ];

    const allMatches: any[] = [];

    for (const league of leagues) {
      try {
        const url = `https://api.football-data.org/v4/competitions/${league.code}/matches`;
        const response = await fetch(url, {
          headers: { 'X-Auth-Token': FOOTBALL_DATA_API_KEY },
        });

        if (!response.ok) {
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
              const sixtyDaysAgo = new Date(now);
              sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
              const sixtyDaysFromNow = new Date(now);
              sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
              
              // Include all matches within 60 days (past and future)
              return matchDate >= sixtyDaysAgo && matchDate <= sixtyDaysFromNow;
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
        console.warn(`Error fetching matches:`, error);
        continue;
      }
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
