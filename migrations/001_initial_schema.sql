-- 한국 요금제 가이드 웹서비스 초기 스키마
-- Supabase PostgreSQL 데이터베이스에 직접 실행

-- 통신사 테이블
CREATE TABLE IF NOT EXISTS carriers (
  id VARCHAR(50) PRIMARY KEY,
  name_ko TEXT NOT NULL,
  name_en TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 요금제 테이블
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id VARCHAR(50) NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('prepaid', 'esim', 'both')),
  name TEXT NOT NULL,
  description TEXT,
  data_amount_gb INTEGER,
  validity_days INTEGER NOT NULL,
  voice_minutes INTEGER,
  sms_count INTEGER,
  price_krw INTEGER NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  airport_pickup BOOLEAN DEFAULT false,
  esim_support BOOLEAN DEFAULT false,
  physical_sim BOOLEAN DEFAULT false,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_plans_carrier ON plans(carrier_id);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_popular ON plans(is_popular);
CREATE INDEX IF NOT EXISTS idx_plans_price ON plans(price_krw);
CREATE INDEX IF NOT EXISTS idx_plans_data ON plans(data_amount_gb);

-- 꿀팁 카테고리 테이블
CREATE TABLE IF NOT EXISTS tip_categories (
  id VARCHAR(50) PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 꿀팁 테이블
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id VARCHAR(50) NOT NULL REFERENCES tip_categories(id) ON DELETE CASCADE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMP,
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  seo_meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_tips_category ON tips(category_id);
CREATE INDEX IF NOT EXISTS idx_tips_published ON tips(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_tips_slug ON tips(slug);
CREATE INDEX IF NOT EXISTS idx_tips_view_count ON tips(view_count DESC);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tips_updated_at BEFORE UPDATE ON tips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

