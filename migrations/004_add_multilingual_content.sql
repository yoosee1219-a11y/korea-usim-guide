-- Migration: Add multilingual content support for plans table
-- Description: Adds language-specific columns for plan descriptions and features
-- Languages: en, vi, th, tl, uz, ne, mn, id, my, zh, ru (11 languages + original Korean)

-- Add English columns
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features_en JSONB DEFAULT '[]'::jsonb;

-- Add Vietnamese columns
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description_vi TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features_vi JSONB DEFAULT '[]'::jsonb;

-- Add Thai columns
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description_th TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features_th JSONB DEFAULT '[]'::jsonb;

-- Add Tagalog columns
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description_tl TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features_tl JSONB DEFAULT '[]'::jsonb;

-- Add Uzbek columns
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description_uz TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features_uz JSONB DEFAULT '[]'::jsonb;

-- Add Nepali columns
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description_ne TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features_ne JSONB DEFAULT '[]'::jsonb;

-- Add Mongolian columns
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description_mn TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features_mn JSONB DEFAULT '[]'::jsonb;

-- Add Indonesian columns
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description_id TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features_id JSONB DEFAULT '[]'::jsonb;

-- Add Burmese columns
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description_my TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features_my JSONB DEFAULT '[]'::jsonb;

-- Add Chinese columns
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description_zh TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features_zh JSONB DEFAULT '[]'::jsonb;

-- Add Russian columns
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description_ru TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features_ru JSONB DEFAULT '[]'::jsonb;

-- Add indexes for commonly queried language columns
CREATE INDEX IF NOT EXISTS idx_plans_description_en ON plans USING gin(to_tsvector('english', description_en));
CREATE INDEX IF NOT EXISTS idx_plans_description_zh ON plans USING gin(to_tsvector('simple', description_zh));
CREATE INDEX IF NOT EXISTS idx_plans_description_ru ON plans USING gin(to_tsvector('russian', description_ru));

-- Comment on migration
COMMENT ON COLUMN plans.description_en IS 'English translation of plan description';
COMMENT ON COLUMN plans.description_vi IS 'Vietnamese translation of plan description';
COMMENT ON COLUMN plans.description_th IS 'Thai translation of plan description';
COMMENT ON COLUMN plans.description_tl IS 'Tagalog translation of plan description';
COMMENT ON COLUMN plans.description_uz IS 'Uzbek translation of plan description';
COMMENT ON COLUMN plans.description_ne IS 'Nepali translation of plan description';
COMMENT ON COLUMN plans.description_mn IS 'Mongolian translation of plan description';
COMMENT ON COLUMN plans.description_id IS 'Indonesian translation of plan description';
COMMENT ON COLUMN plans.description_my IS 'Burmese translation of plan description';
COMMENT ON COLUMN plans.description_zh IS 'Chinese translation of plan description';
COMMENT ON COLUMN plans.description_ru IS 'Russian translation of plan description';
