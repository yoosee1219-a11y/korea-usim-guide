import { Pool, Client } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Vercel Serverless 환경에 최적화된 연결 관리
// Session Pooler 제한 문제를 해결하기 위해 매 요청마다 새 연결 생성
// 또는 Transaction Pooler 사용 (포트 6543)

// DATABASE_URL이 Transaction Pooler인지 확인 (포트 6543)
const isTransactionPooler = process.env.DATABASE_URL.includes(':6543/');

// Transaction Pooler를 사용하는 경우 연결 풀 사용
// Session Pooler를 사용하는 경우 매 요청마다 새 연결 생성
let pool: Pool | null = null;

if (isTransactionPooler) {
  // Transaction Pooler: 연결 풀 사용 가능 (더 많은 동시 연결 지원)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" 
      ? { rejectUnauthorized: false } 
      : false,
    max: 5, // Transaction Pooler는 더 많은 연결 지원
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 30000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
} else {
  // Session Pooler: 연결 풀 사용하지 않음 (매 요청마다 새 연결)
  console.log('Using Session Pooler - connections will be created per request');
}

// 쿼리 실행 함수 (연결 풀 또는 새 연결 사용)
async function executeQuery<T>(queryFn: (client: Client | Pool) => Promise<T>): Promise<T> {
  if (pool) {
    // Transaction Pooler: 풀 사용
    return await queryFn(pool);
  } else {
    // Session Pooler: 매 요청마다 새 연결 생성 및 즉시 종료
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" 
        ? { rejectUnauthorized: false } 
        : false,
      connectionTimeoutMillis: 30000,
    });

    try {
      await client.connect();
      const result = await queryFn(client);
      return result;
    } finally {
      // 연결 즉시 종료 (연결 누적 방지)
      await client.end().catch(() => {});
    }
  }
}

// 연결 테스트 함수
export async function testConnection(): Promise<boolean> {
  try {
    const result = await executeQuery(async (db) => {
      return await db.query("SELECT NOW()");
    });
    console.log("Database connection successful:", result.rows[0].now);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

// db 객체 (쿼리 실행)
export const db = {
  query: async (text: string, params?: any[]) => {
    return await executeQuery(async (db) => {
      return await db.query(text, params);
    });
  }
};

// 연결 풀 종료 함수 (앱 종료 시 사용)
export async function closeConnection() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

