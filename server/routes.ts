import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import authRouter from "./routes/auth.js";
import carriersRouter from "./routes/carriers.js";
import plansRouter from "./routes/plans.js";
import tipsRouter from "./routes/tips.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // API 라우트 등록 (모두 /api 접두사 사용)
  app.use("/api/auth", authRouter);
  app.use("/api/carriers", carriersRouter);
  app.use("/api/plans", plansRouter);
  app.use("/api/tips", tipsRouter);

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
