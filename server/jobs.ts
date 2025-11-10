/**
 * Background jobs for refreshing news and weather data
 */

import { fetchWorldNews, fetchFootballNews, fetchZurichWeather, fetchLiveMatchesAndFixtures } from './services';
import { updateNewsCache, updateWeatherCache, updateMatchesCache } from './db';

let newsRefreshInterval: NodeJS.Timeout | null = null;
let weatherRefreshInterval: NodeJS.Timeout | null = null;
let matchesRefreshInterval: NodeJS.Timeout | null = null;

/**
 * Start background jobs for refreshing data
 */
export function startBackgroundJobs() {
  console.log('[Jobs] Starting background data refresh jobs...');
  
  // Refresh news every 20 minutes (NewsAPI: 100 req/day = ~4 req/hour max = 2 news types * 3/hour)
  refreshNews();
  newsRefreshInterval = setInterval(refreshNews, 20 * 60 * 1000);
  
  // Refresh weather every 30 minutes (Open-Meteo is generous: 10k/day)
  refreshWeather();
  weatherRefreshInterval = setInterval(refreshWeather, 30 * 60 * 1000);
  
  // Refresh matches every 10 minutes (Football-Data: 10 req/min limit, need spacing)
  refreshMatches();
  matchesRefreshInterval = setInterval(refreshMatches, 10 * 60 * 1000);
}

/**
 * Stop background jobs
 */
export function stopBackgroundJobs() {
  if (newsRefreshInterval) {
    clearInterval(newsRefreshInterval);
    newsRefreshInterval = null;
  }
  if (weatherRefreshInterval) {
    clearInterval(weatherRefreshInterval);
    weatherRefreshInterval = null;
  }
  if (matchesRefreshInterval) {
    clearInterval(matchesRefreshInterval);
    matchesRefreshInterval = null;
  }
  console.log('[Jobs] Background jobs stopped');
}

/**
 * Refresh news data
 */
async function refreshNews() {
  try {
    console.log('[Jobs] Refreshing world news...');
    const worldNews = await fetchWorldNews();
    if (worldNews.length > 0) {
      await updateNewsCache('world', worldNews);
      console.log(`[Jobs] Updated ${worldNews.length} world news articles`);
    }
    
    console.log('[Jobs] Refreshing soccer news (football)...');
    const footballNews = await fetchFootballNews();
    if (footballNews.length > 0) {
      await updateNewsCache('football', footballNews);
      console.log(`[Jobs] Updated ${footballNews.length} soccer news articles`);
    }
  } catch (error) {
    console.error('[Jobs] Error refreshing news:', error);
  }
}

/**
 * Refresh weather data
 */
async function refreshWeather() {
  try {
    console.log('[Jobs] Refreshing Zurich weather...');
    const weather = await fetchZurichWeather();
    if (weather) {
      await updateWeatherCache(weather);
      console.log('[Jobs] Updated Zurich weather data');
    }
  } catch (error) {
    console.error('[Jobs] Error refreshing weather:', error);
  }
}

/**
 * Refresh live matches and upcoming fixtures
 */
async function refreshMatches() {
  try {
    console.log('[Jobs] Refreshing live matches and fixtures...');
    const matches = await fetchLiveMatchesAndFixtures();
    if (matches.length > 0) {
      await updateMatchesCache(matches);
      console.log(`[Jobs] Updated ${matches.length} matches`);
    }
  } catch (error) {
    console.error('[Jobs] Error refreshing matches:', error);
  }
}
