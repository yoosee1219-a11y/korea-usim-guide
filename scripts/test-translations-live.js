/**
 * Test translations by querying database directly
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testTranslations() {
  console.log('🧪 Testing multilingual translations\n');

  try {
    const client = await pool.connect();

    try {
      // Test 1: Get one plan with Korean
      console.log('📋 Test 1: Korean (default)\n');
      const koResult = await client.query(`
        SELECT
          name,
          description,
          features
        FROM plans
        WHERE is_active = true
        LIMIT 1
      `);

      if (koResult.rows[0]) {
        console.log('  Plan:', koResult.rows[0].name);
        console.log('  Description (KO):', koResult.rows[0].description);
        console.log('  Features (KO):', koResult.rows[0].features?.[0] || 'N/A');
      }

      // Test 2: Get same plan with English using COALESCE
      console.log('\n📋 Test 2: English (with COALESCE fallback)\n');
      const enResult = await client.query(`
        SELECT
          name,
          COALESCE(description_en, description) as description,
          COALESCE(features_en, features) as features
        FROM plans
        WHERE is_active = true
        LIMIT 1
      `);

      if (enResult.rows[0]) {
        console.log('  Plan:', enResult.rows[0].name);
        console.log('  Description (EN):', enResult.rows[0].description);
        console.log('  Features (EN):', enResult.rows[0].features?.[0] || 'N/A');
      }

      // Test 3: Vietnamese
      console.log('\n📋 Test 3: Vietnamese\n');
      const viResult = await client.query(`
        SELECT
          name,
          COALESCE(description_vi, description) as description,
          COALESCE(features_vi, features) as features
        FROM plans
        WHERE is_active = true
        LIMIT 1
      `);

      if (viResult.rows[0]) {
        console.log('  Plan:', viResult.rows[0].name);
        console.log('  Description (VI):', viResult.rows[0].description);
        console.log('  Features (VI):', viResult.rows[0].features?.[0] || 'N/A');
      }

      // Test 4: Chinese
      console.log('\n📋 Test 4: Chinese\n');
      const zhResult = await client.query(`
        SELECT
          name,
          COALESCE(description_zh, description) as description,
          COALESCE(features_zh, features) as features
        FROM plans
        WHERE is_active = true
        LIMIT 1
      `);

      if (zhResult.rows[0]) {
        console.log('  Plan:', zhResult.rows[0].name);
        console.log('  Description (ZH):', zhResult.rows[0].description);
        console.log('  Features (ZH):', zhResult.rows[0].features?.[0] || 'N/A');
      }

      // Test 5: Check for Korean characters in English translations
      console.log('\n🔍 Test 5: Validation - Korean in English?\n');
      const validationResult = await client.query(`
        SELECT
          name,
          description_en,
          CASE
            WHEN description_en ~ '[가-힣]' THEN '❌ Contains Korean'
            ELSE '✅ No Korean'
          END as validation
        FROM plans
        WHERE is_active = true
        LIMIT 5
      `);

      validationResult.rows.forEach(row => {
        console.log(`  ${row.name}: ${row.validation}`);
      });

      console.log('\n✅ All translation tests completed!\n');

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error testing translations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testTranslations();
