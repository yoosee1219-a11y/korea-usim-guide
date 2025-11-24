import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getTips,
  getTipById,
  getTipBySlug,
  getTipCategories,
  incrementTipViewCount,
  type TipFilters,
} from "../services/tipService.js";

const router = Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(verifyToken);

// POST /api/tips/categories - 카테고리 목록 조회
router.post("/categories", async (req, res) => {
  try {
    const categories = await getTipCategories();
    res.json({ categories });
  } catch (error) {
    console.error("Error fetching tip categories:", error);
    res.status(500).json({ message: "Failed to fetch tip categories" });
  }
});

// POST /api/tips - 꿀팁 목록 조회 (페이지네이션 지원)
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    
    const filters: TipFilters = {};

    if (body.category_id) filters.category_id = body.category_id;
    if (body.page !== undefined) filters.page = Number(body.page);
    if (body.limit !== undefined) filters.limit = Number(body.limit);
    if (body.is_published !== undefined) filters.is_published = Boolean(body.is_published);

    const result = await getTips(filters);
    res.json(result);
  } catch (error) {
    console.error("Error fetching tips:", error);
    res.status(500).json({ message: "Failed to fetch tips" });
  }
});

// POST /api/tips/slug/:slug - 슬러그로 꿀팁 상세 조회
router.post("/slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const tip = await getTipBySlug(slug);

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

