import { Router } from "express";
import { db } from "../../storage/db.js";
import { requireAdminAuth } from "../../middleware/adminAuth.js";
import { planScraperService } from "../../services/plan-scraper.js";

const router = Router();

// 모든 라우트에 관리자 인증 미들웨어 적용
router.use(requireAdminAuth);

// POST - 스크래핑 실행
router.post("/scrape", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`🔍 Scraping plans from: ${url}`);

    // 스크래핑 실행
    const plans = await planScraperService.scrapePlans(url);

    console.log(`✅ Scraped ${plans.length} plans`);

    res.json({
      success: true,
      plans,
      count: plans.length
    });

  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({
      error: 'Scraping failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST - DB 적용 (기존 삭제 + 새 데이터 삽입)
router.post("/apply", async (req, res) => {
  try {
    const { plans } = req.body;

    if (!Array.isArray(plans) || plans.length === 0) {
      return res.status(400).json({ error: 'Plans array is required' });
    }

    console.log(`💾 Applying ${plans.length} plans to database...`);

    // 트랜잭션 시작
    await db.query('BEGIN');

    try {
      // 1. 기존 요금제 모두 삭제
      const deleteResult = await db.query('DELETE FROM plans');
      const deletedCount = deleteResult.rowCount || 0;

      console.log(`🗑️ Deleted ${deletedCount} existing plans`);

      // 2. 새 요금제 삽입
      let insertedCount = 0;

      for (const plan of plans) {
        await db.query(
          `INSERT INTO plans (
            name,
            description,
            price,
            data,
            voice_minutes,
            sms_count,
            features,
            is_active,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
          [
            plan.name,
            `${plan.data} 데이터 / ${plan.voice} 통화 / ${plan.sms} 문자`,
            plan.price,
            plan.data,
            plan.voice,
            plan.sms,
            JSON.stringify(plan.features || []),
            true
          ]
        );
        insertedCount++;
      }

      // 커밋
      await db.query('COMMIT');

      console.log(`✅ Inserted ${insertedCount} new plans`);

      res.json({
        success: true,
        deleted: deletedCount,
        inserted: insertedCount,
        message: `${deletedCount}개 삭제, ${insertedCount}개 삽입 완료`
      });

    } catch (error) {
      // 롤백
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({
      error: 'Failed to apply plans',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
