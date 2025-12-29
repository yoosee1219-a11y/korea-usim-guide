-- Performance optimization indexes for multilingual tips and content automation
-- Stage 2: Performance Optimization - Database Index Optimization

-- Tips table indexes for multilingual queries
-- Composite index for language + published status + date sorting
CREATE INDEX IF NOT EXISTS idx_tips_lang_published
  ON tips(language, is_published, published_at DESC)
  WHERE is_published = true;

-- Composite index for category + language filtering
CREATE INDEX IF NOT EXISTS idx_tips_category_lang
  ON tips(category_id, language, is_published)
  WHERE is_published = true;

-- Index for slug + language lookups (common pattern for multilingual content)
CREATE INDEX IF NOT EXISTS idx_tips_slug_lang
  ON tips(slug, language)
  WHERE is_published = true;

-- Index for original tip relationship (for translation management)
CREATE INDEX IF NOT EXISTS idx_tips_original_tip_id
  ON tips(original_tip_id)
  WHERE original_tip_id IS NOT NULL;

-- Content keywords indexes for automation workflow
-- Composite index for status + priority + CPC sorting
CREATE INDEX IF NOT EXISTS idx_keywords_status_priority
  ON content_keywords(status, priority, cpc_krw DESC);

-- Index for keyword search
CREATE INDEX IF NOT EXISTS idx_keywords_keyword
  ON content_keywords(keyword);

-- Index for tip_id relationship (to find keywords linked to tips)
CREATE INDEX IF NOT EXISTS idx_keywords_tip_id
  ON content_keywords(tip_id)
  WHERE tip_id IS NOT NULL;

-- Plans table additional indexes (extending 003_add_performance_indexes.sql)
-- Composite index for plan type + active + price
CREATE INDEX IF NOT EXISTS idx_plans_type_active
  ON plans(plan_type, is_active, price_krw)
  WHERE is_active = true;

-- Index for esim support filtering
CREATE INDEX IF NOT EXISTS idx_plans_esim_support
  ON plans(esim_support, is_active)
  WHERE is_active = true;

-- Index for physical sim filtering
CREATE INDEX IF NOT EXISTS idx_plans_physical_sim
  ON plans(physical_sim, is_active)
  WHERE is_active = true;

-- Index for airport pickup filtering
CREATE INDEX IF NOT EXISTS idx_plans_airport_pickup
  ON plans(airport_pickup, is_active)
  WHERE is_active = true;
