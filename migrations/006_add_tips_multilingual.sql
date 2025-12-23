-- Migration: Add multilingual support to tips table
-- Description: Adds language and original_tip_id fields to support multiple language versions
-- Each tip can have multiple rows (one per language) linked by original_tip_id

-- Add language column (default 'ko' for existing tips)
ALTER TABLE tips ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'ko';

-- Add original_tip_id column to link translations to original
ALTER TABLE tips ADD COLUMN IF NOT EXISTS original_tip_id UUID REFERENCES tips(id) ON DELETE CASCADE;

-- Remove UNIQUE constraint from slug to allow same slug for different languages
-- Note: This might fail if the constraint doesn't exist, which is fine
DO $$
BEGIN
    ALTER TABLE tips DROP CONSTRAINT IF EXISTS tips_slug_key;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Create composite index for slug + language (unique together)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tips_slug_language ON tips(slug, language);

-- Create index for original_tip_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_tips_original_tip_id ON tips(original_tip_id);

-- Create index for language for faster filtering
CREATE INDEX IF NOT EXISTS idx_tips_language ON tips(language);
