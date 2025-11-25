import { Router } from "express";
import { generateSitemapXml } from "../services/sitemapService.js";

const router = Router();

// GET /sitemap.xml - 동적 Sitemap 생성
// 인증 불필요 (검색 엔진 크롤러용)
router.get("/sitemap.xml", async (req, res) => {
  try {
    const xml = await generateSitemapXml();
    
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=3600"); // 1시간 캐시
    res.send(xml);
  } catch (error) {
    console.error("Error serving sitemap:", error);
    res.status(500).setHeader("Content-Type", "application/xml").send(
      '<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>'
    );
  }
});

export default router;

