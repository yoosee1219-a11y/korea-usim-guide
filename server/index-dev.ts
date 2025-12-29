// .env 파일 로드 (가장 먼저 실행되어야 함)
import "dotenv/config";

import fs from "node:fs";
import { type Server } from "node:http";
import path from "node:path";

import type { Express } from "express";
import { nanoid } from "nanoid";
import { createServer as createViteServer, createLogger } from "vite";

import runApp from "./app";

// 필수 환경변수 검증
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const optionalEnvVars = ['GEMINI_API_KEY', 'GOOGLE_TRANSLATE_API_KEY', 'UNSPLASH_ACCESS_KEY'];

const missingRequired = requiredEnvVars.filter(v => !process.env[v]);
const missingOptional = optionalEnvVars.filter(v => !process.env[v]);

if (missingRequired.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  missingRequired.forEach(v => console.error(`   - ${v}`));
  console.error('\nPlease add these to your .env file\n');
  process.exit(1);
}

if (missingOptional.length > 0) {
  console.warn('\n⚠️  Missing optional environment variables:');
  missingOptional.forEach(v => console.warn(`   - ${v}`));
  console.warn('   Some features may not work properly\n');
}

const viteLogger = createLogger();

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    configFile: path.resolve(import.meta.dirname, "..", "vite.config.ts"),
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        // Pre-transform errors are usually transient, don't exit
        if (!msg.includes('Pre-transform error')) {
          viteLogger.error(msg, options);
        } else {
          viteLogger.warn(msg, options);
        }
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Vite 미들웨어: 정적 파일 서빙 (API 라우트 제외)
  app.use((req, res, next) => {
    // API 라우트는 건너뛰기
    if (req.path.startsWith('/api')) {
      return next();
    }
    vite.middlewares(req, res, next);
  });
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

(async () => {
  await runApp(setupVite);
})();
