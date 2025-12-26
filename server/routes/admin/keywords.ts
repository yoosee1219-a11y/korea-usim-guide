import { Router } from "express";
import { db } from "../../storage/db.js";
import { requireAdminAuth } from "../../middleware/adminAuth.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

// POST - 벌크 키워드 추가 (간소화 버전 - 키워드 문자열 배열)
router.post("/bulk", async (req, res) => {
  try {
    const { keywords, priority = 'medium' } = req.body;

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: 'Invalid keywords array' });
    }

    let created = 0;
    let skipped = 0;

    for (const keyword of keywords) {
      const trimmedKeyword = typeof keyword === 'string' ? keyword.trim() : (keyword.keyword || '');

      if (!trimmedKeyword) {
        skipped++;
        continue;
      }

      // 중복 체크
      const existingCheck = await db.query(
        'SELECT id FROM content_keywords WHERE keyword = $1',
        [trimmedKeyword]
      );

      if (existingCheck.rows.length > 0) {
        skipped++;
        continue;
      }

      // 단순 키워드 삽입 (문자열 배열 형태)
      await db.query(
        `INSERT INTO content_keywords (
          keyword, search_intent, cpc_krw, priority, related_keywords
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          trimmedKeyword,
          '', // search_intent (나중에 AI로 추론 가능)
          0,  // cpc_krw (나중에 설정 가능)
          priority,
          JSON.stringify([])
        ]
      );

      created++;
    }

    res.status(201).json({
      created,
      skipped,
      total: keywords.length
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

// POST - AI 자동 키워드 생성
router.post("/auto-generate", async (req, res) => {
  try {
    const { count = 10, priority = 'medium' } = req.body;

    if (count < 1 || count > 100) {
      return res.status(400).json({ error: 'Count must be between 1 and 100' });
    }

    console.log(`🤖 Generating ${count} keywords using Gemini AI...`);

    // Gemini API 초기화
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2048,
      }
    });

    const prompt = `당신은 한국 여행 및 통신 서비스 SEO 전문가입니다.

한국에 방문하는 외국인들이 검색할 만한 유심/eSIM 관련 키워드를 ${count}개 생성해주세요.

**요구사항:**
- 실제로 외국인이 검색할 법한 자연스러운 키워드
- 롱테일 키워드 포함 (예: "한국 외국인 선불 유심 인천공항")
- 정보성 키워드 (How-to, 가이드, 비교 등)
- 중복 없이 ${count}개
- 각 키워드는 10자 이상

**카테고리 참고:**
- 유심/eSIM 구매/개통 방법
- 통신사 비교 (SK/KT/LG)
- 외국인등록 관련
- 공항/편의점 유심
- 요금제 추천
- 문제 해결 (개통 안됨, 비밀번호 등)

**출력 형식:**
키워드만 한 줄에 하나씩 출력하세요. 번호나 기호 없이 키워드만 작성하세요.

예시:
한국 외국인 유심 카드 개통 방법
인천공항 유심 구매 가격 비교
외국인등록증 없이 유심 개통
LG 유플러스 외국인 선불 요금제
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // 키워드 파싱
    const generatedKeywords = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^[\d\.\-\*#]+\s/)) // 번호나 기호 제거
      .slice(0, count); // 요청한 개수만큼

    console.log(`✅ Generated ${generatedKeywords.length} keywords`);

    let created = 0;
    let skipped = 0;

    for (const keyword of generatedKeywords) {
      // 중복 체크
      const existingCheck = await db.query(
        'SELECT id FROM content_keywords WHERE keyword = $1',
        [keyword]
      );

      if (existingCheck.rows.length > 0) {
        skipped++;
        continue;
      }

      // 키워드 삽입
      await db.query(
        `INSERT INTO content_keywords (
          keyword, search_intent, cpc_krw, priority, related_keywords
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          keyword,
          '', // AI가 생성한 키워드는 search_intent 비움
          0,
          priority,
          JSON.stringify([])
        ]
      );

      created++;
    }

    console.log(`📊 Created: ${created}, Skipped (duplicates): ${skipped}`);

    res.status(201).json({
      created,
      skipped,
      total: generatedKeywords.length,
      keywords: generatedKeywords
    });
  } catch (error) {
    console.error('Auto-generate error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to auto-generate keywords',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
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
