import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(async () => {
  // 기본 플러그인 배열
  const plugins: any[] = [react(), tailwindcss()];

  // Replit 환경에서만 runtimeErrorOverlay 플러그인 추가
  // 프로덕션 빌드나 Vercel 환경에서는 제외
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID) {
    try {
      const runtimeErrorOverlay = await import("@replit/vite-plugin-runtime-error-modal");
      plugins.splice(1, 0, runtimeErrorOverlay.default());
    } catch (error) {
      // 패키지가 없거나 로드 실패 시 무시 (Vercel 빌드 환경 등)
      // 에러를 출력하지 않음 (정상적인 상황)
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    css: {
      postcss: {
        plugins: [],
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
