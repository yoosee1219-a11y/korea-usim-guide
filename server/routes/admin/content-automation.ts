import { Router } from "express";
import { db } from "../../storage/db.js";
import { requireAdminAuth } from "../../middleware/adminAuth.js";
import { autoGenerateContent } from "../../../automation/workflows/content-automation.js";

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
    console.error('Content generation error:', error);
    res.status(500).json({ error: 'Failed to start content generation' });
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
    console.error('Batch generation error:', error);
    res.status(500).json({ error: 'Failed to generate batch content' });
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
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
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
    console.error('Logs fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
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
    console.error('Retry error:', error);
    res.status(500).json({ error: 'Failed to retry' });
  }
});

export default router;
