import { Router } from "express";
import {
  getTips,
  getTipById,
  getTipBySlug,
  getTipCategories,
  incrementTipViewCount,
  type TipFilters,
} from "../services/tipService.js";

const router = Router();

// 공개 API - 인증 불필요
// (모든 사용자가 팁을 볼 수 있어야 함)

// POST /api/tips/categories - 카테고리 목록 조회
router.post("/categories", async (req, res) => {
  try {
    const categories = await getTipCategories();
    res.json({ categories });
  } catch (error) {
    console.error("Error fetching tip categories:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
    });
    res.status(500).json({ 
      message: "Failed to fetch tip categories",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined
    });
  }
});

// POST /api/tips - 꿀팁 목록 조회 (페이지네이션 지원)
router.post("/", async (req, res) => {
  const body = req.body || {};
  const filters: TipFilters = {};

  try {
    if (body.category_id) filters.category_id = body.category_id;
    if (body.page !== undefined) filters.page = Number(body.page);
    if (body.limit !== undefined) filters.limit = Number(body.limit);
    if (body.is_published !== undefined) filters.is_published = Boolean(body.is_published);
    if (body.language) filters.language = body.language;

    console.log('🔍 [DEBUG] /api/tips - Received request:', { body, filters });

    const result = await getTips(filters);

    console.log('✅ [DEBUG] /api/tips - Query result:', {
      count: result.tips.length,
      languages: Array.from(new Set(result.tips.map(t => t.language)))
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching tips:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      filters,
      body,
    });
    res.status(500).json({
      message: "Failed to fetch tips",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined
    });
  }
});

// POST /api/tips/slug/:slug - 슬러그로 꿀팁 상세 조회
router.post("/slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const body = req.body || {};
    const language = body.language || 'ko';

    console.log('🔍 [DEBUG] /api/tips/slug/:slug - Received request:', { slug, body, language });

    const tip = await getTipBySlug(slug, language);

    console.log('✅ [DEBUG] /api/tips/slug/:slug - Query result:', tip ? {
      id: tip.id,
      language: tip.language,
      title: tip.title.substring(0, 50)
    } : null);

    if (!tip) {
      return res.status(404).json({ message: "Tip not found" });
    }

    // 조회수 증가 (비동기, 에러 무시)
    incrementTipViewCount(tip.id).catch((error) => {
      console.error("Error incrementing view count:", error);
    });

    res.json({ tip });
  } catch (error) {
    console.error("Error fetching tip:", error);
    res.status(500).json({ message: "Failed to fetch tip" });
  }
});

// POST /api/tips/:id - 꿀팁 상세 조회 (ID로)
router.post("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const tip = await getTipById(id);

    if (!tip) {
      return res.status(404).json({ message: "Tip not found" });
    }

    // 조회수 증가 (비동기, 에러 무시)
    incrementTipViewCount(id).catch((error) => {
      console.error("Error incrementing view count:", error);
    });

    res.json({ tip });
  } catch (error) {
    console.error("Error fetching tip:", error);
    res.status(500).json({ message: "Failed to fetch tip" });
  }
});

export default router;

