import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// PostgreSQL 연결 풀 생성 (ORM 제거, Raw SQL 사용)
// 성능 최적화: 연결 풀 설정
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" 
    ? { rejectUnauthorized: false } 
    : false,
  // 연결 풀 최적화 설정
  max: 20, // 최대 연결 수 (Vercel Serverless에 적합)
  min: 2,  // 최소 연결 수
  idleTimeoutMillis: 30000, // 30초 동안 사용되지 않은 연결은 종료
  connectionTimeoutMillis: 5000, // 5초 내 연결 실패 시 타임아웃
  // 연결 재시도 설정
  allowExitOnIdle: true, // 유휴 상태에서 프로세스 종료 허용
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

