import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Cache for news articles to reduce API calls
 */
export const newsCache = mysqlTable("newsCache", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 50 }).notNull(), // 'world' or 'football'
  title: text("title").notNull(),
  description: text("description"),
  url: varchar("url", { length: 512 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 512 }),
  source: varchar("source", { length: 255 }),
  publishedAt: timestamp("publishedAt"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NewsCache = typeof newsCache.$inferSelect;
export type InsertNewsCache = typeof newsCache.$inferInsert;

/**
 * Cache for weather data
 */
export const weatherCache = mysqlTable("weatherCache", {
  id: int("id").autoincrement().primaryKey(),
  location: varchar("location", { length: 100 }).notNull(), // 'zurich'
  temperature: varchar("temperature", { length: 50 }),
  weatherCode: int("weatherCode"),
  windSpeed: varchar("windSpeed", { length: 50 }),
  humidity: varchar("humidity", { length: 50 }),
  description: varchar("description", { length: 255 }),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeatherCache = typeof weatherCache.$inferSelect;
export type InsertWeatherCache = typeof weatherCache.$inferInsert;