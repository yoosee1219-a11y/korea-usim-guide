-- 009_add_app_settings.sql
-- 앱 설정을 저장하는 테이블 추가 (스케줄러 설정 등)

CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 스케줄러 기본 설정 삽입
INSERT INTO app_settings (key, value)
VALUES (
  'scheduler_settings',
  '{
    "enabled": false,
    "interval": 24,
    "postsPerDay": 1,
    "lastRun": null
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();
