-- 초기 데이터 시드 SQL
-- Supabase PostgreSQL 데이터베이스에 직접 실행

-- 통신사 데이터 삽입
INSERT INTO carriers (id, name_ko, name_en, website_url) VALUES
('sk', 'SK텔레콤', 'SK Telecom', 'https://www.sktelecom.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO carriers (id, name_ko, name_en, website_url) VALUES
('kt', 'KT', 'KT Corporation', 'https://www.kt.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO carriers (id, name_ko, name_en, website_url) VALUES
('lg', 'LG유플러스', 'LG U+', 'https://www.lguplus.co.kr')
ON CONFLICT (id) DO NOTHING;

INSERT INTO carriers (id, name_ko, name_en, website_url) VALUES
('altelecom', '알뜰폰', 'MVNO', NULL)
ON CONFLICT (id) DO NOTHING;

-- 꿀팁 카테고리 삽입
INSERT INTO tip_categories (id, name) VALUES
('airport', '공항 수령')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tip_categories (id, name) VALUES
('activation', '개통 및 활성화')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tip_categories (id, name) VALUES
('troubleshooting', '문제 해결')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tip_categories (id, name) VALUES
('guide', '이용 가이드')
ON CONFLICT (id) DO NOTHING;

-- 샘플 요금제 데이터 (SK)
INSERT INTO plans (
  carrier_id, plan_type, name, description, data_amount_gb, 
  validity_days, price_krw, features, airport_pickup, esim_support, 
  physical_sim, is_popular, is_active
) VALUES (
  'sk', 'both', 'SK텔레콤 10GB 선불 요금제', 
  '30일간 사용 가능한 10GB 데이터 요금제',
  10, 30, 33000, 
  '["10GB 데이터", "30일 유효기간", "공항 수령 가능", "eSIM 지원"]'::jsonb,
  true, true, true, true
) ON CONFLICT DO NOTHING;

INSERT INTO plans (
  carrier_id, plan_type, name, description, data_amount_gb, 
  validity_days, price_krw, features, airport_pickup, esim_support, 
  physical_sim, is_popular, is_active
) VALUES (
  'sk', 'both', 'SK텔레콤 30GB 선불 요금제', 
  '30일간 사용 가능한 30GB 데이터 요금제',
  30, 30, 55000, 
  '["30GB 데이터", "30일 유효기간", "공항 수령 가능", "eSIM 지원"]'::jsonb,
  true, true, true, false
) ON CONFLICT DO NOTHING;

-- 샘플 요금제 데이터 (KT)
INSERT INTO plans (
  carrier_id, plan_type, name, description, data_amount_gb, 
  validity_days, price_krw, features, airport_pickup, esim_support, 
  physical_sim, is_popular, is_active
) VALUES (
  'kt', 'both', 'KT 10GB 선불 요금제', 
  '30일간 사용 가능한 10GB 데이터 요금제',
  10, 30, 30000, 
  '["10GB 데이터", "30일 유효기간", "공항 수령 가능", "eSIM 지원"]'::jsonb,
  true, true, true, true
) ON CONFLICT DO NOTHING;

INSERT INTO plans (
  carrier_id, plan_type, name, description, data_amount_gb, 
  validity_days, price_krw, features, airport_pickup, esim_support, 
  physical_sim, is_popular, is_active
) VALUES (
  'kt', 'both', 'KT 50GB 선불 요금제', 
  '30일간 사용 가능한 50GB 데이터 요금제',
  50, 30, 70000, 
  '["50GB 데이터", "30일 유효기간", "공항 수령 가능", "eSIM 지원"]'::jsonb,
  true, true, true, false
) ON CONFLICT DO NOTHING;

-- 샘플 요금제 데이터 (LG U+)
INSERT INTO plans (
  carrier_id, plan_type, name, description, data_amount_gb, 
  validity_days, price_krw, features, airport_pickup, esim_support, 
  physical_sim, is_popular, is_active
) VALUES (
  'lg', 'both', 'LG유플러스 10GB 선불 요금제', 
  '30일간 사용 가능한 10GB 데이터 요금제',
  10, 30, 30000, 
  '["10GB 데이터", "30일 유효기간", "공항 수령 가능", "eSIM 지원"]'::jsonb,
  true, true, true, false
) ON CONFLICT DO NOTHING;

-- 샘플 요금제 데이터 (알뜰폰)
INSERT INTO plans (
  carrier_id, plan_type, name, description, data_amount_gb, 
  validity_days, price_krw, features, airport_pickup, esim_support, 
  physical_sim, is_popular, is_active
) VALUES (
  'altelecom', 'prepaid', '알뜰폰 20GB 선불 요금제', 
  '30일간 사용 가능한 20GB 데이터 요금제',
  20, 30, 25000, 
  '["20GB 데이터", "30일 유효기간", "저렴한 가격"]'::jsonb,
  false, false, true, true
) ON CONFLICT DO NOTHING;

-- 샘플 꿀팁 데이터
INSERT INTO tips (
  category_id, slug, title, excerpt, content, published_at, is_published, seo_meta
) VALUES (
  'airport',
  'how-to-pickup-sim-at-airport',
  '공항에서 유심 카드 수령하는 방법',
  '인천공항과 김해공항에서 유심 카드를 쉽게 수령할 수 있는 방법을 안내합니다.',
  '# 공항에서 유심 카드 수령하는 방법

한국에 도착하면 가장 먼저 해야 할 일 중 하나가 유심 카드를 받는 것입니다.

## 인천공항

1. 입국장에서 유심 판매점을 찾습니다
2. 여권을 제시하고 예약 확인
3. 요금제 선택 및 결제
4. 유심 카드 수령 및 개통

## 김해공항

김해공항에서도 유사한 절차로 유심 카드를 수령할 수 있습니다.',
  NOW(),
  true,
  '{"meta_title": "공항에서 유심 카드 수령하는 방법", "meta_description": "인천공항과 김해공항에서 유심 카드를 수령하는 방법을 안내합니다.", "keywords": ["공항", "유심", "수령", "인천공항"]}'::jsonb
) ON CONFLICT DO NOTHING;

INSERT INTO tips (
  category_id, slug, title, excerpt, content, published_at, is_published, seo_meta
) VALUES (
  'activation',
  'how-to-activate-esim',
  'eSIM 활성화 방법',
  '한국에서 eSIM을 활성화하는 방법을 단계별로 안내합니다.',
  '# eSIM 활성화 방법

eSIM은 물리적인 유심 카드 없이 스마트폰에 바로 설치할 수 있는 디지털 유심입니다.

## 준비 사항

- eSIM 지원 스마트폰
- WiFi 연결
- 여권 번호

## 활성화 절차

1. QR 코드 스캔
2. 셀룰러 데이터 설정에서 eSIM 추가
3. 통신사 코드 입력
4. 활성화 완료

약 10분 정도 소요됩니다.',
  NOW(),
  true,
  '{"meta_title": "eSIM 활성화 방법", "meta_description": "한국에서 eSIM을 활성화하는 방법을 단계별로 안내합니다.", "keywords": ["eSIM", "활성화", "설정"]}'::jsonb
) ON CONFLICT DO NOTHING;

