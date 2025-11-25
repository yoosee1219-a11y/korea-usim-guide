import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// PostgreSQL 연결 풀 생성 (ORM 제거, Raw SQL 사용)
// 성능 최적화: 연결 풀 설정 (Vercel Serverless 환경 고려)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" 
    ? { rejectUnauthorized: false } 
    : false,
  // Vercel Serverless 환경에 최적화된 설정
  max: 10, // 최대 연결 수 (Serverless에 적합)
  // min은 Serverless에서 제거 (요청마다 새 인스턴스 생성 가능)
  idleTimeoutMillis: 30000, // 30초 동안 사용되지 않은 연결은 종료
  connectionTimeoutMillis: 10000, // 10초 내 연결 실패 시 타임아웃 (여유 있게)
  // allowExitOnIdle은 Serverless에서 제거 (문제 발생 가능)
});

// 연결 테스트 함수
export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Database connection successful:", result.rows[0].now);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

// pg.Pool export (Raw SQL 사용)
export const db = pool;

// 연결 풀 종료 함수 (앱 종료 시 사용)
export async function closeConnection() {
  await pool.end();
}

