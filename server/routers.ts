import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getWorldNews, getFootballNews, getZurichWeather } from "./db";

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
  }),
});

export type AppRouter = typeof appRouter;
