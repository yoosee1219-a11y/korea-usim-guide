import { Router } from "express";
import { db } from "../../storage/db.js";
import { requireAdminAuth, blockDemoWrites } from "../../middleware/adminAuth.js";

const router = Router();

// 모든 라우트에 관리자 인증 + 데모 쓰기 차단 미들웨어 적용
router.use(requireAdminAuth);
router.use(blockDemoWrites);

// GET - Get all tips (admin)
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, tc.name as category_name
       FROM tips t
       LEFT JOIN tip_categories tc ON t.category_id = tc.id
       ORDER BY t.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Tips fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch tips' });
  }
});

// GET - Get single tip by ID or slug (with all language versions combined)
router.get("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;

    // Try to fetch by ID first, then by slug
    let result = await db.query(
      'SELECT * FROM tips WHERE id = $1',
      [identifier]
    );

    if (result.rows.length === 0) {
      result = await db.query(
        'SELECT * FROM tips WHERE slug = $1',
        [identifier]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tip not found' });
    }

    // Get the original tip ID
    const firstTip = result.rows[0];
    const originalTipId = firstTip.original_tip_id || firstTip.id;

    // Fetch all language versions
    const allLanguages = await db.query(
      'SELECT * FROM tips WHERE id = $1 OR original_tip_id = $1 ORDER BY language',
      [originalTipId]
    );

    // Combine all language versions into a single object
    const combined: any = {
      id: originalTipId,
      slug: firstTip.slug,
      category: firstTip.category_id,
      featured_image: firstTip.thumbnail_url,
      is_published: firstTip.is_published,
      published_at: firstTip.published_at,
      created_at: firstTip.created_at,
      updated_at: firstTip.updated_at,
    };

    // Map each language version to the appropriate fields
    allLanguages.rows.forEach(tip => {
      const langSuffix = tip.language === 'zh' ? 'zh' : tip.language;
      combined[`title_${langSuffix}`] = tip.title;
      combined[`content_${langSuffix}`] = tip.content;
      combined[`excerpt_${langSuffix}`] = tip.excerpt;
    });

    res.json(combined);
  } catch (error) {
    console.error('Tip fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch tip' });
  }
});

// POST - Create new tip (with all language versions)
router.post("/", async (req, res) => {
  try {
    const {
      title_ko, title_en, title_vi, title_th, title_tl, title_uz, title_ne, title_mn, title_id, title_my, title_zh, title_ru,
      content_ko, content_en, content_vi, content_th, content_tl, content_uz, content_ne, content_mn, content_id, content_my, content_zh, content_ru,
      excerpt_ko, excerpt_en, excerpt_vi, excerpt_th, excerpt_tl, excerpt_uz, excerpt_ne, excerpt_mn, excerpt_id, excerpt_my, excerpt_zh, excerpt_ru,
      slug,
      category,
      featured_image,
      is_published
    } = req.body;

    const published_at = is_published ? new Date() : null;

    // First, insert the Korean original
    const originalResult = await db.query(
      `INSERT INTO tips (
        category_id, slug, title, content, excerpt, thumbnail_url, is_published, published_at, language
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [category, slug, title_ko, content_ko, excerpt_ko, featured_image, is_published || false, published_at, 'ko']
    );

    const originalTipId = originalResult.rows[0].id;

    // Then insert all translations with reference to the original
    const languages = [
      { code: 'en', title: title_en, content: content_en, excerpt: excerpt_en },
      { code: 'vi', title: title_vi, content: content_vi, excerpt: excerpt_vi },
      { code: 'th', title: title_th, content: content_th, excerpt: excerpt_th },
      { code: 'tl', title: title_tl, content: content_tl, excerpt: excerpt_tl },
      { code: 'uz', title: title_uz, content: content_uz, excerpt: excerpt_uz },
      { code: 'ne', title: title_ne, content: content_ne, excerpt: excerpt_ne },
      { code: 'mn', title: title_mn, content: content_mn, excerpt: excerpt_mn },
      { code: 'id', title: title_id, content: content_id, excerpt: excerpt_id },
      { code: 'my', title: title_my, content: content_my, excerpt: excerpt_my },
      { code: 'zh', title: title_zh, content: content_zh, excerpt: excerpt_zh },
      { code: 'ru', title: title_ru, content: content_ru, excerpt: excerpt_ru },
    ];

    for (const lang of languages) {
      if (lang.title || lang.content) {
        await db.query(
          `INSERT INTO tips (
            category_id, slug, title, content, excerpt, thumbnail_url,
            is_published, published_at, language, original_tip_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            category, slug, lang.title || '', lang.content || '', lang.excerpt || '',
            featured_image, is_published || false, published_at, lang.code, originalTipId
          ]
        );
      }
    }

    res.status(201).json(originalResult.rows[0]);
  } catch (error) {
    console.error('Tip create error:', error);
    res.status(500).json({ error: 'Failed to create tip' });
  }
});

