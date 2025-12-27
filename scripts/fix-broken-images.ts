/**
 * 깨진 이미지 URL 수정 스크립트
 * - via.placeholder.com, placehold.co 등의 불안정한 placeholder 서비스 URL을
 *   안정적인 Unsplash 이미지로 교체합니다.
 */

import { db } from '../server/storage/db.js';
import { searchStockImages } from '../automation/services/image-service.js';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1551410224-699683e15636?w=1024&h=1024&fit=crop';

async function fixBrokenImages() {
  try {
    console.log('🔧 Starting broken images fix...\n');

    // 1. placeholder 이미지를 사용하는 tips 찾기
    const brokenTips = await db.query(`
      SELECT id, title, thumbnail_url, language
      FROM tips
      WHERE thumbnail_url LIKE '%placeholder%'
         OR thumbnail_url LIKE '%placehold%'
         OR thumbnail_url = ''
         OR thumbnail_url IS NULL
      ORDER BY created_at DESC
    `);

    console.log(`Found ${brokenTips.rows.length} tips with broken/placeholder images\n`);

    if (brokenTips.rows.length === 0) {
      console.log('✅ No broken images found!');
      return;
    }

    let fixed = 0;
    let failed = 0;

    for (const tip of brokenTips.rows) {
      console.log(`Processing: ${tip.title} (${tip.language})`);
      console.log(`  Current URL: ${tip.thumbnail_url || 'NULL'}`);

      try {
        // 제목에서 키워드 추출
        const keyword = tip.title.split(' ').slice(0, 3).join(' ');

        // Unsplash에서 관련 이미지 검색
        let newImageUrl = FALLBACK_IMAGE;
        const images = await searchStockImages(keyword, 1);

        if (images.length > 0) {
          newImageUrl = images[0].url;
          console.log(`  ✅ Found Unsplash image: ${newImageUrl}`);
        } else {
          console.log(`  ⚠️ No Unsplash match, using fallback`);
        }

        // 데이터베이스 업데이트
        await db.query(
          'UPDATE tips SET thumbnail_url = $1 WHERE id = $2',
          [newImageUrl, tip.id]
        );

        fixed++;
        console.log(`  ✅ Updated!\n`);

        // Rate limiting (Unsplash API 제한)
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        failed++;
        console.error(`  ❌ Failed:`, error instanceof Error ? error.message : String(error));
        console.log();
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  Total: ${brokenTips.rows.length}`);
    console.log(`  Fixed: ${fixed}`);
    console.log(`  Failed: ${failed}`);
    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

fixBrokenImages();
