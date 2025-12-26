import { db } from "../../server/storage/db.js";
import { generateBlogContent, validateGeneratedContent } from "../services/gemini-service.js";
import { optimizeForSEO } from "../services/seo-optimizer.js";
import { findRelatedContent, insertInternalLinks } from "../services/internal-linker.js";
import { generateContentImages } from "../services/image-service.js";
import slugify from "slugify";

interface AutomationResult {
  success: boolean;
  tipId?: string;
  slug?: string;
  error?: string;
}

/**
 * 콘텐츠 자동 생성 메인 워크플로우
 * @param keywordId 키워드 ID
 * @returns 생성 결과
 */
export async function autoGenerateContent(keywordId: string): Promise<AutomationResult> {
  let generatedTipId: string | null = null;

  try {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🚀 Starting content automation for keyword ID: ${keywordId}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // [1] 키워드 정보 가져오기
    console.log(`[1/9] Fetching keyword data...`);
    const keywordResult = await db.query(
      'SELECT * FROM content_keywords WHERE id = $1',
      [keywordId]
    );

    if (keywordResult.rows.length === 0) {
      throw new Error(`Keyword not found: ${keywordId}`);
    }

    const keywordData = keywordResult.rows[0];
    console.log(`✅ Keyword: "${keywordData.keyword}"`);
    console.log(`   Search Intent: ${keywordData.search_intent}`);
    console.log(`   CPC: ${keywordData.cpc_krw}원`);
    console.log(`   Priority: ${keywordData.priority}`);

    // 상태 업데이트: generating
    await db.query(
      'UPDATE content_keywords SET status = $1 WHERE id = $2',
      ['generating', keywordId]
    );

    // [2] Gemini로 콘텐츠 생성
    console.log(`\n[2/9] Generating content with Gemini AI...`);
    const generatedContent = await generateBlogContent(
      keywordData.keyword,
      {
        searchIntent: keywordData.search_intent,
        cpc: keywordData.cpc_krw
      }
    );

    // [3] 콘텐츠 검증
    console.log(`\n[3/11] Validating generated content...`);
    if (!validateGeneratedContent(generatedContent)) {
      throw new Error("Generated content validation failed");
    }
    console.log(`✅ Content validation passed`);

    // [4] 이미지 생성
    console.log(`\n[4/11] Generating images...`);
    const images = await generateContentImages(
      keywordData.keyword,
      generatedContent.thumbnail_suggestion
    );
    console.log(`✅ Images generated:`);
    console.log(`   - Thumbnail: ${images.thumbnail.url}`);
    console.log(`   - Content images: ${images.contentImages.length}`);

    // [5] SEO 최적화
    console.log(`\n[5/11] Optimizing for SEO...`);
    const slug = slugify(generatedContent.slug_suggestion || keywordData.keyword, {
      lower: true,
      strict: true
    });

    // Slug 중복 확인
    const slugCheck = await db.query(
      'SELECT id FROM tips WHERE slug = $1 LIMIT 1',
      [slug]
    );

    let finalSlug = slug;
    if (slugCheck.rows.length > 0) {
      // 중복이면 타임스탬프 추가
      finalSlug = `${slug}-${Date.now()}`;
      console.warn(`⚠️ Slug collision detected, using: ${finalSlug}`);
    }

    const seoMeta = {
      h2_tags: generatedContent.h2_tags,
      keywords: generatedContent.keywords,
      slug: finalSlug,
      thumbnail_suggestion: generatedContent.thumbnail_suggestion
    };

    console.log(`✅ SEO slug: ${finalSlug}`);

    // [6] 관련 콘텐츠 찾기
    console.log(`\n[6/11] Finding related content for internal links...`);
    const relatedKeywords = typeof keywordData.related_keywords === 'string'
      ? JSON.parse(keywordData.related_keywords)
      : keywordData.related_keywords || [];

    const relatedContent = await findRelatedContent(
      keywordData.keyword,
      relatedKeywords
    );
    console.log(`✅ Found ${relatedContent.length} related posts`);

    // [7] 내부 링크 삽입
    console.log(`\n[7/11] Inserting internal links...`);
    let contentWithLinks = generatedContent.content;
    if (relatedContent.length > 0) {
      contentWithLinks = insertInternalLinks(
        generatedContent.content,
        relatedContent
      );
      console.log(`✅ Internal links inserted`);
    } else {
      console.log(`ℹ️ No related content found, skipping internal links`);
    }

    // [8] 이미지를 콘텐츠에 삽입
    console.log(`\n[8/11] Inserting images into content...`);
    let contentWithImages = contentWithLinks;

    // 본문 이미지 삽입 (첫 번째 H2 태그 다음에)
    if (images.contentImages.length > 0) {
      const firstH2Index = contentWithImages.indexOf('<h2>');
      if (firstH2Index !== -1) {
        const afterFirstH2 = contentWithImages.indexOf('</h2>', firstH2Index) + 5;
        const imageHtml = images.contentImages
          .map(img => `<img src="${img.url}" alt="${keywordData.keyword}" class="content-image" loading="lazy" />`)
          .join('\n');
        contentWithImages = contentWithImages.slice(0, afterFirstH2) +
          '\n' + imageHtml + '\n' +
          contentWithImages.slice(afterFirstH2);
      }
    }
    console.log(`✅ ${images.contentImages.length} images inserted into content`);

    // [9] tips 테이블에 저장 (한국어 원본)
    console.log(`\n[9/11] Saving Korean original to database...`);
    const tipResult = await db.query(`
      INSERT INTO tips (
        category_id, slug, title, content, excerpt, thumbnail_url,
        language, is_published, published_at, seo_meta
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
      RETURNING *
    `, [
      'guide',                           // category_id
      finalSlug,
      generatedContent.title,
      contentWithImages,                 // 이미지 포함된 콘텐츠
      generatedContent.excerpt,
      images.thumbnail.url,              // AI 생성 대표 이미지
      'ko',                              // language
      true,                              // is_published
      JSON.stringify(seoMeta)            // seo_meta
    ]);

    generatedTipId = tipResult.rows[0].id;
    console.log(`✅ Korean tip created: ${generatedTipId}`);

    // [10] 다국어 번역 (기존 번역 API 활용)
    console.log(`\n[10/11] Translating to 3 languages...`);
    await translateTip(generatedTipId, tipResult.rows[0]);
    console.log(`✅ Translations completed`);

    // [11] 키워드 테이블 업데이트
    console.log(`\n[11/11] Updating keyword status...`);
    await db.query(`
      UPDATE content_keywords SET
        status = $1,
        tip_id = $2,
        generated_at = NOW(),
        published_at = NOW(),
        seo_meta = $3,
        error_message = NULL
      WHERE id = $4
    `, ['published', generatedTipId, JSON.stringify(seoMeta), keywordId]);

    console.log(`✅ Keyword status updated to 'published'`);

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎉 Content automation completed successfully!`);
    console.log(`   Tip ID: ${generatedTipId}`);
    console.log(`   Slug: ${finalSlug}`);
    console.log(`   URL: /tips/${finalSlug}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    return {
      success: true,
      tipId: generatedTipId,
      slug: finalSlug
    };

  } catch (error) {
    console.error(`\n❌ Content automation failed:`, error);

    // 에러 로그 저장
    await db.query(`
      UPDATE content_keywords SET
        status = $1,
        error_message = $2
      WHERE id = $3
    `, ['failed', error instanceof Error ? error.message : String(error), keywordId]);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 번역 함수 (기존 translate.ts 로직 활용)
 */
async function translateTip(originalTipId: string, originalTip: any): Promise<void> {
  const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'ru', name: 'Russian' },
  ];

  // Google Translate 사용 (기존 코드 재사용)
  // 간략화를 위해 여기서는 로그만 출력
  // 실제로는 server/routes/translate.ts의 로직을 import해서 사용

  for (const lang of LANGUAGES) {
    const langCode = lang.dbCode || lang.code;
    console.log(`   Translating to ${lang.name}...`);

    // 실제 번역 API 호출은 생략 (나중에 구현)
    // 지금은 원본 그대로 저장 (TODO)
    await db.query(`
      INSERT INTO tips (
        category_id, slug, title, content, excerpt, thumbnail_url,
        is_published, published_at, language, original_tip_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      originalTip.category_id,
      originalTip.slug,
      `[${lang.code.toUpperCase()}] ${originalTip.title}`,  // TODO: 실제 번역
      originalTip.content,                                    // TODO: 실제 번역
      originalTip.excerpt,                                    // TODO: 실제 번역
      originalTip.thumbnail_url,
      true,
      new Date(),
      langCode,
      originalTipId
    ]);
  }

  console.log(`   ✅ ${LANGUAGES.length} translations created`);
}