// PUT - Update tip (all language versions)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title_ko, title_en, title_vi, title_th, title_tl, title_uz, title_ne, title_mn, title_id, title_my, title_zh, title_ru,
      content_ko, content_en, content_vi, content_th, content_tl, content_uz, content_ne, content_mn, content_id, content_my, content_zh, content_ru,
      excerpt_ko, excerpt_en, excerpt_vi, excerpt_th, excerpt_tl, excerpt_uz, excerpt_ne, excerpt_mn, excerpt_id, excerpt_my, excerpt_zh, excerpt_ru,
      slug,
      category,
      featured_image,
      is_published
    } = req.body;

    // First, find the original tip to get the original_tip_id
    const tipCheck = await db.query('SELECT * FROM tips WHERE id = $1 LIMIT 1', [id]);

    if (tipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Tip not found' });
    }

    const currentTip = tipCheck.rows[0];
    const originalTipId = currentTip.original_tip_id || currentTip.id;

    // Set published_at if is_published is being set to true
    const published_at = is_published && !currentTip.published_at ? new Date() : currentTip.published_at;

    // Update Korean original
    const koResult = await db.query(
      `UPDATE tips SET
        category_id = $1, slug = $2, title = $3, content = $4, excerpt = $5,
        thumbnail_url = $6, is_published = $7, published_at = $8, updated_at = NOW()
      WHERE (id = $9 AND language = 'ko') OR (original_tip_id = $9 AND language = 'ko')
      RETURNING *`,
      [category, slug, title_ko, content_ko, excerpt_ko, featured_image, is_published || false, published_at, originalTipId]
    );

    // Update all translations
    const languageUpdates = [
      { code: 'en', title: title_en, content: content_en, excerpt: excerpt_en },
      { code: 'vi', title: title_vi, content: content_vi, excerpt: excerpt_vi },
      { code: 'th', title: title_th, content: content_th, excerpt: excerpt_th },
      { code: 'tl', title: title_tl, content: content_tl, excerpt: excerpt_tl },
      { code: 'uz', title: title_uz, content: content_uz, excerpt: excerpt_uz },
      { code: 'ne', title: title_ne, content: content_ne, excerpt: excerpt_ne },
      { code: 'mn', title: title_mn, content: content_mn, excerpt: excerpt_mn },
      { code: 'id', title: title_id, content: content_id, excerpt: excerpt_id },
      { code: 'my', title: title_my, content: content_my, excerpt: excerpt_my },
      { code: 'zh', title: title_zh, content: content_zh, excerpt: excerpt_zh },
      { code: 'ru', title: title_ru, content: content_ru, excerpt: excerpt_ru },
    ];

    for (const lang of languageUpdates) {
      // Check if this language version exists
      const exists = await db.query(
        'SELECT id FROM tips WHERE original_tip_id = $1 AND language = $2 LIMIT 1',
        [originalTipId, lang.code]
      );

      if (exists.rows.length > 0) {
        // Update existing
        await db.query(
          `UPDATE tips SET
            category_id = $1, slug = $2, title = $3, content = $4, excerpt = $5,
            thumbnail_url = $6, is_published = $7, published_at = $8, updated_at = NOW()
          WHERE id = $9`,
          [category, slug, lang.title || '', lang.content || '', lang.excerpt || '', featured_image, is_published || false, published_at, exists.rows[0].id]
        );
      } else if (lang.title || lang.content) {
        // Create new translation if it doesn't exist
        await db.query(
          `INSERT INTO tips (
            category_id, slug, title, content, excerpt, thumbnail_url,
            is_published, published_at, language, original_tip_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [category, slug, lang.title || '', lang.content || '', lang.excerpt || '', featured_image, is_published || false, published_at, lang.code, originalTipId]
        );
      }
    }

    res.json(koResult.rows[0] || currentTip);
  } catch (error) {
    console.error('Tip update error:', error);
    res.status(500).json({ error: 'Failed to update tip' });
  }
});

// DELETE - Delete tip (all language versions)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // First, find the original tip ID
    const tipCheck = await db.query('SELECT * FROM tips WHERE id = $1 LIMIT 1', [id]);

    if (tipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Tip not found' });
    }

    const currentTip = tipCheck.rows[0];
    const originalTipId = currentTip.original_tip_id || currentTip.id;

    // Delete all language versions (including translations and original)
    await db.query(
      'DELETE FROM tips WHERE id = $1 OR original_tip_id = $1',
      [originalTipId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Tip delete error:', error);
    res.status(500).json({ error: 'Failed to delete tip' });
  }
});

export default router;
