import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, newsCache, weatherCache, matchesCache, InsertMatchesCache } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// In-memory cache when database is not available
let memoryCache: {
  worldNews: any[];
  footballNews: any[];
  weather: any;
  matches: any[];
} = {
  worldNews: [],
  footballNews: [],
  weather: null,
  matches: [],
};

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL uses onConflictDoUpdate instead of onDuplicateKeyUpdate
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get cached world news articles
 */
export async function getWorldNews(limit = 10) {
  const db = await getDb();
  if (!db) {
    // Return from memory cache
    return memoryCache.worldNews.slice(0, limit);
  }
  
  const result = await db
    .select()
    .from(newsCache)
    .where(eq(newsCache.category, 'world'))
    .orderBy((t) => desc(t.publishedAt))
    .limit(limit);
  
  return result;
}

/**
 * Get cached football/FIFA news articles
 */
export async function getFootballNews(limit = 10) {
  const db = await getDb();
  if (!db) {
    // Return from memory cache
    return memoryCache.footballNews.slice(0, limit);
  }
  
  const result = await db
    .select()
    .from(newsCache)
    .where(eq(newsCache.category, 'football'))
    .orderBy((t) => desc(t.publishedAt))
    .limit(limit);
  
  return result;
}

/**
 * Get cached Zurich weather
 */
export async function getZurichWeather() {
  const db = await getDb();
  if (!db) {
    // Return from memory cache
    return memoryCache.weather;
  }
  
  const result = await db
    .select()
    .from(weatherCache)
    .where(eq(weatherCache.location, 'zurich'))
    .orderBy((t) => desc(t.fetchedAt))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

/**
 * Update cached news articles
 */
export async function updateNewsCache(category: string, articles: any[]) {
  const db = await getDb();
  
  // Store in memory cache regardless of database
  const formattedArticles = articles.map((article, index) => ({
    id: index + 1,
    category,
    title: article.title,
    description: article.description,
    url: article.url,
    imageUrl: article.urlToImage || article.image,
    source: article.source?.name || article.source,
    publishedAt: new Date(article.publishedAt),
    fetchedAt: new Date(),
    createdAt: new Date(),
  }));
  
  if (category === 'world') {
    memoryCache.worldNews = formattedArticles;
  } else if (category === 'football') {
    memoryCache.footballNews = formattedArticles;
  }
  
  if (!db) {
    console.log(`[Memory Cache] Updated ${category} news: ${articles.length} articles`);
    return;
  }
  
  try {
    // Delete old articles for this category
    await db.delete(newsCache).where(eq(newsCache.category, category));
    
    // Insert new articles
    for (const article of formattedArticles) {
      // Remove `id` so DB uses auto-increment primary key
      // (memory cache uses `id` for in-memory lists)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...articleForDb } = article as any;
      await db.insert(newsCache).values(articleForDb);
    }
  } catch (error) {
    console.error('[Database] Failed to update news cache:', error);
  }
}

/**
 * Update cached weather
 */
export async function updateWeatherCache(weatherData: any) {
  const db = await getDb();
  
  // Store in memory cache
  memoryCache.weather = {
    id: 1,
    location: 'zurich',
    temperature: String(weatherData.temperature),
    weatherCode: weatherData.weatherCode,
    windSpeed: String(weatherData.windSpeed),
    humidity: String(weatherData.humidity),
    description: weatherData.description,
    fetchedAt: new Date(),
    createdAt: new Date(),
  };
  
  if (!db) {
    console.log('[Memory Cache] Updated Zurich weather');
    return;
  }
  
  try {
    // Delete old weather for Zurich
    await db.delete(weatherCache).where(eq(weatherCache.location, 'zurich'));
    
    // Insert new weather
    await db.insert(weatherCache).values(memoryCache.weather);
  } catch (error) {
    console.error('[Database] Failed to update weather cache:', error);
  }
}


/**
 * Get cached live matches and upcoming fixtures
 */
export async function getLiveMatches(limit = 20) {
  const db = await getDb();
  if (!db) {
    // Return from memory cache
    return memoryCache.matches.slice(0, limit);
  }
  
  // Sort by date descending to show most recent matches first
  const result = await db
    .select()
    .from(matchesCache)
    .orderBy((t) => desc(t.matchDate))
    .limit(limit);
  
  return result;
}

/**
 * Update cached matches
 */
export async function updateMatchesCache(matches: any[]) {
  const db = await getDb();
  
  // Store in memory cache
  memoryCache.matches = matches.map((match, index) => ({
    id: index + 1,
    matchId: match.matchId,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    league: match.league,
    leagueCountry: match.leagueCountry,
    matchDate: match.matchDate,
    status: match.status,
    homeTeamLogo: match.homeTeamLogo,
    awayTeamLogo: match.awayTeamLogo,
    fetchedAt: new Date(),
    createdAt: new Date(),
  }));
  
  if (!db) {
    console.log(`[Memory Cache] Updated matches: ${matches.length} matches`);
    return;
  }
  
  try {
    // Delete old matches (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Upsert new matches
    for (const match of matches) {
      const values: InsertMatchesCache = {
        matchId: match.matchId,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        league: match.league,
        leagueCountry: match.leagueCountry,
        matchDate: match.matchDate,
        status: match.status,
        homeTeamLogo: match.homeTeamLogo,
        awayTeamLogo: match.awayTeamLogo,
      };
      
      // PostgreSQL uses onConflictDoUpdate
      await db.insert(matchesCache).values(values).onConflictDoUpdate({
        target: matchesCache.matchId,
        set: {
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          status: match.status,
        },
      });
    }
  } catch (error) {
    console.error('[Database] Failed to update matches cache:', error);
  }
}
