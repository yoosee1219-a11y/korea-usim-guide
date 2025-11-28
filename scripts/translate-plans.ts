import pg from 'pg';
import translate from '@vitalets/google-translate-api';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function to translate text with retry logic
async function translateText(text: string, targetLang: string, retries = 3): Promise<string> {
  if (!text) return '';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await translate(text, { from: 'ko', to: targetLang });
      return result.text;
    } catch (error) {
      console.log(`⚠️  Translation attempt ${attempt}/${retries} failed for ${targetLang}:`, error.message);
      if (attempt === retries) {
        console.error(`❌ Failed to translate to ${targetLang} after ${retries} attempts`);
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

async function translatePlans() {
  let client;

  try {
    console.log('🌍 Starting automatic plan translation...\n');

    // Connect to database
    client = await pool.connect();

    // Fetch all plans
    const result = await client.query(`
      SELECT id, name, description, features
      FROM plans
      ORDER BY id
    `);

    const plans = result.rows;
    console.log(`📊 Found ${plans.length} plans to translate\n`);

    // Process each plan
    for (let i = 0; i < plans.length; i++) {
      const plan = plans[i];
      console.log(`\n🔄 [${i + 1}/${plans.length}] Translating plan: ${plan.name}`);
      console.log(`   Original description: ${plan.description?.substring(0, 50)}...`);

      // Prepare updates object
      const updates: { [key: string]: any } = {};

      // Translate to each language
      for (const lang of LANGUAGES) {
        const dbCode = lang.dbCode || lang.code;
        console.log(`   → Translating to ${lang.name} (${lang.code})...`);

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
      await client.query(
        `UPDATE plans SET ${setClause} WHERE id = $1`,
        values
      );

      console.log(`   ✅ Plan "${plan.name}" translated successfully!`);
    }

    console.log('\n\n🎉 All plans translated successfully!');
    console.log(`📊 Total plans translated: ${plans.length}`);
    console.log(`🌐 Languages: ${LANGUAGES.length}`);
    console.log(`📝 Total translations: ${plans.length * LANGUAGES.length * 2} (descriptions + features)`);

  } catch (error) {
    console.error('\n❌ Error during translation:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the translation
console.log('🚀 Korea USIM Guide - Automatic Plan Translation\n');
console.log('================================================\n');

translatePlans()
  .then(() => {
    console.log('\n✨ Translation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Translation failed:', error);
    process.exit(1);
  });
