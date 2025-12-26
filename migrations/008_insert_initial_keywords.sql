-- Migration: Insert Initial Keywords
-- Description: 초기 키워드 10개 삽입 (사용자 제공 키워드)
-- Date: 2025-01-24

-- 초기 키워드 데이터 삽입
INSERT INTO content_keywords (keyword, search_intent, cpc_krw, priority, related_keywords) VALUES
  ('한국 외국인 유심 카드', '입국 직후 필수', 2500, 'high',
   '["외국인등록증 발급방법", "LG U+ 외국인 유심 개통"]'::jsonb),

  ('한국에서 eSIM 지원 휴대폰', '기기 호환 안내', 2000, 'medium',
   '["한국 외국인 유심 카드"]'::jsonb),

  ('D-2 비자 근무 시간 조건', '유학생 근로 가이드', 3000, 'high',
   '["한국 외국인등록증 발급방법"]'::jsonb),

  ('한국 외국인등록증 발급방법', '정착 행정 안내', 2500, 'high',
   '["한국 외국인 유심 카드", "한국 PASS 앱 외국인 본인인증"]'::jsonb),

  ('한국 유학생용 최적 요금제', '요금제 비교', 4500, 'high',
   '["한국 유심 선불 vs 후불 비교", "LG U+ 외국인 유심 개통"]'::jsonb),

  ('외국인등록증 없이 사용하는 한국 번호', '초반 통신 해결', 3000, 'high',
   '["한국 외국인 유심 카드"]'::jsonb),

  ('한국 PASS 앱 외국인 본인인증', '본인인증 절차', 2000, 'medium',
   '["한국 외국인등록증 발급방법"]'::jsonb),

  ('LG U+ 외국인 유심 개통', '통신사별 가이드', 4500, 'high',
   '["한국 외국인 유심 카드", "한국 유학생용 최적 요금제"]'::jsonb),

  ('외국인 한국 은행 계좌 개설', '금융/연계 서비스', 7500, 'high',
   '["한국 외국인등록증 발급방법", "한국 PASS 앱 외국인 본인인증"]'::jsonb),

  ('한국 유심 선불 vs 후불 비교', '요금제/선택 가이드', 2500, 'medium',
   '["한국 유학생용 최적 요금제"]'::jsonb)
ON CONFLICT DO NOTHING;

-- 확인 쿼리
SELECT
  keyword,
  search_intent,
  cpc_krw,
  priority,
  status,
  created_at
FROM content_keywords
ORDER BY priority DESC, cpc_krw DESC;
