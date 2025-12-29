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

export interface Plan {
  id: string;
  carrier_id: string;
  plan_type: string;
  payment_type: string; // 'prepaid' (선불) or 'postpaid' (후불)
  name: string;
  description: string | null;
  data_amount_gb: number | null;
  validity_days: number;
  voice_minutes: number | null;
  sms_count: number | null;
  price_krw: number;
  features: string[] | null;
  airport_pickup: boolean;
  esim_support: boolean;
  physical_sim: boolean;
  is_popular: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  carrier_name_ko?: string;
  carrier_name_en?: string;
}

export interface PlanFilters {
  carrier_id?: string;
  dataMin?: number;
  dataMax?: number;
  priceMin?: number;
  priceMax?: number;
  plan_type?: string;
  payment_type?: string; // 'prepaid' (선불) or 'postpaid' (후불)
  airport_pickup?: boolean;
  esim_support?: boolean;
  is_popular?: boolean;
  lang?: string; // Language code (ko, en, vi, th, etc.)
}

/**
 * Retrieves filtered list of mobile plans with carrier information
 *
 * Fetches plans from database with support for multilingual carrier names and comprehensive filtering.
 * Automatically retries on connection timeouts. Returns active plans only.
 *
 * @param filters - Optional filtering parameters
 * @param filters.carrier_id - Filter by carrier ID
 * @param filters.dataMin - Minimum data amount in GB
 * @param filters.dataMax - Maximum data amount in GB
 * @param filters.priceMin - Minimum price in KRW
 * @param filters.priceMax - Maximum price in KRW
 * @param filters.plan_type - Plan type filter
 * @param filters.payment_type - Payment type: 'prepaid' or 'postpaid'
 * @param filters.airport_pickup - Filter by airport pickup availability
 * @param filters.esim_support - Filter by eSIM support
 * @param filters.is_popular - Filter by popular status
 * @param filters.lang - Language code for carrier names (default: 'ko')
 * @returns Array of plans with carrier information
 * @throws Error if database query fails after retries
 *
 * @example
 * const plans = await getPlans({
 *   esim_support: true,
 *   priceMax: 50000,
 *   lang: 'en'
 * });
 */
export async function getPlans(filters: PlanFilters = {}): Promise<Plan[]> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  // 기본 조건: 활성화된 요금제만
  conditions.push(`p.is_active = $${paramIndex++}`);
  params.push(true);

  // 필터 조건 추가
  if (filters.carrier_id) {
    conditions.push(`p.carrier_id = $${paramIndex++}`);
    params.push(filters.carrier_id);
  }

  if (filters.dataMin !== undefined) {
    conditions.push(`p.data_amount_gb >= $${paramIndex++}`);
    params.push(filters.dataMin);
  }

  if (filters.dataMax !== undefined) {
    conditions.push(`p.data_amount_gb <= $${paramIndex++}`);
    params.push(filters.dataMax);
  }

  if (filters.priceMin !== undefined) {
    conditions.push(`p.price_krw >= $${paramIndex++}`);
    params.push(filters.priceMin);
  }

  if (filters.priceMax !== undefined) {
    conditions.push(`p.price_krw <= $${paramIndex++}`);
    params.push(filters.priceMax);
  }

  if (filters.plan_type) {
    conditions.push(`p.plan_type = $${paramIndex++}`);
    params.push(filters.plan_type);
  }

  if (filters.payment_type) {
    conditions.push(`p.payment_type = $${paramIndex++}`);
    params.push(filters.payment_type);
  }

  if (filters.airport_pickup !== undefined) {
    conditions.push(`p.airport_pickup = $${paramIndex++}`);
    params.push(filters.airport_pickup);
  }

  if (filters.esim_support !== undefined) {
    conditions.push(`p.esim_support = $${paramIndex++}`);
    params.push(filters.esim_support);
  }

  if (filters.is_popular !== undefined) {
    conditions.push(`p.is_popular = $${paramIndex++}`);
    params.push(filters.is_popular);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Get language code (default to 'ko')
  const lang = filters.lang && filters.lang !== 'ko' ? filters.lang : null;

  // Build language-specific column selection
  let descriptionColumn = 'p.description';
  let featuresColumn = 'p.features';

  if (lang) {
    // Use COALESCE to fallback to Korean if translation doesn't exist
    descriptionColumn = `COALESCE(p.description_${lang}, p.description) as description`;
    featuresColumn = `COALESCE(p.features_${lang}, p.features) as features`;
  } else {
    descriptionColumn = 'p.description';
    featuresColumn = 'p.features';
  }

  const query = `
    SELECT
      p.id,
      p.carrier_id,
      p.plan_type,
      p.payment_type,
      p.name,
      ${descriptionColumn},
      p.data_amount_gb,
      p.validity_days,
      p.voice_minutes,
      p.sms_count,
      p.price_krw,
      ${featuresColumn},
      p.airport_pickup,
      p.esim_support,
      p.physical_sim,
      p.is_popular,
      p.is_active,
      p.created_at,
      p.updated_at,
      c.name_ko as carrier_name_ko,
      c.name_en as carrier_name_en
    FROM plans p
    JOIN carriers c ON p.carrier_id = c.id
    ${whereClause}
    ORDER BY p.is_popular DESC, p.price_krw ASC
  `;

  try {
    return await queryWithRetry(async () => {
      const result = await db.query(query, params);
      return result.rows;
    });
  } catch (error) {
    console.error("Database query error in getPlans:", error);
    console.error("Query:", query);
    console.error("Params:", params);
    throw error;
  }
}

