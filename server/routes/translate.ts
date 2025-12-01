import { Router } from "express";
import { db } from "../storage/db.js";
import { v2 } from '@google-cloud/translate';

const router = Router();

// Initialize Google Cloud Translation client (v2 API with API key)
const translationClient = new v2.Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY || '',
});

// Language codes matching our database columns
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'tl', name: 'Tagalog' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'ne', name: 'Nepali' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'id', name: 'Indonesian' },
  { code: 'my', name: 'Burmese' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', dbCode: 'zh' },
  { code: 'ru', name: 'Russian' },
];

// Helper function to check if text contains Korean characters
function containsKorean(text: string): boolean {
  return /[가-힣]/.test(text);
}

// Helper function to validate translation result
function validateTranslation(original: string, translated: string, targetLang: string): boolean {
  // Check if translation is empty
  if (!translated || translated.trim() === '') {
    console.error(`Validation failed: Empty translation for ${targetLang}`);
    return false;
  }

  // Check if translation still contains Korean (except for proper nouns which we allow)
  // We'll be strict here - ANY Korean character means failure
  if (containsKorean(translated)) {
    console.error(`Validation failed: Translation still contains Korean for ${targetLang}`);
    console.error(`Original: ${original}`);
    console.error(`Translated: ${translated}`);
    return false;
  }

  // Check if translation is exactly the same as original (likely failed)
  if (translated === original) {
    console.error(`Validation failed: Translation is identical to original for ${targetLang}`);
    return false;
  }

  return true;
}

