import 'dotenv/config';
import { db } from '../server/storage/db.js';

async function checkVietnamese() {
  try {
    console.log('🔍 Checking Vietnamese (vi) content...\n');

    // 1. Count Vietnamese tips
    const countResult = await db.query(`
      SELECT COUNT(*) as count
      FROM tips
      WHERE language = 'vi'
    `);
    console.log(`Total Vietnamese tips: ${countResult.rows[0].count}\n`);

    // 2. Get first few Vietnamese tips
    const tipsResult = await db.query(`
      SELECT id, slug, title, language, is_published
      FROM tips
      WHERE language = 'vi'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log('Vietnamese tips:');
    tipsResult.rows.forEach((tip, i) => {
      console.log(`${i + 1}. [${tip.language}] ${tip.title}`);
      console.log(`   Slug: ${tip.slug}`);
      console.log(`   Published: ${tip.is_published}`);
      console.log(`   ID: ${tip.id}\n`);
    });

    // 3. Check if there are any Korean tips with same slug
    if (tipsResult.rows.length > 0) {
      const firstSlug = tipsResult.rows[0].slug;
      console.log(`\nChecking all language versions for slug: ${firstSlug}`);

      const allVersions = await db.query(`
        SELECT language, title, is_published
        FROM tips
        WHERE slug = $1
        ORDER BY language
      `, [firstSlug]);

      allVersions.rows.forEach(row => {
        console.log(`  [${row.language}] ${row.title.substring(0, 60)}... (published: ${row.is_published})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkVietnamese();
