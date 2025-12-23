import { Router } from "express";
import { db } from "../../storage/db.js";
import { requireAdminAuth } from "../../middleware/adminAuth.js";

const router = Router();

// 모든 라우트에 관리자 인증 미들웨어 적용
router.use(requireAdminAuth);

// GET - Get all blog posts (admin)
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM blog_posts ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Blog fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET - Get single blog post by ID or slug
router.get("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;

    // Try to fetch by ID first, then by slug
    let result = await db.query(
      'SELECT * FROM blog_posts WHERE id = $1 LIMIT 1',
      [identifier]
    );

    if (result.rows.length === 0) {
      result = await db.query(
        'SELECT * FROM blog_posts WHERE slug = $1 LIMIT 1',
        [identifier]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Blog fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST - Create new blog post
router.post("/", async (req, res) => {
  try {
    const {
      title_ko, title_en, title_vi, title_th, title_tl, title_uz, title_ne, title_mn, title_id, title_my, title_zh, title_ru,
      content_ko, content_en, content_vi, content_th, content_tl, content_uz, content_ne, content_mn, content_id, content_my, content_zh, content_ru,
      excerpt_ko, excerpt_en, excerpt_vi, excerpt_th, excerpt_tl, excerpt_uz, excerpt_ne, excerpt_mn, excerpt_id, excerpt_my, excerpt_zh, excerpt_ru,
      slug,
      category,
      tags,
      featured_image,
      author,
      is_published
    } = req.body;

    const published_at = is_published ? new Date() : null;

    const result = await db.query(
      `INSERT INTO blog_posts (
        title_ko, title_en, title_vi, title_th, title_tl, title_uz, title_ne, title_mn, title_id, title_my, title_zh, title_ru,
        content_ko, content_en, content_vi, content_th, content_tl, content_uz, content_ne, content_mn, content_id, content_my, content_zh, content_ru,
        excerpt_ko, excerpt_en, excerpt_vi, excerpt_th, excerpt_tl, excerpt_uz, excerpt_ne, excerpt_mn, excerpt_id, excerpt_my, excerpt_zh, excerpt_ru,
        slug, category, tags, featured_image, author, is_published, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43)
      RETURNING *`,
      [
        title_ko, title_en, title_vi, title_th, title_tl, title_uz, title_ne, title_mn, title_id, title_my, title_zh, title_ru,
        content_ko, content_en, content_vi, content_th, content_tl, content_uz, content_ne, content_mn, content_id, content_my, content_zh, content_ru,
        excerpt_ko, excerpt_en, excerpt_vi, excerpt_th, excerpt_tl, excerpt_uz, excerpt_ne, excerpt_mn, excerpt_id, excerpt_my, excerpt_zh, excerpt_ru,
        slug, category, JSON.stringify(tags || []), featured_image,
        author || 'Admin', is_published || false, published_at
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Blog create error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// PUT - Update blog post
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title_ko, title_en, title_vi, title_th, title_tl, title_uz, title_ne, title_mn, title_id, title_my, title_zh, title_ru,
      content_ko, content_en, content_vi, content_th, content_tl, content_uz, content_ne, content_mn, content_id, content_my, content_zh, content_ru,
      excerpt_ko, excerpt_en, excerpt_vi, excerpt_th, excerpt_tl, excerpt_uz, excerpt_ne, excerpt_mn, excerpt_id, excerpt_my, excerpt_zh, excerpt_ru,
      slug,
      category,
      tags,
      featured_image,
      is_published
    } = req.body;

    // Set published_at if is_published is being set to true
    const published_at = is_published && !req.body.published_at ? new Date() : undefined;

    const result = await db.query(
      `UPDATE blog_posts SET
        title_ko = $1, title_en = $2, title_vi = $3, title_th = $4, title_tl = $5, title_uz = $6, title_ne = $7, title_mn = $8, title_id = $9, title_my = $10, title_zh = $11, title_ru = $12,
        content_ko = $13, content_en = $14, content_vi = $15, content_th = $16, content_tl = $17, content_uz = $18, content_ne = $19, content_mn = $20, content_id = $21, content_my = $22, content_zh = $23, content_ru = $24,
        excerpt_ko = $25, excerpt_en = $26, excerpt_vi = $27, excerpt_th = $28, excerpt_tl = $29, excerpt_uz = $30, excerpt_ne = $31, excerpt_mn = $32, excerpt_id = $33, excerpt_my = $34, excerpt_zh = $35, excerpt_ru = $36,
        slug = $37, category = $38, tags = $39, featured_image = $40,
        is_published = $41, published_at = COALESCE($42, published_at),
        updated_at = NOW()
      WHERE id = $43
      RETURNING *`,
      [
        title_ko, title_en, title_vi, title_th, title_tl, title_uz, title_ne, title_mn, title_id, title_my, title_zh, title_ru,
        content_ko, content_en, content_vi, content_th, content_tl, content_uz, content_ne, content_mn, content_id, content_my, content_zh, content_ru,
        excerpt_ko, excerpt_en, excerpt_vi, excerpt_th, excerpt_tl, excerpt_uz, excerpt_ne, excerpt_mn, excerpt_id, excerpt_my, excerpt_zh, excerpt_ru,
        slug, category, JSON.stringify(tags || []), featured_image,
        is_published, published_at, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Blog update error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// DELETE - Delete blog post
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM blog_posts WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Blog delete error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;
