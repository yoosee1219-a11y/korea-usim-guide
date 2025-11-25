import { db } from "../storage/db.js";

const BASE_URL = "https://koreausimguide.com";

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

/**
 * 정적 페이지 URL 목록
 */
function getStaticUrls(): SitemapUrl[] {
  const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD 형식
  
  return [
    {
      loc: `${BASE_URL}/`,
      lastmod: now,
      changefreq: "weekly",
      priority: 1.0,
    },
    {
      loc: `${BASE_URL}/compare`,
      lastmod: now,
      changefreq: "daily",
      priority: 0.9,
    },
    {
      loc: `${BASE_URL}/tips`,
      lastmod: now,
      changefreq: "daily",
      priority: 0.9,
    },
  ];
}

/**
 * 데이터베이스에서 모든 활성 요금제 ID 가져오기
 */
async function getActivePlanIds(): Promise<string[]> {
  try {
    const query = `
      SELECT id, updated_at 
      FROM plans 
      WHERE is_active = true
      ORDER BY updated_at DESC
    `;
    const result = await db.query(query);
    return result.rows.map((row) => row.id);
  } catch (error) {
    console.error("Error fetching plan IDs for sitemap:", error);
    return [];
  }
}

/**
 * 데이터베이스에서 모든 발행된 꿀팁 slug/ID 가져오기
 */
async function getPublishedTipIds(): Promise<Array<{ id: string; slug: string | null; updated_at: Date }>> {
  try {
    const query = `
      SELECT id, slug, updated_at 
      FROM tips 
      WHERE is_published = true
      ORDER BY updated_at DESC
    `;
    const result = await db.query(query);
    return result.rows.map((row) => ({
      id: row.id,
      slug: row.slug || row.id,
      updated_at: row.updated_at,
    }));
  } catch (error) {
    console.error("Error fetching tip IDs for sitemap:", error);
    return [];
  }
}

/**
 * 동적 Sitemap XML 생성
 */
export async function generateSitemapXml(): Promise<string> {
  try {
    const staticUrls = getStaticUrls();
    const planIds = await getActivePlanIds();
    const tips = await getPublishedTipIds();

    const urls: SitemapUrl[] = [...staticUrls];

    // 요금제 상세 페이지 URL 추가
    for (const planId of planIds) {
      const planResult = await db.query("SELECT updated_at FROM plans WHERE id = $1", [planId]);
      const updatedAt = planResult.rows[0]?.updated_at 
        ? new Date(planResult.rows[0].updated_at).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      urls.push({
        loc: `${BASE_URL}/plans/${planId}`,
        lastmod: updatedAt,
        changefreq: "weekly",
        priority: 0.8,
      });
    }

    // 꿀팁 상세 페이지 URL 추가
    for (const tip of tips) {
      const updatedAt = tip.updated_at
        ? new Date(tip.updated_at).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      urls.push({
        loc: `${BASE_URL}/tips/${tip.slug}`,
        lastmod: updatedAt,
        changefreq: "monthly",
        priority: 0.7,
      });
    }

    // XML 생성
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const url of urls) {
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    return xml;
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // 에러 발생 시 기본 정적 sitemap 반환
    return generateBasicSitemap();
  }
}

/**
 * 기본 정적 Sitemap (에러 발생 시 fallback)
 */
function generateBasicSitemap(): string {
  const staticUrls = getStaticUrls();
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const url of staticUrls) {
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

/**
 * XML 특수 문자 이스케이프
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