// Helper function to translate text using Google Cloud Translation API with retry logic
async function translateText(text: string, targetLang: string, langName: string, retries = 3): Promise<string> {
  if (!text) return '';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Use the v2 API which uses API key
      const [translation] = await translationClient.translate(text, targetLang);

      const translatedText = typeof translation === 'string' ? translation : String(translation);

      // Validate the translation
      if (!validateTranslation(text, translatedText, langName)) {
        throw new Error(`Translation validation failed for ${langName}`);
      }

      console.log(`  ✓ ${langName}: "${text.substring(0, 30)}..." → "${translatedText.substring(0, 30)}..."`);
      return translatedText;

    } catch (error) {
      console.log(`Translation attempt ${attempt}/${retries} failed for ${langName}:`, error instanceof Error ? error.message : String(error));

      if (attempt === retries) {
        console.error(`❌ Failed to translate to ${langName} after ${retries} attempts`);
        throw new Error(`Translation failed for ${langName}: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error(`Translation failed for ${langName}`);
}

// Helper function to translate array of features
async function translateFeatures(features: string[], targetLang: string, langName: string): Promise<string[]> {
  if (!features || features.length === 0) return [];

  const translated: string[] = [];
  for (const feature of features) {
    const translatedFeature = await translateText(feature, targetLang, langName);
    translated.push(translatedFeature);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  return translated;
}

// POST /api/translate/plans - Translate plans in batches
router.post("/plans", async (req, res) => {
  try {
    const { batch_size = 1, skip = 0 } = req.body;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Starting batch translation (skip: ${skip}, batch_size: ${batch_size})...`);
    console.log(`${'='.repeat(60)}\n`);

    // Fetch plans for this batch only
    const result = await db.query(`
      SELECT id, name, description, features
      FROM plans
      WHERE is_active = true
      ORDER BY id
      LIMIT $1 OFFSET $2
    `, [batch_size, skip]);

    const plans = result.rows;
    console.log(`Found ${plans.length} plans to translate in this batch\n`);

    let translatedCount = 0;
    const errors: string[] = [];

    // Process each plan
    for (let i = 0; i < plans.length; i++) {
      const plan = plans[i];
      console.log(`\n[${ i + 1}/${plans.length}] 📝 Translating: ${plan.name}`);
      console.log(`${'─'.repeat(60)}`);

      try {
        // Prepare updates object
        const updates: { [key: string]: any } = {};
        let languageSuccessCount = 0;

        // Translate to each language
        for (const lang of LANGUAGES) {
          const dbCode = lang.dbCode || lang.code;
          console.log(`\n  🌐 ${lang.name}:`);

          try {
            // Translate description
            if (plan.description) {
              const translatedDesc = await translateText(plan.description, lang.code, lang.name);
              updates[`description_${dbCode}`] = translatedDesc;
            }

            // Translate features
            if (plan.features && Array.isArray(plan.features)) {
              const translatedFeatures = await translateFeatures(plan.features, lang.code, lang.name);
              updates[`features_${dbCode}`] = JSON.stringify(translatedFeatures);
            }

            languageSuccessCount++;

            // Small delay between languages to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));

          } catch (langError) {
            const errorMsg = `${plan.name} - ${lang.name}: ${langError instanceof Error ? langError.message : String(langError)}`;
            console.error(`  ❌ ${errorMsg}`);
            errors.push(errorMsg);
          }
        }

        // Only update database if we have at least some successful translations
        if (Object.keys(updates).length > 0) {
          // Build update query
          const setClause = Object.keys(updates)
            .map((key, idx) => `${key} = $${idx + 2}`)
            .join(', ');

          const values = [plan.id, ...Object.values(updates)];

          // Update database
          await db.query(
            `UPDATE plans SET ${setClause} WHERE id = $1`,
            values
          );

          console.log(`\n  ✅ Completed: ${languageSuccessCount}/${LANGUAGES.length} languages successful`);
          translatedCount++;
        } else {
          console.log(`\n  ⚠️  No successful translations for this plan`);
          errors.push(`${plan.name}: All translations failed`);
        }

      } catch (error) {
        const errorMsg = `Failed to translate plan ${plan.name}: ${error}`;
        console.error(`\n  ❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    // Check if there are more plans to process
    const totalResult = await db.query(`
      SELECT COUNT(*) as total FROM plans WHERE is_active = true
    `);
    const totalPlans = parseInt(totalResult.rows[0].total);
    const hasMore = (skip + batch_size) < totalPlans;
    const nextSkip = skip + batch_size;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Batch Summary:`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Successfully translated: ${translatedCount}/${plans.length} plans`);
    console.log(`❌ Failed: ${plans.length - translatedCount} plans`);
    console.log(`📈 Overall progress: ${skip + plans.length}/${totalPlans} plans`);
    if (errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      errors.forEach(err => console.log(`   - ${err}`));
    }
    console.log(`${'='.repeat(60)}\n`);

    res.json({
      success: true,
      message: `Batch translation completed (${skip + 1}-${skip + plans.length} of ${totalPlans})`,
      stats: {
        batch: plans.length,
        translated: translatedCount,
        failed: plans.length - translatedCount,
        languages: LANGUAGES.length,
        total_plans: totalPlans,
        processed: skip + plans.length,
        remaining: totalPlans - (skip + plans.length),
      },
      pagination: {
        has_more: hasMore,
        next_skip: hasMore ? nextSkip : null,
        batch_size,
      },
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('\n❌ Fatal error during translation:', error);
    res.status(500).json({
      success: false,
      message: 'Translation failed',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// DELETE /api/translate/clear - Clear all translations
router.delete("/clear", async (req, res) => {
  try {
    console.log('🗑️  Clearing all bad translations from database...\n');

    // Update all translation columns to NULL
    const result = await db.query(`
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

    res.json({
      success: true,
      message: `Cleared all translations for ${result.rowCount} plans`,
      cleared: result.rowCount,
    });
  } catch (error) {
    console.error('❌ Error clearing translations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/translate/status - Check translation status
router.get("/status", async (req, res) => {
  try {
    // Check detailed translation status for all languages
    const result = await db.query(`
      SELECT
        COUNT(*) as total_plans,
        COUNT(description_en) FILTER (WHERE description_en IS NOT NULL AND description_en != '') as en_count,
        COUNT(description_vi) FILTER (WHERE description_vi IS NOT NULL AND description_vi != '') as vi_count,
        COUNT(description_th) FILTER (WHERE description_th IS NOT NULL AND description_th != '') as th_count,
        COUNT(description_tl) FILTER (WHERE description_tl IS NOT NULL AND description_tl != '') as tl_count,
        COUNT(description_uz) FILTER (WHERE description_uz IS NOT NULL AND description_uz != '') as uz_count,
        COUNT(description_ne) FILTER (WHERE description_ne IS NOT NULL AND description_ne != '') as ne_count,
        COUNT(description_mn) FILTER (WHERE description_mn IS NOT NULL AND description_mn != '') as mn_count,
        COUNT(description_id) FILTER (WHERE description_id IS NOT NULL AND description_id != '') as id_count,
        COUNT(description_my) FILTER (WHERE description_my IS NOT NULL AND description_my != '') as my_count,
        COUNT(description_zh) FILTER (WHERE description_zh IS NOT NULL AND description_zh != '') as zh_count,
        COUNT(description_ru) FILTER (WHERE description_ru IS NOT NULL AND description_ru != '') as ru_count
      FROM plans
      WHERE is_active = true
    `);

    // Get sample plan to show translation quality
    const sample = await db.query(`
      SELECT
        id,
        name,
        description,
        description_en,
        description_vi,
        description_zh
      FROM plans
      WHERE is_active = true
      ORDER BY id
      LIMIT 1
    `);

    res.json({
      success: true,
      stats: result.rows[0],
      sample: sample.rows[0] || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
