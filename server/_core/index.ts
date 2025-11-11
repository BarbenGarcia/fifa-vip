import "dotenv/config";
import dns from "node:dns";
import express from "express";
import { createServer } from "http";
import net from "net";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startBackgroundJobs, stopBackgroundJobs } from "../jobs";

// Prefer IPv4 when resolving hostnames (helps when IPv6 isn't routed)
try {
  // Node 18+ supports this API
  dns.setDefaultResultOrder("ipv4first");
} catch {}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // CORS: allow Firebase-hosted frontend to call this backend on Render
  if (process.env.NODE_ENV === "development") {
    app.use(cors({ origin: true, credentials: true }));
  } else {
    const allowed = (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    const useCredentials = allowed.length > 0;
    const corsOptions: cors.CorsOptions = {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (!useCredentials) return callback(null, true);
        const ok = allowed.some(a => origin === a);
        return callback(ok ? null : new Error("Not allowed by CORS"), ok);
      },
      credentials: useCredentials,
    };
    app.use(cors(corsOptions));
    app.options("*", cors(corsOptions));
  }
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Simple health endpoint for load balancers and Firebase-hosted frontend
  app.get('/api/health', async (_req, res) => {
    try {
      // lazy import to avoid circulars
      const { getDb } = await import('../db');
      const db = await getDb();
      const dbStatus = db ? 'online' : 'offline';
      res.json({ status: 'ok', db: dbStatus, timestamp: new Date().toISOString() });
    } catch (e) {
      res.status(500).json({ status: 'error', error: String(e) });
    }
  });
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    startBackgroundJobs();
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    stopBackgroundJobs();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    stopBackgroundJobs();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

startServer().catch(console.error);
