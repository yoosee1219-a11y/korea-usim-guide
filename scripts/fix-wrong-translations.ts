import 'dotenv/config';
import { db } from '../server/storage/db.js';
import { v2 } from '@google-cloud/translate';

const translationClient = new v2.Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY || '',
});

// 잘못된 번역 ID 목록 (check-translation-quality.ts에서 확인된 것)
const WRONG_TRANSLATIONS = [
  { id: '38351cc2-3283-4868-9ac7-cb4f38139de0', lang: 'en', originalId: '26290e35-f929-44b5-b36e-335412404a66' },
  { id: '76b3debc-8a6f-4c75-956d-081f439fc114', lang: 'en', originalId: 'd49fb334-1479-4b2c-bf84-7fb97e48f92f' },
  { id: '4d24dab5-a4ad-4f3e-a9bc-1fa077ee0c0a', lang: 'en', originalId: '74a0694d-4ce5-4875-b486-9395bbb8cc1c' },
  { id: '86bf753f-7355-444e-ab88-739d6f6d6a68', lang: 'vi', originalId: '26290e35-f929-44b5-b36e-335412404a66' },
  { id: 'c2f988cf-5035-4c1c-b594-57b66f5f3da6', lang: 'vi', originalId: 'd49fb334-1479-4b2c-bf84-7fb97e48f92f' },
  { id: 'ffa135e0-093d-4b7d-8572-e43575117a38', lang: 'vi', originalId: '74a0694d-4ce5-4875-b486-9395bbb8cc1c' },
  { id: '9fb3bc3d-f522-4743-8b1f-5ed20f570f85', lang: 'ru', originalId: 'd49fb334-1479-4b2c-bf84-7fb97e48f92f' },
  { id: 'c5a3da3f-29dc-4537-9bca-45a2fbd63776', lang: 'ru', originalId: '74a0694d-4ce5-4875-b486-9395bbb8cc1c' },
];

async function translateWithRetry(
  text: string,
  targetLang: string,
  maxRetries: number = 3
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const [translation] = await translationClient.translate(text, targetLang);
      return translation;
    } catch (error) {
      console.error(`   ⚠️ Translation attempt ${i + 1} failed:`, error instanceof Error ? error.message : String(error));
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Translation failed after retries');
}

async function fixWrongTranslations() {
  try {
    console.log('🔧 Fixing wrong translations...\n');
    console.log(`Total to fix: ${WRONG_TRANSLATIONS.length}\n`);

    let fixed = 0;
    let failed = 0;

    for (const wrong of WRONG_TRANSLATIONS) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Fixing [${wrong.lang}] tip: ${wrong.id}`);

      try {
        // 1. 원본 데이터 가져오기
        const original = await db.query(`
          SELECT * FROM tips WHERE id = $1
        `, [wrong.originalId]);

        if (original.rows.length === 0) {
          console.error(`   ❌ Original tip not found: ${wrong.originalId}`);
          failed++;
          continue;
        }

        const orig = original.rows[0];
        console.log(`   Original: ${orig.title.substring(0, 60)}...`);

        // 2. 번역 실행
        console.log(`   Translating to ${wrong.lang}...`);
        const translatedTitle = await translateWithRetry(orig.title, wrong.lang);
        const translatedExcerpt = orig.excerpt ? await translateWithRetry(orig.excerpt, wrong.lang) : '';
        const translatedContent = await translateWithRetry(orig.content, wrong.lang);

        console.log(`   Translated title: ${translatedTitle.substring(0, 60)}...`);

        // 3. 기존 잘못된 번역 업데이트
        await db.query(`
          UPDATE tips SET
            title = $1,
            excerpt = $2,
            content = $3,
            updated_at = NOW()
          WHERE id = $4
        `, [translatedTitle, translatedExcerpt, translatedContent, wrong.id]);

        console.log(`   ✅ Successfully fixed!`);
        fixed++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`   ❌ Failed:`, error instanceof Error ? error.message : String(error));
        failed++;
      }
    }

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log(`  Total: ${WRONG_TRANSLATIONS.length}`);
    console.log(`  Fixed: ${fixed}`);
    console.log(`  Failed: ${failed}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (failed > 0) {
      console.log('⚠️ Some fixes failed. Please check the errors above.');
      process.exit(1);
    } else {
      console.log('✅ All wrong translations fixed successfully!');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

fixWrongTranslations();
