import { db } from "../storage/db.js";

export interface Carrier {
  id: string;
  name_ko: string;
  name_en: string;
  logo_url: string | null;
  website_url: string | null;
  created_at: Date;
}

// 모든 통신사 조회
export async function getAllCarriers(): Promise<Carrier[]> {
  const query = `
    SELECT 
      id,
      name_ko,
      name_en,
      logo_url,
      website_url,
      created_at
    FROM carriers
    ORDER BY id
  `;

  const result = await db.query(query);
  return result.rows;
}

// 특정 통신사 조회
export async function getCarrierById(id: string): Promise<Carrier | null> {
  const query = `
    SELECT 
      id,
      name_ko,
      name_en,
      logo_url,
      website_url,
      created_at
    FROM carriers
    WHERE id = $1
    LIMIT 1
  `;

  const result = await db.query(query, [id]);
  return result.rows[0] || null;
}

