import { Router } from "express";
import { db } from "../storage/db.js";
import translate from '@vitalets/google-translate-api';

const router = Router();

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
  { code: 'zh-CN', name: 'Chinese', dbCode: 'zh' },
  { code: 'ru', name: 'Russian' },
];

// Helper function to translate text with retry logic
async function translateText(text: string, targetLang: string, retries = 3): Promise<string> {
  if (!text) return '';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await translate(text, { from: 'ko', to: targetLang });
      return result.text;
    } catch (error) {
      console.log(`Translation attempt ${attempt}/${retries} failed for ${targetLang}`);
      if (attempt === retries) {
        console.error(`Failed to translate to ${targetLang} after ${retries} attempts`);
        return text; // Return original text if all retries fail
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return text;
}

// Helper function to translate array of features
async function translateFeatures(features: string[], targetLang: string): Promise<string[]> {
  if (!features || features.length === 0) return [];

  const translated: string[] = [];
  for (const feature of features) {
    const translatedFeature = await translateText(feature, targetLang);
    translated.push(translatedFeature);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return translated;
}

// POST /api/translate/plans - Translate all plans
router.post("/plans", async (req, res) => {
  try {
    console.log('Starting automatic plan translation...');

    // Fetch all plans
    const result = await db.query(`
      SELECT id, name, description, features
      FROM plans
      ORDER BY id
    `);

    const plans = result.rows;
    console.log(`Found ${plans.length} plans to translate`);

    let translatedCount = 0;
    const errors: string[] = [];

    // Process each plan
    for (let i = 0; i < plans.length; i++) {
      const plan = plans[i];
      console.log(`[${i + 1}/${plans.length}] Translating plan: ${plan.name}`);

      try {
        // Prepare updates object
        const updates: { [key: string]: any } = {};

        // Translate to each language
        for (const lang of LANGUAGES) {
          const dbCode = lang.dbCode || lang.code;
          console.log(`  → ${lang.name} (${lang.code})...`);

          // Translate description
          if (plan.description) {
            const translatedDesc = await translateText(plan.description, lang.code);
            updates[`description_${dbCode}`] = translatedDesc;
          }

          // Translate features
          if (plan.features && Array.isArray(plan.features)) {
            const translatedFeatures = await translateFeatures(plan.features, lang.code);
            updates[`features_${dbCode}`] = JSON.stringify(translatedFeatures);
          }

          // Small delay between languages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        }

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

        console.log(`  ✅ Completed`);
        translatedCount++;
      } catch (error) {
        const errorMsg = `Failed to translate plan ${plan.name}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    res.json({
      success: true,
      message: 'Translation completed',
      stats: {
        total: plans.length,
        translated: translatedCount,
        failed: plans.length - translatedCount,
        languages: LANGUAGES.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Error during translation:', error);
    res.status(500).json({
      success: false,
      message: 'Translation failed',
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
