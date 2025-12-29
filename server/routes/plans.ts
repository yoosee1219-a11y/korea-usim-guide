import { Router } from "express";
import { getPlans, getPlanById, comparePlans, type PlanFilters } from "../services/planService.js";
import { handleApiError, handleSuccess } from "../utils/errorHandler.js";

const router = Router();

// 공개 API - 인증 불필요
// (모든 사용자가 요금제를 볼 수 있어야 함)

// POST /api/plans - 요금제 목록 조회 (필터링 지원)
router.post("/", async (req, res) => {
  const body = req.body || {};
  const filters: PlanFilters = {};

  try {
    if (body.carrier_id) filters.carrier_id = body.carrier_id;
    if (body.dataMin !== undefined) filters.dataMin = Number(body.dataMin);
    if (body.dataMax !== undefined) filters.dataMax = Number(body.dataMax);
    if (body.priceMin !== undefined) filters.priceMin = Number(body.priceMin);
    if (body.priceMax !== undefined) filters.priceMax = Number(body.priceMax);
    if (body.plan_type) filters.plan_type = body.plan_type;
    if (body.payment_type) filters.payment_type = body.payment_type;
    if (body.airport_pickup !== undefined) filters.airport_pickup = Boolean(body.airport_pickup);
    if (body.esim_support !== undefined) filters.esim_support = Boolean(body.esim_support);
    if (body.is_popular !== undefined) filters.is_popular = Boolean(body.is_popular);
    if (body.lang) filters.lang = body.lang; // Add language parameter

    const plans = await getPlans(filters);
    handleSuccess(res, { plans });
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch plans');
  }
});

// POST /api/plans/compare - 요금제 비교
router.post("/compare", async (req, res) => {
  try {
    const { plan_ids, lang } = req.body || {};

    if (!plan_ids || !Array.isArray(plan_ids) || plan_ids.length === 0) {
      return res.status(400).json({ success: false, error: "plan_ids array is required" });
    }

    const plans = await comparePlans(plan_ids, lang);
    handleSuccess(res, { plans });
  } catch (error) {
    handleApiError(res, error, 'Failed to compare plans');
  }
});

// POST /api/plans/:id - 요금제 상세 조회
router.post("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { lang } = req.body || {};
    const plan = await getPlanById(id, lang);

    if (!plan) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }

    handleSuccess(res, { plan });
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch plan');
  }
});

export default router;

