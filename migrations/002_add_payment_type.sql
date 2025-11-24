-- 요금제 테이블에 payment_type 필드 추가 (선불/후불 구분)
-- Supabase PostgreSQL 데이터베이스에 직접 실행

-- payment_type 컬럼 추가
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'prepaid' 
CHECK (payment_type IN ('prepaid', 'postpaid'));

-- 기존 데이터는 모두 선불(prepaid)로 설정
UPDATE plans 
SET payment_type = 'prepaid' 
WHERE payment_type IS NULL;

-- 인덱스 생성 (필터링 성능 향상)
CREATE INDEX IF NOT EXISTS idx_plans_payment_type ON plans(payment_type);

-- 코멘트 추가
COMMENT ON COLUMN plans.payment_type IS '요금제 결제 방식: prepaid(선불), postpaid(후불)';

