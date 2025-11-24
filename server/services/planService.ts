import { db } from "../storage/db.js";

export interface Plan {
  id: string;
  carrier_id: string;
  plan_type: string;
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
  airport_pickup?: boolean;
  esim_support?: boolean;
  is_popular?: boolean;
}

// 요금제 목록 조회 (필터링 지원)
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

  if (filters.airport_pickup !== undefined) {
    conditions.push(`p.airport_pickup = $${paramIndex++}`);
    params.push(filters.airport_pickup);
  }

  if (filters.eSIM_support !== undefined) {
    conditions.push(`p.esim_support = $${paramIndex++}`);
    params.push(filters.eSIM_support);
  }

  if (filters.is_popular !== undefined) {
    conditions.push(`p.is_popular = $${paramIndex++}`);
    params.push(filters.is_popular);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT 
      p.*,
      c.name_ko as carrier_name_ko,
      c.name_en as carrier_name_en
    FROM plans p
    JOIN carriers c ON p.carrier_id = c.id
    ${whereClause}
    ORDER BY p.is_popular DESC, p.price_krw ASC
  `;

  const result = await db.query(query, params);
  return result.rows;
}

// 특정 요금제 조회
export async function getPlanById(planId: string): Promise<Plan | null> {
  const query = `
    SELECT 
      p.*,
      c.name_ko as carrier_name_ko,
      c.name_en as carrier_name_en
    FROM plans p
    JOIN carriers c ON p.carrier_id = c.id
    WHERE p.id = $1
    LIMIT 1
  `;

  const result = await db.query(query, [planId]);
  return result.rows[0] || null;
}

// 요금제 비교 (여러 ID)
export async function comparePlans(planIds: string[]): Promise<Plan[]> {
  if (planIds.length === 0) {
    return [];
  }

  // UUID 배열을 PostgreSQL 배열로 변환
  const query = `
    SELECT 
      p.*,
      c.name_ko as carrier_name_ko,
      c.name_en as carrier_name_en
    FROM plans p
    JOIN carriers c ON p.carrier_id = c.id
    WHERE p.id = ANY($1::uuid[])
    ORDER BY p.price_krw ASC
  `;

  const result = await db.query(query, [planIds]);
  return result.rows;
}

