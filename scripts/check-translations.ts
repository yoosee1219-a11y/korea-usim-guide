import { config } from "dotenv";
config(); // Load .env file before importing db

import { db, closeConnection } from "../server/storage/db.js";

async function checkTranslations() {
  try {
    console.log("Checking translation status in database...\n");

    // Check how many plans have translations for each language
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

    const stats = result.rows[0];
    console.log("📊 Translation Status:");
    console.log(`Total active plans: ${stats.total_plans}`);
    console.log("\nLanguage Coverage:");
    console.log(`🇺🇸 English (en):     ${stats.en_count}/${stats.total_plans} (${Math.round(stats.en_count / stats.total_plans * 100)}%)`);
    console.log(`🇻🇳 Vietnamese (vi):  ${stats.vi_count}/${stats.total_plans} (${Math.round(stats.vi_count / stats.total_plans * 100)}%)`);
    console.log(`🇹🇭 Thai (th):        ${stats.th_count}/${stats.total_plans} (${Math.round(stats.th_count / stats.total_plans * 100)}%)`);
    console.log(`🇵🇭 Tagalog (tl):     ${stats.tl_count}/${stats.total_plans} (${Math.round(stats.tl_count / stats.total_plans * 100)}%)`);
    console.log(`🇺🇿 Uzbek (uz):       ${stats.uz_count}/${stats.total_plans} (${Math.round(stats.uz_count / stats.total_plans * 100)}%)`);
    console.log(`🇳🇵 Nepali (ne):      ${stats.ne_count}/${stats.total_plans} (${Math.round(stats.ne_count / stats.total_plans * 100)}%)`);
    console.log(`🇲🇳 Mongolian (mn):   ${stats.mn_count}/${stats.total_plans} (${Math.round(stats.mn_count / stats.total_plans * 100)}%)`);
    console.log(`🇮🇩 Indonesian (id):  ${stats.id_count}/${stats.total_plans} (${Math.round(stats.id_count / stats.total_plans * 100)}%)`);
    console.log(`🇲🇲 Burmese (my):     ${stats.my_count}/${stats.total_plans} (${Math.round(stats.my_count / stats.total_plans * 100)}%)`);
    console.log(`🇨🇳 Chinese (zh):     ${stats.zh_count}/${stats.total_plans} (${Math.round(stats.zh_count / stats.total_plans * 100)}%)`);
    console.log(`🇷🇺 Russian (ru):     ${stats.ru_count}/${stats.total_plans} (${Math.round(stats.ru_count / stats.total_plans * 100)}%)`);

    // Show sample of first plan with its translations
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

    if (sample.rows.length > 0) {
      const plan = sample.rows[0];
      console.log("\n\n📝 Sample (First Plan):");
      console.log(`Plan: ${plan.name}`);
      console.log(`Korean: ${plan.description ? plan.description.substring(0, 100) : 'NULL'}...`);
      console.log(`English: ${plan.description_en ? plan.description_en.substring(0, 100) : 'NULL'}...`);
      console.log(`Vietnamese: ${plan.description_vi ? plan.description_vi.substring(0, 100) : 'NULL'}...`);
      console.log(`Chinese: ${plan.description_zh ? plan.description_zh.substring(0, 100) : 'NULL'}...`);
    }

    await closeConnection();
  } catch (error) {
    console.error("Error checking translations:", error);
    await closeConnection();
    process.exit(1);
  }
}

checkTranslations();
