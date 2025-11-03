import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, newsCache, weatherCache } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
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
  if (!db) return [];
  
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
  if (!db) return [];
  
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
  if (!db) return null;
  
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
  if (!db) return;
  
  try {
    // Delete old articles for this category
    await db.delete(newsCache).where(eq(newsCache.category, category));
    
    // Insert new articles
    for (const article of articles) {
      await db.insert(newsCache).values({
        category,
        title: article.title,
        description: article.description,
        url: article.url,
        imageUrl: article.urlToImage || article.image,
        source: article.source?.name || article.source,
        publishedAt: new Date(article.publishedAt),
      });
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
  if (!db) return;
  
  try {
    // Delete old weather for Zurich
    await db.delete(weatherCache).where(eq(weatherCache.location, 'zurich'));
    
    // Insert new weather
    await db.insert(weatherCache).values({
      location: 'zurich',
      temperature: weatherData.temperature,
      weatherCode: weatherData.weatherCode,
      windSpeed: weatherData.windSpeed,
      humidity: weatherData.humidity,
      description: weatherData.description,
    });
  } catch (error) {
    console.error('[Database] Failed to update weather cache:', error);
  }
}
