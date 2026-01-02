// Vercel Serverless Function for Express App
// TypeScript 파일로 작성 (Vercel이 자동 컴파일)

// .env 파일 로드
import 'dotenv/config';

// Express 앱과 필요한 모듈 import
import express from 'express';
import { app } from '../server/app.js';
import { registerRoutes } from '../server/routes.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 앱 초기화 플래그
let appInitialized = false;

async function initializeApp() {
  if (appInitialized) return;
  
  // 라우트 등록
  await registerRoutes(app);
  
  // 정적 파일 서빙 (프로덕션 빌드)
  const distPath = path.join(__dirname, '../dist/public');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));

    // SPA 라우팅 - API가 아닌 경로만 index.html로
    app.use((req, res) => {
      // API 경로가 여기까지 왔다면 404 (이미 등록된 라우트에서 처리 안됨)
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API endpoint not found' });
      }

      // SPA 라우팅: 나머지 모든 경로는 index.html 반환
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).json({ message: 'Not found' });
      }
    });
  }
  
  appInitialized = true;
}

// 서버리스 함수 핸들러
export default async function handler(req: any, res: any) {
  // 디버깅: 요청 경로 로깅
  console.log(`[Serverless] ${req.method} ${req.url} (path: ${req.path || 'N/A'})`);

  await initializeApp();
  return app(req, res);
}

