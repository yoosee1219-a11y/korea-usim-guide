import { db } from "../../server/storage/db.js";

interface RelatedContent {
  id: string;
  slug: string;
  title: string;
  language: string;
}

/**
 * 관련 콘텐츠 찾기 (내부 링크용)
 * @param keyword 현재 키워드
 * @param relatedKeywords 관련 키워드 목록
 * @returns 관련 콘텐츠 목록
 */
export async function findRelatedContent(
  keyword: string,
  relatedKeywords: string[] = []
): Promise<RelatedContent[]> {
  try {
    // 관련 키워드가 제목에 포함된 발행된 한국어 콘텐츠 검색
    const keywords = [keyword, ...relatedKeywords];
    const keywordPattern = keywords.join('|');

    const result = await db.query(`
      SELECT
        id,
        slug,
        title,
        language
      FROM tips
      WHERE
        language = 'ko'
        AND is_published = true
        AND (
          title ~* $1
          OR content ~* $1
        )
      ORDER BY view_count DESC
      LIMIT 5
    `, [keywordPattern]);

    return result.rows;

  } catch (error) {
    console.error('❌ Failed to find related content:', error);
    return [];
  }
}

/**
 * 콘텐츠에 내부 링크 삽입
 * @param content HTML 콘텐츠
 * @param relatedContent 관련 콘텐츠 목록
 * @returns 링크가 삽입된 콘텐츠
 */
export function insertInternalLinks(
  content: string,
  relatedContent: RelatedContent[]
): string {
  if (relatedContent.length === 0) {
    return content;
  }

  let updatedContent = content;

  // 각 관련 콘텐츠에 대해 링크 삽입
  for (const related of relatedContent) {
    // 제목의 첫 등장 위치에만 링크 삽입
    const titleRegex = new RegExp(`(^|[^>])(${escapeRegex(related.title)})([^<]|$)`, 'i');

    const replacement = `$1<a href="/tips/${related.slug}" class="internal-link" title="${related.title}">$2</a>$3`;

    // 최초 1회만 교체
    if (titleRegex.test(updatedContent)) {
      updatedContent = updatedContent.replace(titleRegex, replacement);
      console.log(`🔗 Added internal link to: ${related.title}`);
    }
  }

  // 관련 글 섹션 추가 (본문 끝에)
  const relatedLinksSection = generateRelatedLinksSection(relatedContent);
  updatedContent = appendRelatedLinksSection(updatedContent, relatedLinksSection);

  return updatedContent;
}

/**
 * 정규식 이스케이프
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 관련 글 섹션 HTML 생성
 */
function generateRelatedLinksSection(relatedContent: RelatedContent[]): string {
  if (relatedContent.length === 0) {
    return '';
  }

  const links = relatedContent
    .map(related => `
      <li>
        <a href="/tips/${related.slug}" class="related-link">
          ${related.title}
        </a>
      </li>
    `)
    .join('\n');

  return `
<h2>관련 글</h2>
<div class="related-posts">
  <ul>
    ${links}
  </ul>
</div>
  `;
}

/**
 * 관련 글 섹션을 본문 끝에 추가
 */
function appendRelatedLinksSection(content: string, section: string): string {
  if (!section) {
    return content;
  }

  // </body> 태그 직전에 삽입, 없으면 맨 끝에 추가
  if (content.includes('</body>')) {
    return content.replace('</body>', `${section}</body>`);
  }

  return content + '\n' + section;
}

/**
 * 링크 유효성 검증
 */
export async function validateInternalLinks(content: string): Promise<boolean> {
  const linkRegex = /href="\/tips\/([^"]+)"/g;
  const matches = Array.from(content.matchAll(linkRegex));

  if (matches.length === 0) {
    return true; // 링크 없으면 통과
  }

  const slugs = matches.map(match => match[1]);

  // 모든 slug가 DB에 존재하는지 확인
  const result = await db.query(`
    SELECT slug
    FROM tips
    WHERE slug = ANY($1::text[])
      AND language = 'ko'
      AND is_published = true
  `, [slugs]);

  const validSlugs = new Set(result.rows.map(row => row.slug));

  for (const slug of slugs) {
    if (!validSlugs.has(slug)) {
      console.error(`❌ Invalid internal link: /tips/${slug}`);
      return false;
    }
  }

  return true;
}
