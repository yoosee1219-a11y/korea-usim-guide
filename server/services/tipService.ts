import { db } from "../storage/db.js";

// 쿼리 재시도 헬퍼 함수
async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // 연결 타임아웃 에러인 경우에만 재시도
      if (
        lastError.message.includes('timeout') ||
        lastError.message.includes('Connection terminated') ||
        lastError.message.includes('ECONNRESET')
      ) {
        if (i < maxRetries - 1) {
          console.log(`Query failed, retrying... (${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
          continue;
        }
      }
      
      // 재시도 불가능한 에러는 즉시 throw
      throw error;
    }
  }
  
  throw lastError || new Error('Query failed after retries');
}

export interface Tip {
  id: string;
  category_id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  published_at: Date | null;
  is_published: boolean;
  view_count: number;
  seo_meta: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  } | null;
  created_at: Date;
  updated_at: Date;
  category_name?: string;
}

export interface TipFilters {
  category_id?: string;
  page?: number;
  limit?: number;
  is_published?: boolean;
}

export interface TipCategory {
  id: string;
  name: string;
  created_at: Date;
}

// 꿀팁 카테고리 목록 조회
export async function getTipCategories(): Promise<TipCategory[]> {
  const query = `
    SELECT 
      id,
      name,
      created_at
    FROM tip_categories
    ORDER BY id
  `;

  try {
    return await queryWithRetry(async () => {
      const result = await db.query(query);
      return result.rows;
    });
  } catch (error) {
    console.error("Database query error in getTipCategories:", error);
    console.error("Query:", query);
    throw error;
  }
}

// 꿀팁 목록 조회 (페이지네이션 지원)
export async function getTips(filters: TipFilters = {}): Promise<{ tips: Tip[]; total: number; page: number; limit: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;
  const isPublished = filters.is_published !== undefined ? filters.is_published : true;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  conditions.push(`t.is_published = $${paramIndex++}`);
  params.push(isPublished);

  if (filters.category_id) {
    conditions.push(`t.category_id = $${paramIndex++}`);
    params.push(filters.category_id);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  // 전체 개수 조회
  const countQuery = `
    SELECT COUNT(*) as total
    FROM tips t
    ${whereClause}
  `;

  // 목록 조회
  const query = `
    SELECT 
      t.*,
      tc.name as category_name
    FROM tips t
    JOIN tip_categories tc ON t.category_id = tc.id
    ${whereClause}
    ORDER BY t.published_at DESC NULLS LAST
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  params.push(limit, offset);

  try {
    return await queryWithRetry(async () => {
      const countResult = await db.query(countQuery, params.slice(0, params.length - 2));
      const total = parseInt(countResult.rows[0].total, 10);

      const result = await db.query(query, params);

      return {
        tips: result.rows,
        total,
        page,
        limit,
      };
    });
  } catch (error) {
    console.error("Database query error in getTips:", error);
    console.error("Count Query:", countQuery);
    console.error("Query:", query);
    console.error("Params:", params);
    throw error;
  }
}

// 특정 꿀팁 조회 (ID로)
export async function getTipById(tipId: string): Promise<Tip | null> {
  const query = `
    SELECT 
      t.*,
      tc.name as category_name
    FROM tips t
    JOIN tip_categories tc ON t.category_id = tc.id
    WHERE t.id = $1
    LIMIT 1
  `;

  try {
    return await queryWithRetry(async () => {
      const result = await db.query(query, [tipId]);
      return result.rows[0] || null;
    });
  } catch (error) {
    console.error("Database query error in getTipById:", error);
    console.error("Query:", query);
    throw error;
  }
}

// 특정 꿀팁 조회 (슬러그로)
export async function getTipBySlug(slug: string): Promise<Tip | null> {
  const query = `
    SELECT 
      t.*,
      tc.name as category_name
    FROM tips t
    JOIN tip_categories tc ON t.category_id = tc.id
    WHERE t.slug = $1
    LIMIT 1
  `;

  try {
    return await queryWithRetry(async () => {
      const result = await db.query(query, [slug]);
      return result.rows[0] || null;
    });
  } catch (error) {
    console.error("Database query error in getTipBySlug:", error);
    console.error("Query:", query);
    throw error;
  }
}

// 조회수 증가
export async function incrementTipViewCount(tipId: string): Promise<void> {
  const query = `
    UPDATE tips
    SET view_count = view_count + 1
    WHERE id = $1
  `;

  await db.query(query, [tipId]);
}

