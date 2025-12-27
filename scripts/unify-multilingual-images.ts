/**
 * 다국어 콘텐츠의 이미지를 원본(한국어)과 통일하는 스크립트
 * - 각 언어별 tip의 thumbnail_url을 원본 tip과 동일하게 설정
 */

import 'dotenv/config';
import { db } from '../server/storage/db.js';

async function unifyMultilingualImages() {
  try {
    console.log('🔧 Starting multilingual image unification...\n');

    // 1. 원본 tip 가져오기 (original_tip_id가 NULL인 한국어 tip)
    const originals = await db.query(`
      SELECT id, title, thumbnail_url, slug
      FROM tips
      WHERE original_tip_id IS NULL AND language = 'ko'
      ORDER BY created_at DESC
    `);

    console.log(`Found ${originals.rows.length} original tips\n`);

    let totalUpdated = 0;

    for (const original of originals.rows) {
      console.log(`Processing: ${original.title}`);
      console.log(`  Original image: ${original.thumbnail_url}`);

      // 2. 이 원본의 번역본들 찾기
      const translations = await db.query(`
        SELECT id, language, thumbnail_url
        FROM tips
        WHERE original_tip_id = $1
      `, [original.id]);

      console.log(`  Found ${translations.rows.length} translations`);

      let updated = 0;
      for (const trans of translations.rows) {
        if (trans.thumbnail_url !== original.thumbnail_url) {
          // 이미지 URL이 다르면 원본과 동일하게 변경
          await db.query(`
            UPDATE tips
            SET thumbnail_url = $1
            WHERE id = $2
          `, [original.thumbnail_url, trans.id]);

          console.log(`    ✅ ${trans.language}: Updated`);
          updated++;
          totalUpdated++;
        } else {
          console.log(`    ⏭️  ${trans.language}: Already same`);
        }
      }

      if (updated > 0) {
        console.log(`  ✅ Updated ${updated} translations\n`);
      } else {
        console.log(`  ℹ️  All translations already have same image\n`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  Originals processed: ${originals.rows.length}`);
    console.log(`  Translations updated: ${totalUpdated}`);
    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

unifyMultilingualImages();
