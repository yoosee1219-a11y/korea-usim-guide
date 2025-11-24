import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { getAllCarriers, getCarrierById } from "../services/carrierService.js";

const router = Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(verifyToken);

// POST /api/carriers - 통신사 목록 조회
router.post("/", async (req, res) => {
  try {
    const carriers = await getAllCarriers();
    res.json({ carriers });
  } catch (error) {
    console.error("Error fetching carriers:", error);
    res.status(500).json({ message: "Failed to fetch carriers" });
  }
});

// POST /api/carriers/:id - 특정 통신사 조회
router.post("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const carrier = await getCarrierById(id);

    if (!carrier) {
      return res.status(404).json({ message: "Carrier not found" });
    }

    res.json({ carrier });
  } catch (error) {
    console.error("Error fetching carrier:", error);
    res.status(500).json({ message: "Failed to fetch carrier" });
  }
});

export default router;

