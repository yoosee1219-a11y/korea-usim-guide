/**
 * Clear all bad Korean translations from database
 * This will reset all translation columns to NULL so we can re-translate
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function clearBadTranslations() {
  console.log('🗑️  Clearing all bad translations from database...\n');

  try {
    const client = await pool.connect();

    try {
      // Update all translation columns to NULL
      const result = await client.query(`
        UPDATE plans
        SET
          description_en = NULL,
          description_vi = NULL,
          description_th = NULL,
          description_tl = NULL,
          description_uz = NULL,
          description_ne = NULL,
          description_mn = NULL,
          description_id = NULL,
          description_my = NULL,
          description_zh = NULL,
          description_ru = NULL,
          features_en = NULL,
          features_vi = NULL,
          features_th = NULL,
          features_tl = NULL,
          features_uz = NULL,
          features_ne = NULL,
          features_mn = NULL,
          features_id = NULL,
          features_my = NULL,
          features_zh = NULL,
          features_ru = NULL
        WHERE is_active = true
      `);

      console.log(`✅ Cleared translations for ${result.rowCount} plans`);
      console.log('Database is now ready for fresh translations\n');

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error clearing translations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

clearBadTranslations();
