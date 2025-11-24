import { Router } from "express";
import { generateToken } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/token - 토큰 발급
router.post("/token", async (req, res) => {
  try {
    // 간단한 토큰 발급 (나중에 실제 인증 로직 추가 가능)
    // 현재는 요청하면 바로 토큰 발급
    const token = generateToken(
      { 
        type: "api_access",
        timestamp: Date.now() 
      },
      "30d" // 30일 유효
    );

    res.json({ token });
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({ message: "Failed to generate token" });
  }
});

export default router;

