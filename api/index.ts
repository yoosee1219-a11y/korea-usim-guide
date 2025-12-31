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

    // SPA 라우팅 - API 경로 제외하고 모든 요청을 index.html로
    app.use((req, res, next) => {
      // API 경로는 이미 registerRoutes에서 처리됨
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API endpoint not found' });
      }

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
  await initializeApp();
  return app(req, res);
}

