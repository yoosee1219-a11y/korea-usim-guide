-- Migration: Add Content Automation System
-- Description: Adds keyword management table for automated content generation
-- Date: 2025-01-24

-- 키워드 관리 테이블
CREATE TABLE IF NOT EXISTS content_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 키워드 정보
  keyword TEXT NOT NULL,
  search_intent TEXT,                          -- 검색 의도 (예: "입국 직후 필수")
  cpc_krw INTEGER,                              -- 예상 CPC (원)
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',

  -- 상태 관리
  status TEXT CHECK (status IN ('pending', 'generating', 'published', 'failed')) DEFAULT 'pending',

  -- 관련 키워드 (내부 링크용)
  related_keywords JSONB DEFAULT '[]'::jsonb,  -- 예: ["외국인등록증 발급", "LG U+ 유심"]

  -- 생성된 콘텐츠 참조
  tip_id UUID REFERENCES tips(id) ON DELETE SET NULL,

  -- SEO 메타데이터 (생성 시 자동 저장)
  seo_meta JSONB DEFAULT '{}'::jsonb,          -- 예: {"h2_tags": [...], "keywords": [...]}

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,

  -- 에러 로그 (실패 시)
  error_message TEXT
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_content_keywords_status ON content_keywords(status);
CREATE INDEX IF NOT EXISTS idx_content_keywords_priority ON content_keywords(priority);
CREATE INDEX IF NOT EXISTS idx_content_keywords_tip_id ON content_keywords(tip_id);
CREATE INDEX IF NOT EXISTS idx_content_keywords_published ON content_keywords(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_keywords_keyword ON content_keywords(keyword);

-- 코멘트 추가
COMMENT ON TABLE content_keywords IS '콘텐츠 자동 생성을 위한 키워드 관리 테이블';
COMMENT ON COLUMN content_keywords.keyword IS '타겟 SEO 키워드';
COMMENT ON COLUMN content_keywords.search_intent IS '사용자 검색 의도';
COMMENT ON COLUMN content_keywords.cpc_krw IS '예상 클릭당 비용 (원)';
COMMENT ON COLUMN content_keywords.priority IS '생성 우선순위 (high/medium/low)';
COMMENT ON COLUMN content_keywords.status IS '처리 상태 (pending/generating/published/failed)';
COMMENT ON COLUMN content_keywords.related_keywords IS '내부 링크 연결을 위한 관련 키워드 목록';
COMMENT ON COLUMN content_keywords.tip_id IS '생성된 tip의 ID (외래키)';
COMMENT ON COLUMN content_keywords.seo_meta IS 'SEO 메타데이터 (H2 태그, 키워드 등)';
