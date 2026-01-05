import { Router } from "express";
import { db } from "../../storage/db.js";
import { requireAdminAuth } from "../../middleware/adminAuth.js";
import { autoGenerateContent } from "../../../automation/workflows/content-automation.js";
import { v2 } from '@google-cloud/translate';
import { handleApiError, handleSuccess } from "../../utils/errorHandler.js";
import { keywordResearchService } from "../../../automation/services/keyword-research.js";

const router = Router();

// 모든 라우트에 관리자 인증 미들웨어 적용
router.use(requireAdminAuth);

// POST - 단일 키워드로 콘텐츠 생성
router.post("/generate/:keywordId", async (req, res) => {
  try {
    const { keywordId } = req.params;

    // 키워드 존재 확인
    const keywordCheck = await db.query(
      'SELECT * FROM content_keywords WHERE id = $1',
      [keywordId]
    );

    if (keywordCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Keyword not found' });
    }

    const keyword = keywordCheck.rows[0];

    // 이미 생성 중이거나 생성된 경우 체크
    if (keyword.status === 'generating') {
      return res.status(409).json({
        error: 'Already generating',
        message: '이미 생성 중인 키워드입니다.'
      });
    }

    if (keyword.status === 'published') {
      return res.status(409).json({
        error: 'Already published',
        message: '이미 발행된 콘텐츠입니다.',
        tipId: keyword.tip_id
      });
    }

    // 비동기로 실행 (즉시 응답)
    autoGenerateContent(keywordId)
      .then(result => {
        if (result.success) {
          console.log(`✅ Content generated successfully:`, result);
        } else {
          console.error(`❌ Content generation failed:`, result.error);
        }
      })
      .catch(err => console.error(`❌ Unexpected error:`, err));

    res.json({
      status: 'started',
      message: 'Content generation started in background',
      keywordId,
      keyword: keyword.keyword
    });

  } catch (error) {
    handleApiError(res, error, 'Failed to start content generation');
  }
});

