import { Router } from "express";
import { db } from "../../storage/db.js";
import { requireAdminAuth } from "../../middleware/adminAuth.js";

const router = Router();

// 모든 라우트에 관리자 인증 미들웨어 적용
router.use(requireAdminAuth);

// GET - 모든 키워드 조회
router.get("/", async (req, res) => {
  try {
    const { status, priority } = req.query;

    let query = 'SELECT * FROM content_keywords';
    const params: any[] = [];
    const conditions: string[] = [];

    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (priority) {
      conditions.push(`priority = $${params.length + 1}`);
      params.push(priority);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY CASE priority WHEN \'high\' THEN 1 WHEN \'medium\' THEN 2 WHEN \'low\' THEN 3 END, created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Keywords fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch keywords' });
  }
});

// GET - 단일 키워드 조회
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM content_keywords WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Keyword not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Keyword fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch keyword' });
  }
});

// POST - 새 키워드 추가
router.post("/", async (req, res) => {
  try {
    const {
      keyword,
      search_intent,
      cpc_krw,
      priority,
      related_keywords
    } = req.body;

    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    const result = await db.query(
      `INSERT INTO content_keywords (
        keyword, search_intent, cpc_krw, priority, related_keywords
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        keyword,
        search_intent || '',
        cpc_krw || 0,
        priority || 'medium',
        JSON.stringify(related_keywords || [])
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Keyword create error:', error);
    res.status(500).json({ error: 'Failed to create keyword' });
  }
});

// POST - 벌크 키워드 추가
router.post("/bulk", async (req, res) => {
  try {
    const { keywords } = req.body;

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: 'Invalid keywords array' });
    }

    const insertedKeywords = [];

    for (const kw of keywords) {
      const result = await db.query(
        `INSERT INTO content_keywords (
          keyword, search_intent, cpc_krw, priority, related_keywords
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
          kw.keyword,
          kw.search_intent || '',
          kw.cpc_krw || 0,
          kw.priority || 'medium',
          JSON.stringify(kw.related_keywords || [])
        ]
      );
      insertedKeywords.push(result.rows[0]);
    }

    res.status(201).json({
      count: insertedKeywords.length,
      keywords: insertedKeywords
    });
  } catch (error) {
    console.error('Bulk keyword create error:', error);
    res.status(500).json({ error: 'Failed to create keywords' });
  }
});

// PUT - 키워드 수정
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      keyword,
      search_intent,
      cpc_krw,
      priority,
      related_keywords,
      status
    } = req.body;

    const result = await db.query(
      `UPDATE content_keywords SET
        keyword = $1,
        search_intent = $2,
        cpc_krw = $3,
        priority = $4,
        related_keywords = $5,
        status = $6
      WHERE id = $7
      RETURNING *`,
      [
        keyword,
        search_intent,
        cpc_krw,
        priority,
        JSON.stringify(related_keywords),
        status,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Keyword not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Keyword update error:', error);
    res.status(500).json({ error: 'Failed to update keyword' });
  }
});

// DELETE - 키워드 삭제
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM content_keywords WHERE id = $1', [id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Keyword delete error:', error);
    res.status(500).json({ error: 'Failed to delete keyword' });
  }
});

// GET - 통계
router.get("/stats/summary", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        status,
        priority,
        COUNT(*) as count
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

    res.json(result.rows);
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
