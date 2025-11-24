import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { getPlans, getPlanById, comparePlans, type PlanFilters } from "../services/planService.js";

const router = Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(verifyToken);

// POST /api/plans - 요금제 목록 조회 (필터링 지원)
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    
    const filters: PlanFilters = {};

    if (body.carrier_id) filters.carrier_id = body.carrier_id;
    if (body.dataMin !== undefined) filters.dataMin = Number(body.dataMin);
    if (body.dataMax !== undefined) filters.dataMax = Number(body.dataMax);
    if (body.priceMin !== undefined) filters.priceMin = Number(body.priceMin);
    if (body.priceMax !== undefined) filters.priceMax = Number(body.priceMax);
    if (body.plan_type) filters.plan_type = body.plan_type;
    if (body.airport_pickup !== undefined) filters.airport_pickup = Boolean(body.airport_pickup);
    if (body.esim_support !== undefined) filters.eSIM_support = Boolean(body.esim_support);
    if (body.is_popular !== undefined) filters.is_popular = Boolean(body.is_popular);

    const plans = await getPlans(filters);
    res.json({ plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ message: "Failed to fetch plans" });
  }
});

// POST /api/plans/compare - 요금제 비교
router.post("/compare", async (req, res) => {
  try {
    const { plan_ids } = req.body || {};

    if (!plan_ids || !Array.isArray(plan_ids) || plan_ids.length === 0) {
      return res.status(400).json({ message: "plan_ids array is required" });
    }

    const plans = await comparePlans(plan_ids);
    res.json({ plans });
  } catch (error) {
    console.error("Error comparing plans:", error);
    res.status(500).json({ message: "Failed to compare plans" });
  }
});

// POST /api/plans/:id - 요금제 상세 조회
router.post("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await getPlanById(id);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json({ plan });
  } catch (error) {
    console.error("Error fetching plan:", error);
    res.status(500).json({ message: "Failed to fetch plan" });
  }
});

export default router;