// 특정 요금제 조회
export async function getPlanById(planId: string, lang?: string): Promise<Plan | null> {
  // Build language-specific column selection
  const langCode = lang && lang !== 'ko' ? lang : null;
  let descriptionColumn = 'p.description';
  let featuresColumn = 'p.features';

  if (langCode) {
    descriptionColumn = `COALESCE(p.description_${langCode}, p.description) as description`;
    featuresColumn = `COALESCE(p.features_${langCode}, p.features) as features`;
  }

  const query = `
    SELECT
      p.id,
      p.carrier_id,
      p.plan_type,
      p.payment_type,
      p.name,
      ${descriptionColumn},
      p.data_amount_gb,
      p.validity_days,
      p.voice_minutes,
      p.sms_count,
      p.price_krw,
      ${featuresColumn},
      p.airport_pickup,
      p.esim_support,
      p.physical_sim,
      p.is_popular,
      p.is_active,
      p.created_at,
      p.updated_at,
      c.name_ko as carrier_name_ko,
      c.name_en as carrier_name_en
    FROM plans p
    JOIN carriers c ON p.carrier_id = c.id
    WHERE p.id = $1
    LIMIT 1
  `;

  try {
    return await queryWithRetry(async () => {
      const result = await db.query(query, [planId]);
      return result.rows[0] || null;
    });
  } catch (error) {
    console.error("Database query error in getPlanById:", error);
    console.error("Query:", query);
    throw error;
  }
}

// 요금제 비교 (여러 ID)
export async function comparePlans(planIds: string[], lang?: string): Promise<Plan[]> {
  if (planIds.length === 0) {
    return [];
  }

  // Build language-specific column selection
  const langCode = lang && lang !== 'ko' ? lang : null;
  let descriptionColumn = 'p.description';
  let featuresColumn = 'p.features';

  if (langCode) {
    descriptionColumn = `COALESCE(p.description_${langCode}, p.description) as description`;
    featuresColumn = `COALESCE(p.features_${langCode}, p.features) as features`;
  }

  // UUID 배열을 PostgreSQL 배열로 변환
  const query = `
    SELECT
      p.id,
      p.carrier_id,
      p.plan_type,
      p.payment_type,
      p.name,
      ${descriptionColumn},
      p.data_amount_gb,
      p.validity_days,
      p.voice_minutes,
      p.sms_count,
      p.price_krw,
      ${featuresColumn},
      p.airport_pickup,
      p.esim_support,
      p.physical_sim,
      p.is_popular,
      p.is_active,
      p.created_at,
      p.updated_at,
      c.name_ko as carrier_name_ko,
      c.name_en as carrier_name_en
    FROM plans p
    JOIN carriers c ON p.carrier_id = c.id
    WHERE p.id = ANY($1::uuid[])
    ORDER BY p.price_krw ASC
  `;

  try {
    return await queryWithRetry(async () => {
      const result = await db.query(query, [planIds]);
      return result.rows;
    });
  } catch (error) {
    console.error("Database query error in comparePlans:", error);
    console.error("Query:", query);
    throw error;
  }
}

