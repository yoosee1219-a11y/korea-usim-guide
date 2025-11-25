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
  // 중요: Supabase Session Pooler는 제한된 연결 수를 가지므로, 
  // Serverless에서는 각 인스턴스마다 1개 연결만 사용
  max: 1, // 최대 연결 수를 1로 제한 (Session Pooler 제한 회피)
  // min은 Serverless에서 제거 (요청마다 새 인스턴스 생성 가능)
  idleTimeoutMillis: 10000, // 10초로 단축 (빠른 연결 해제)
  connectionTimeoutMillis: 30000, // 30초
  // 연결 유지 설정
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// 연결 풀 이벤트 핸들러 (에러 추적)
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('Database connection established');
});

pool.on('remove', () => {
  console.log('Database connection removed from pool');
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

