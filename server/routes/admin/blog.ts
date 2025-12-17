import { Router } from "express";
import { db } from "../../storage/db.js";

const router = Router();

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
      title_ko,
      title_en,
      title_vi,
      title_th,
      content_ko,
      content_en,
      content_vi,
      content_th,
      excerpt_ko,
      excerpt_en,
      excerpt_vi,
      excerpt_th,
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
        title_ko, title_en, title_vi, title_th,
        content_ko, content_en, content_vi, content_th,
        excerpt_ko, excerpt_en, excerpt_vi, excerpt_th,
        slug, category, tags, featured_image, author, is_published, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        title_ko, title_en, title_vi, title_th,
        content_ko, content_en, content_vi, content_th,
        excerpt_ko, excerpt_en, excerpt_vi, excerpt_th,
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
      title_ko,
      title_en,
      title_vi,
      title_th,
      content_ko,
      content_en,
      content_vi,
      content_th,
      excerpt_ko,
      excerpt_en,
      excerpt_vi,
      excerpt_th,
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
        title_ko = $1, title_en = $2, title_vi = $3, title_th = $4,
        content_ko = $5, content_en = $6, content_vi = $7, content_th = $8,
        excerpt_ko = $9, excerpt_en = $10, excerpt_vi = $11, excerpt_th = $12,
        slug = $13, category = $14, tags = $15, featured_image = $16,
        is_published = $17, published_at = COALESCE($18, published_at),
        updated_at = NOW()
      WHERE id = $19
      RETURNING *`,
      [
        title_ko, title_en, title_vi, title_th,
        content_ko, content_en, content_vi, content_th,
        excerpt_ko, excerpt_en, excerpt_vi, excerpt_th,
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