// POST - 여러 키워드 일괄 생성 (Vercel Free 플랜 고려)
router.post("/generate-batch", async (req, res) => {
  try {
    const { keywordIds, maxConcurrent = 1 } = req.body;

    if (!Array.isArray(keywordIds) || keywordIds.length === 0) {
      return res.status(400).json({ error: 'Invalid keywordIds array' });
    }

    // Free 플랜을 위해 순차 처리 (동시 실행 제한)
    const results = [];

    for (let i = 0; i < Math.min(keywordIds.length, maxConcurrent); i++) {
      try {
        const result = await autoGenerateContent(keywordIds[i]);
        results.push({ keywordId: keywordIds[i], ...result });
      } catch (error) {
        results.push({
          keywordId: keywordIds[i],
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.json({
      processed: results.length,
      total: keywordIds.length,
      results
    });

  } catch (error) {
    handleApiError(res, error, 'Failed to generate batch content');
  }
});

// GET - 생성 통계
router.get("/stats", async (req, res) => {
  try {
    const statsResult = await db.query(`
      SELECT
        status,
        priority,
        COUNT(*) as count,
        AVG(cpc_krw)::integer as avg_cpc
      FROM content_keywords
      GROUP BY status, priority
      ORDER BY
        CASE priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        status
    `);

    // 총계 계산
    const totalResult = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'published') as published_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'generating') as generating_count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count
      FROM content_keywords
    `);

    const total = parseInt(totalResult.rows[0].total);
    const published = parseInt(totalResult.rows[0].published_count);
    const successRate = total > 0 ? (published / total) * 100 : 0;

    res.json({
      total_keywords: total,
      pending_count: parseInt(totalResult.rows[0].pending_count),
      published_count: published,
      failed_count: parseInt(totalResult.rows[0].failed_count),
      success_rate: successRate
    });

  } catch (error) {
    handleApiError(res, error, 'Failed to fetch stats');
  }
});

// GET - 최근 생성 로그
router.get("/logs", async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const result = await db.query(`
      SELECT
        ck.id,
        ck.keyword,
        ck.status,
        ck.generated_at,
        ck.published_at,
        ck.error_message,
        t.slug as tip_slug,
        t.title as tip_title
      FROM content_keywords ck
      LEFT JOIN tips t ON ck.tip_id = t.id AND t.language = 'ko'
      WHERE ck.status IN ('published', 'failed')
      ORDER BY COALESCE(ck.published_at, ck.generated_at) DESC
      LIMIT $1
    `, [limit]);

    res.json(result.rows);

  } catch (error) {
    handleApiError(res, error, 'Failed to fetch logs');
  }
});

// POST - 실패한 키워드 재시도
router.post("/retry/:keywordId", async (req, res) => {
  try {
    const { keywordId } = req.params;

    // 키워드 확인
    const keywordCheck = await db.query(
      'SELECT * FROM content_keywords WHERE id = $1',
      [keywordId]
    );

    if (keywordCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Keyword not found' });
    }

    const keyword = keywordCheck.rows[0];

    if (keyword.status !== 'failed') {
      return res.status(400).json({
        error: 'Invalid status',
        message: '실패한 키워드만 재시도할 수 있습니다.'
      });
    }

    // 상태 초기화
    await db.query(
      'UPDATE content_keywords SET status = $1, error_message = NULL WHERE id = $2',
      ['pending', keywordId]
    );

    // 재생성 시작
    autoGenerateContent(keywordId)
      .then(result => console.log(`✅ Retry result:`, result))
      .catch(err => console.error(`❌ Retry failed:`, err));

    res.json({
      status: 'started',
      message: 'Retry started',
      keywordId
    });

  } catch (error) {
    handleApiError(res, error, 'Failed to retry');
  }
});

// GET - 스케줄러 설정 조회
router.get("/scheduler-settings", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT value FROM app_settings WHERE key = 'scheduler_settings'"
    );

    if (result.rows.length > 0) {
      res.json(result.rows[0].value);
    } else {
      // 기본 설정 반환 및 DB에 삽입
      const defaultSettings = {
        enabled: false,
        interval: 24,
        postsPerDay: 3, // 하루 3개 (1개 → 3개로 증가)
        lastRun: null
      };

      await db.query(
        "INSERT INTO app_settings (key, value) VALUES ('scheduler_settings', $1) ON CONFLICT (key) DO NOTHING",
        [JSON.stringify(defaultSettings)]
      );

      res.json(defaultSettings);
    }
  } catch (error) {
    console.error('Failed to read scheduler settings:', error);
    res.status(500).json({ error: 'Failed to read scheduler settings' });
  }
});

// POST - 스케줄러 설정 저장
router.post("/scheduler-settings", async (req, res) => {
  try {
    const settings = req.body;

    // 데이터베이스에 저장 (UPSERT)
    await db.query(
      `INSERT INTO app_settings (key, value)
       VALUES ('scheduler_settings', $1)
       ON CONFLICT (key)
       DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
      [JSON.stringify(settings)]
    );

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Failed to save scheduler settings:', error);
    res.status(500).json({ error: 'Failed to save scheduler settings' });
  }
});

// POST - 스케줄러 실행 (크론/수동 호출용)
router.post("/run-scheduler", async (req, res) => {
  try {
    console.log('🕐 Scheduler triggered');

    // 설정 읽기 (데이터베이스에서)
    const settingsResult = await db.query(
      "SELECT value FROM app_settings WHERE key = 'scheduler_settings'"
    );

    if (settingsResult.rows.length === 0) {
      return res.json({ message: 'Scheduler not configured', processed: 0 });
    }

    const settings = settingsResult.rows[0].value;

    if (!settings.enabled) {
      return res.json({ message: 'Scheduler is disabled', processed: 0 });
    }

    // 마지막 실행 날짜 확인 (하루에 한 번만 실행)
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

    if (settings.lastRun) {
      const lastRun = new Date(settings.lastRun);
      const lastRunDate = lastRun.toISOString().split('T')[0]; // YYYY-MM-DD

      if (lastRunDate === today) {
        console.log(`⏱️ Already ran today: ${lastRunDate}`);
        return res.json({
          message: 'Already ran today',
          lastRun: settings.lastRun,
          nextRunDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }
    }

    // 🔍 키워드 자동 리서치 (키워드 부족 시)
    const KEYWORD_THRESHOLD = 10; // 대기 키워드가 10개 미만이면 리서치
    const pendingCount = await keywordResearchService.getPendingKeywordsCount();

    console.log(`📊 대기 중인 키워드: ${pendingCount}개`);

    if (pendingCount < KEYWORD_THRESHOLD) {
      console.log(`⚠️  키워드 부족 (${pendingCount}개 < ${KEYWORD_THRESHOLD}개) - 자동 리서치 시작`);

      try {
        const targetCount = 30; // 30개 신규 키워드 추가
        const newKeywords = await keywordResearchService.researchKeywords(targetCount);
        const savedCount = await keywordResearchService.saveKeywordsToDB(newKeywords);

        console.log(`✅ 키워드 리서치 완료: ${savedCount}개 추가`);
        console.log(`📈 총 대기 키워드: ${pendingCount} → ${pendingCount + savedCount}개`);
      } catch (error) {
        console.error('❌ 키워드 리서치 실패:', error);
        // 리서치 실패해도 기존 키워드로 계속 진행
      }
    } else {
      console.log(`✅ 키워드 충분함 (${pendingCount}개) - 리서치 스킵`);
    }

    // 대기 중인 키워드 가져오기 (postsPerDay 설정만큼)
    const postsPerDay = settings.postsPerDay || 3; // 기본값 3개
    const pendingKeywords = await db.query(
      'SELECT * FROM content_keywords WHERE status = $1 ORDER BY priority DESC, created_at ASC LIMIT $2',
      ['pending', postsPerDay]
    );

    if (pendingKeywords.rows.length === 0) {
      console.log('✅ No pending keywords');
      return res.json({ message: 'No pending keywords', processed: 0 });
    }

    console.log(`📝 Processing ${pendingKeywords.rows.length} keywords...`);

    // 여러 키워드 순차 처리
    const results = [];
    for (const keyword of pendingKeywords.rows) {
      console.log(`  → Generating: "${keyword.keyword}"`);
      try {
        const result = await autoGenerateContent(keyword.id);
        results.push({
          keyword: keyword.keyword,
          success: result.success,
          tipId: result.tipId,
          slug: result.slug,
          error: result.error
        });
      } catch (error) {
        results.push({
          keyword: keyword.keyword,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // 마지막 실행 시간 업데이트 (데이터베이스에)
    settings.lastRun = now.toISOString();
    await db.query(
      `UPDATE app_settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'scheduler_settings'`,
      [JSON.stringify(settings)]
    );

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: successCount > 0,
      processed: results.length,
      successCount,
      failedCount: results.length - successCount,
      results,
      nextRunAt: new Date(now.getTime() + settings.interval * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('Scheduler run error:', error);
    res.status(500).json({ error: 'Scheduler execution failed' });
  }
});

// POST - 누락된 번역 추가
router.post("/add-missing-translations", async (req, res) => {
  try {
    const translationClient = new v2.Translate({
      key: process.env.GOOGLE_TRANSLATE_API_KEY || '',
    });

    const ALL_LANGUAGES = [
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

    console.log('🔄 Finding tips with missing translations...');

    // 모든 한국어 원본 tip 찾기
    const originals = await db.query(`
      SELECT id, title, content, excerpt, slug, category_id, thumbnail_url, seo_meta
      FROM tips
      WHERE original_tip_id IS NULL AND language = 'ko'
      ORDER BY created_at DESC
    `);

    console.log(`Found ${originals.rows.length} original tips`);

    const results = [];

    for (const original of originals.rows) {
      console.log(`\nProcessing: ${original.title}`);

      // 현재 존재하는 번역 찾기
      const existing = await db.query(`
        SELECT language
        FROM tips
        WHERE (original_tip_id = $1 OR id = $1) AND language != 'ko'
      `, [original.id]);

      const existingLanguages = existing.rows.map((r: any) => r.language);

      // 누락된 언어 찾기
      const missingLanguages = ALL_LANGUAGES.filter(lang => {
        const dbCode = lang.dbCode || lang.code;
        return !existingLanguages.includes(dbCode);
      });

      if (missingLanguages.length === 0) {
        console.log(`  ✅ All translations exist`);
        results.push({
          tipId: original.id,
          title: original.title,
          missing: 0,
          added: 0,
          status: 'complete'
        });
        continue;
      }

      console.log(`  Missing: ${missingLanguages.length} languages`);

      let successCount = 0;

      for (const lang of missingLanguages) {
        const langCode = lang.dbCode || lang.code;

        try {
          // 번역
          const [translatedTitle] = await translationClient.translate(original.title, lang.code);
          const [translatedExcerpt] = await translationClient.translate(original.excerpt, lang.code);
          const [translatedContent] = await translationClient.translate(original.content, lang.code);

          // 저장
          await db.query(`
            INSERT INTO tips (
              category_id, slug, title, content, excerpt, thumbnail_url,
              is_published, published_at, language, original_tip_id, seo_meta
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10)
          `, [
            original.category_id,
            original.slug,
            translatedTitle,
            translatedContent,
            translatedExcerpt,
            original.thumbnail_url,
            true,
            langCode,
            original.id,
            original.seo_meta
          ]);

          console.log(`    ✅ ${lang.name}`);
          successCount++;

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 250));

        } catch (error) {
          console.error(`    ❌ ${lang.name} failed:`, error instanceof Error ? error.message : String(error));
        }
      }

      results.push({
        tipId: original.id,
        title: original.title,
        missing: missingLanguages.length,
        added: successCount,
        status: successCount === missingLanguages.length ? 'success' : 'partial'
      });
    }

    console.log('\n🎉 Translation update complete!');

    res.json({
      success: true,
      message: 'Missing translations added',
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('Add translations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add missing translations',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
