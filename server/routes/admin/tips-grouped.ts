import { Router } from "express";
import { db } from "../../storage/db.js";
import { requireAdminAuth } from "../../middleware/adminAuth.js";

const router = Router();

// 모든 라우트에 관리자 인증 미들웨어 적용
router.use(requireAdminAuth);

// GET - 그룹화된 Tips 목록 (원본 + 번역본들)
router.get("/", async (req, res) => {
  try {
    // 1. 한국어 원본만 조회
    const originals = await db.query(`
      SELECT
        t.*,
        tc.name as category_name,
        (
          SELECT COUNT(*) - 1
          FROM tips
          WHERE original_tip_id = t.id OR id = t.id
        ) as translation_count
      FROM tips t
      LEFT JOIN tip_categories tc ON t.category_id = tc.id
      WHERE t.language = 'ko' AND t.original_tip_id IS NULL
      ORDER BY t.created_at DESC
    `);

    // 2. 각 원본의 번역본들 조회
    const grouped = await Promise.all(
      originals.rows.map(async (original) => {
        const translations = await db.query(`
          SELECT
            id,
            language,
            title,
            is_published,
            updated_at
          FROM tips
          WHERE original_tip_id = $1
          ORDER BY
            CASE language
              WHEN 'en' THEN 1
              WHEN 'vi' THEN 2
              WHEN 'th' THEN 3
              WHEN 'tl' THEN 4
              WHEN 'uz' THEN 5
              WHEN 'ne' THEN 6
              WHEN 'mn' THEN 7
              WHEN 'id' THEN 8
              WHEN 'my' THEN 9
              WHEN 'zh' THEN 10
              WHEN 'ru' THEN 11
            END
        `, [original.id]);

        return {
          id: original.id,
          original: {
            id: original.id,
            slug: original.slug,
            title: original.title,
            category: original.category_id,
            category_name: original.category_name,
            is_published: original.is_published,
            published_at: original.published_at,
            created_at: original.created_at,
            updated_at: original.updated_at,
            view_count: original.view_count,
            language: 'ko'
          },
          translations: translations.rows,
          total_languages: translations.rows.length + 1, // +1 for Korean
          all_published: original.is_published && translations.rows.every(t => t.is_published)
        };
      })
    );

    res.json(grouped);
  } catch (error) {
    console.error('Grouped tips fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch grouped tips' });
  }
});

// DELETE - 일괄 삭제 (선택한 원본들과 번역본들 모두 삭제)
router.post("/bulk-delete", async (req, res) => {
  try {
    const { tipIds } = req.body; // 원본 tip ID 배열

    if (!Array.isArray(tipIds) || tipIds.length === 0) {
      return res.status(400).json({ error: 'Invalid tipIds array' });
    }

    // 트랜잭션으로 일괄 삭제
    await db.query('BEGIN');

    for (const tipId of tipIds) {
      // 원본과 번역본 모두 삭제
      await db.query(
        'DELETE FROM tips WHERE id = $1 OR original_tip_id = $1',
        [tipId]
      );
    }

    await db.query('COMMIT');

    res.json({
      success: true,
      deleted: tipIds.length,
      message: `${tipIds.length}개 콘텐츠 및 번역본 삭제 완료`
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to delete tips' });
  }
});

// PUT - 일괄 발행/비발행
router.post("/bulk-publish", async (req, res) => {
  try {
    const { tipIds, is_published } = req.body;

    if (!Array.isArray(tipIds) || tipIds.length === 0) {
      return res.status(400).json({ error: 'Invalid tipIds array' });
    }

    await db.query('BEGIN');

    for (const tipId of tipIds) {
      // 원본과 번역본 모두 업데이트
      await db.query(
        `UPDATE tips SET
          is_published = $1,
          published_at = CASE WHEN $1 THEN NOW() ELSE NULL END
        WHERE id = $2 OR original_tip_id = $2`,
        [is_published, tipId]
      );
    }

    await db.query('COMMIT');

    res.json({
      success: true,
      updated: tipIds.length,
      message: `${tipIds.length}개 콘텐츠 ${is_published ? '발행' : '비발행'} 완료`
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Bulk publish error:', error);
    res.status(500).json({ error: 'Failed to update tips' });
  }
});

export default router;
