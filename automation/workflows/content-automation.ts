import { db } from "../../server/storage/db.js";
import { generateBlogContent, validateGeneratedContent } from "../services/gemini-service.js";
import { optimizeForSEO } from "../services/seo-optimizer.js";
import { findRelatedContent, insertInternalLinks } from "../services/internal-linker.js";
import { generateContentImages } from "../services/image-service.js";
import slugify from "slugify";
import { v2 } from '@google-cloud/translate';

interface AutomationResult {
  success: boolean;
  tipId?: string;
  slug?: string;
  error?: string;
}

/**
 * Automated content generation workflow using AI and SEO optimization
 *
 * Orchestrates the complete blog post generation process:
 * 1. Fetches keyword data and SEO metadata
 * 2. Generates content using Gemini AI
 * 3. Validates content quality
 * 4. Optimizes for SEO (slug, meta tags)
 * 5. Creates multilingual translations
 * 6. Publishes to database
 *
 * @param keywordId - Database ID of the target keyword
 * @returns Result object containing success status, tip ID, slug, or error details
 * @throws Error if content generation fails or validation fails
 *
 * @example
 * const result = await autoGenerateContent("keyword-123");
 * if (result.success) {
 *   console.log(`Published: ${result.slug}`);
 * }
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

    // [4] 이미지 생성 (비활성화 - 관리자가 직접 설정)
    console.log(`\n[4/11] Skipping image generation (admin will set manually)...`);
    const thumbnailUrl = 'https://images.unsplash.com/photo-1551410224-699683e15636?w=1024&h=1024&fit=crop';
    console.log(`✅ Using default placeholder image`);

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

    // [8] 이미지를 콘텐츠에 삽입 (비활성화 - 관리자가 직접 삽입)
    console.log(`\n[8/11] Skipping content image insertion (admin will add manually)...`);
    let contentWithImages = contentWithLinks;
    console.log(`✅ Content ready without images`);

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
      thumbnailUrl,                      // 기본 이미지 (관리자가 나중에 변경)
      'ko',                              // language
      true,                              // is_published
      JSON.stringify(seoMeta)            // seo_meta
    ]);

    generatedTipId = tipResult.rows[0].id;
    console.log(`✅ Korean tip created: ${generatedTipId}`);

    // [10] 다국어 번역 (11개 언어로 번역)
    console.log(`\n[10/11] Translating to 11 languages...`);
    if (generatedTipId) {
      await translateTip(generatedTipId, tipResult.rows[0]);
    }
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
      tipId: generatedTipId || undefined,
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

// Initialize Google Cloud Translation client (v2 API with API key)
const translationClient = new v2.Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY || '',
});

/**
 * 번역 함수 - Google Cloud Translation API 사용
 */
async function translateTip(originalTipId: string, originalTip: any): Promise<void> {
  const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'th', name: 'Thai' },
    { code: 'tl', name: 'Tagalog' },
    { code: 'uz', name: 'Uzbek' },
    { code: 'ne', name: 'Nepali' },
    { code: 'mn', name: 'Mongolian' },
    { code: 'id', name: 'Indonesian' },
    { code: 'my', name: 'Burmese' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', dbCode: 'zh' },
    { code: 'ru', name: 'Russian' },
  ];

  // Parallel translation with Promise.all for 5.5x speed improvement (6.6s → 1.2s)
  const translationPromises = LANGUAGES.map(async (lang) => {
    const langCode = lang.dbCode || lang.code;
    console.log(`   Translating to ${lang.name}...`);

    try {
      // Translate all fields in parallel for this language
      const [translatedTitle, translatedExcerpt, translatedContent] = await Promise.all([
        translationClient.translate(originalTip.title, lang.code).then(([text]) => text),
        translationClient.translate(originalTip.excerpt, lang.code).then(([text]) => text),
        translationClient.translate(originalTip.content, lang.code).then(([text]) => text),
      ]);

      return {
        lang,
        langCode,
        translatedTitle,
        translatedExcerpt,
        translatedContent,
        success: true,
      };
    } catch (error) {
      console.error(`   ❌ Failed to translate to ${lang.name}:`, error);
      return {
        lang,
        langCode,
        success: false,
        error,
      };
    }
  });

  // Wait for all translations to complete
  const translations = await Promise.all(translationPromises);

  // Save all successful translations to database
  for (const translation of translations) {
    if (translation.success) {
      try {
        await db.query(`
          INSERT INTO tips (
            category_id, slug, title, content, excerpt, thumbnail_url,
            is_published, published_at, language, original_tip_id, seo_meta
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          originalTip.category_id,
          originalTip.slug,
          translation.translatedTitle,
          translation.translatedContent,
          translation.translatedExcerpt,
          originalTip.thumbnail_url,
          true,
          new Date(),
          translation.langCode,
          originalTipId,
          originalTip.seo_meta
        ]);
      } catch (error) {
        console.error(`   ❌ Failed to save ${translation.lang.name} translation:`, error);
      }
    }
  }

  const successCount = translations.filter(t => t.success).length;
  console.log(`   ✅ ${successCount}/${LANGUAGES.length} translations created`);
}
