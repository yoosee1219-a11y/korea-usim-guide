-- 성능 최적화를 위한 인덱스 추가
-- 요금제 조회 쿼리 성능 개선

-- 1. is_active 인덱스 (기본 필터)
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active) WHERE is_active = true;

-- 2. is_popular 인덱스 (정렬 및 필터)
CREATE INDEX IF NOT EXISTS idx_plans_is_popular ON plans(is_popular DESC) WHERE is_popular = true;

-- 3. price_krw 인덱스 (정렬 및 범위 필터)
CREATE INDEX IF NOT EXISTS idx_plans_price_krw ON plans(price_krw ASC);

-- 4. carrier_id 인덱스 (JOIN 및 필터)
CREATE INDEX IF NOT EXISTS idx_plans_carrier_id ON plans(carrier_id);

-- 5. payment_type 인덱스 (필터)
CREATE INDEX IF NOT EXISTS idx_plans_payment_type ON plans(payment_type);

-- 6. data_amount_gb 인덱스 (범위 필터)
CREATE INDEX IF NOT EXISTS idx_plans_data_amount_gb ON plans(data_amount_gb) WHERE data_amount_gb IS NOT NULL;

-- 7. 복합 인덱스 (자주 함께 사용되는 필터 조합)
-- 활성화된 요금제 중 인기순 정렬
CREATE INDEX IF NOT EXISTS idx_plans_active_popular_price 
ON plans(is_active, is_popular DESC, price_krw ASC) 
WHERE is_active = true;

-- 8. 통신사별 활성 요금제 조회
CREATE INDEX IF NOT EXISTS idx_plans_carrier_active 
ON plans(carrier_id, is_active) 
WHERE is_active = true;

-- 9. 결제 방식별 활성 요금제 조회
CREATE INDEX IF NOT EXISTS idx_plans_payment_active 
ON plans(payment_type, is_active) 
WHERE is_active = true;

-- 10. carriers 테이블 인덱스 (JOIN 성능 향상)
CREATE INDEX IF NOT EXISTS idx_carriers_id ON carriers(id);

