import dotenv from 'dotenv';
// Load environment variables FIRST before importing db
dotenv.config();

import { db } from '../server/storage/db.js';
import { v2 } from '@google-cloud/translate';

const translationClient = new v2.Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY || '',
});

const ALL_LANGUAGES = [
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

async function addMissingTranslations() {
  try {
    console.log('🔄 Finding tips with missing translations...\n');

    // 모든 한국어 원본 tip 찾기 (original_tip_id가 NULL인 것들)
    const originals = await db.query(`
      SELECT id, title, content, excerpt, slug, category_id, thumbnail_url, seo_meta
      FROM tips
      WHERE original_tip_id IS NULL AND language = 'ko'
      ORDER BY created_at DESC
    `);

    console.log(`Found ${originals.rows.length} original tips\n`);

    for (const original of originals.rows) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📝 ${original.title}`);
      console.log(`   ID: ${original.id}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // 현재 존재하는 번역 찾기
      const existing = await db.query(`
        SELECT language
        FROM tips
        WHERE (original_tip_id = $1 OR id = $1) AND language != 'ko'
      `, [original.id]);

      const existingLanguages = existing.rows.map((r: any) => r.language);
      console.log(`   Existing: ${existingLanguages.length} translations (${existingLanguages.join(', ')})`);

      // 누락된 언어 찾기
      const missingLanguages = ALL_LANGUAGES.filter(lang => {
        const dbCode = lang.dbCode || lang.code;
        return !existingLanguages.includes(dbCode);
      });

      if (missingLanguages.length === 0) {
        console.log(`   ✅ All translations exist`);
        continue;
      }

      console.log(`   ⚠️  Missing: ${missingLanguages.length} translations (${missingLanguages.map(l => l.code).join(', ')})`);
      console.log(`\n   🔄 Translating...`);

      let successCount = 0;

      for (const lang of missingLanguages) {
        const langCode = lang.dbCode || lang.code;
        console.log(`\n     ${lang.name} (${lang.code})...`);

        try {
          // 번역
          const [translatedTitle] = await translationClient.translate(original.title, lang.code);
          const [translatedExcerpt] = await translationClient.translate(original.excerpt, lang.code);
          const [translatedContent] = await translationClient.translate(original.content, lang.code);

          // 저장
          await db.query(`
            INSERT INTO tips (
              category_id, slug, title, content, excerpt, thumbnail_url,
              is_published, published_at, language, original_tip_id, seo_meta
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10)
          `, [
            original.category_id,
            original.slug,
            translatedTitle,
            translatedContent,
            translatedExcerpt,
            original.thumbnail_url,
            true,
            langCode,
            original.id,
            original.seo_meta
          ]);

          console.log(`     ✅ Success`);
          successCount++;

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 250));

        } catch (error) {
          console.error(`     ❌ Failed:`, error instanceof Error ? error.message : String(error));
        }
      }

      console.log(`\n   📊 Added ${successCount}/${missingLanguages.length} translations`);
    }

    console.log('\n\n🎉 Done!');
    await db.end();

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addMissingTranslations();
