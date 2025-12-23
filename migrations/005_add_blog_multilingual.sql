-- Migration: Add multilingual content support for blog_posts table
-- Description: Adds language-specific columns for blog titles, content, and excerpts
-- Languages: en, vi, th, tl, uz, ne, mn, id, my, zh, ru (11 languages + original Korean)

-- Add English columns
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_en TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_en TEXT;

-- Add Vietnamese columns
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_vi TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_vi TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_vi TEXT;

-- Add Thai columns
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_th TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_th TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_th TEXT;

-- Add Tagalog columns
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_tl TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_tl TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_tl TEXT;

-- Add Uzbek columns
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_uz TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_uz TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_uz TEXT;

-- Add Nepali columns
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_ne TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_ne TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_ne TEXT;

-- Add Mongolian columns
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_mn TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_mn TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_mn TEXT;

-- Add Indonesian columns
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_id TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_id TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_id TEXT;

-- Add Burmese columns
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_my TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_my TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_my TEXT;

-- Add Chinese columns
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_zh TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_zh TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_zh TEXT;

-- Add Russian columns
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_ru TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_ru TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_ru TEXT;

-- Add indexes for commonly queried language columns
CREATE INDEX IF NOT EXISTS idx_blog_posts_title_en ON blog_posts(title_en);
CREATE INDEX IF NOT EXISTS idx_blog_posts_title_zh ON blog_posts(title_zh);
CREATE INDEX IF NOT EXISTS idx_blog_posts_title_ru ON blog_posts(title_ru);
