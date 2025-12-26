import slugify from "slugify";

interface SEOMetadata {
  slug: string;
  title: string;
  metaDescription: string;
  keywords: string[];
  h2Tags: string[];
}

/**
 * SEO 최적화 메타데이터 생성
 * @param content 생성된 콘텐츠
 * @param keyword 타겟 키워드
 * @returns SEO 메타데이터
 */
export function optimizeForSEO(content: any, keyword: string): SEOMetadata {
  // URL Slug 생성 (한글 → 영문)
  const slug = generateSlug(content.slug_suggestion || keyword);

  // 제목에 키워드 포함 확인
  const title = ensureKeywordInTitle(content.title, keyword);

  // 메타 설명 최적화
  const metaDescription = optimizeMetaDescription(content.excerpt, keyword);

  return {
    slug,
    title,
    metaDescription,
    keywords: content.keywords || [],
    h2Tags: content.h2_tags || []
  };
}

/**
 * URL Slug 생성
 */
function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'en',
    remove: /[*+~.()'"!:@]/g
  });
}

/**
 * 제목에 키워드 포함 확인 및 보정
 */
function ensureKeywordInTitle(title: string, keyword: string): string {
  if (!title.includes(keyword)) {
    // 키워드가 제목에 없으면 추가
    console.warn(`⚠️ Keyword "${keyword}" not found in title, adding...`);
    return `${keyword}: ${title}`;
  }
  return title;
}

/**
 * 메타 설명 최적화
 */
function optimizeMetaDescription(excerpt: string, keyword: string): string {
  let optimized = excerpt;

  // 키워드 포함 확인
  if (!optimized.includes(keyword)) {
    optimized = `${keyword}에 대한 완벽 가이드. ${optimized}`;
  }

  // 길이 제한 (150자)
  if (optimized.length > 150) {
    optimized = optimized.substring(0, 147) + '...';
  }

  return optimized;
}

/**
 * 키워드 밀도 계산
 */
export function calculateKeywordDensity(content: string, keyword: string): number {
  const totalWords = content.split(/\s+/).length;
  const keywordOccurrences = (content.match(new RegExp(keyword, 'gi')) || []).length;

  return (keywordOccurrences / totalWords) * 100;
}

/**
 * Schema.org 마크업 생성
 */
export function generateSchemaMarkup(content: any, keyword: string): any {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": content.title,
    "description": content.excerpt,
    "keywords": content.keywords?.join(', '),
    "author": {
      "@type": "Organization",
      "name": "Korea USIM Guide"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Korea USIM Guide",
      "logo": {
        "@type": "ImageObject",
        "url": "https://koreausimguide.com/logo.png"
      }
    },
    "datePublished": new Date().toISOString(),
    "dateModified": new Date().toISOString()
  };
}
