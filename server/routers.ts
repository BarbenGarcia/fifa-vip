import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getWorldNews, getFootballNews, getZurichWeather, getLiveMatches, getDb } from "./db";
import { fetchMatchResults, fetchZurichForecast } from "./services";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  news: router({
    getWorld: publicProcedure.query(async () => {
      return getWorldNews(10);
    }),
    getFootball: publicProcedure.query(async () => {
      return getFootballNews(10);
    }),
  }),
  weather: router({
    getZurich: publicProcedure.query(async () => {
      return getZurichWeather();
    }),
    getZurichForecast: publicProcedure.query(async () => {
      return fetchZurichForecast();
    }),
  }),
  matches: router({
    getRecent: publicProcedure.query(async () => {
      return fetchMatchResults();
    }),
    getLive: publicProcedure.query(async () => {
      return getLiveMatches(30);
    }),
  }),
  health: router({
    check: publicProcedure.query(async () => {
      const db = await getDb();
      // dbAvailable indicates whether drizzle client was established
      const dbAvailable = !!db;
      // Basic cache stats (lengths)
      const world = await getWorldNews(50);
      const football = await getFootballNews(50);
      const weather = await getZurichWeather();
      const matches = await getLiveMatches(50);
      return {
        db: dbAvailable ? 'online' : 'offline',
        counts: {
          worldNews: world.length,
          footballNews: football.length,
          matches: matches.length,
          weather: weather ? 1 : 0,
        },
        timestamp: new Date().toISOString(),
      } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
