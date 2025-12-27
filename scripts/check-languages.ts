import 'dotenv/config';
import { db } from '../server/storage/db.js';

async function checkLanguages() {
  try {
    const result = await db.query(`
      SELECT language, COUNT(*) as count
      FROM tips
      GROUP BY language
      ORDER BY language
    `);

    console.log('Languages in database:');
    result.rows.forEach(row => {
      console.log(`  ${row.language}: ${row.count} tips`);
    });

    // Check specific slug in different languages
    console.log('\nChecking a specific tip across languages:');
    const tipCheck = await db.query(`
      SELECT slug, language, title
      FROM tips
      WHERE slug = (SELECT slug FROM tips WHERE language = 'ko' LIMIT 1)
      ORDER BY language
    `);

    if (tipCheck.rows.length > 0) {
      console.log(`\nSlug: ${tipCheck.rows[0].slug}`);
      tipCheck.rows.forEach(row => {
        console.log(`  ${row.language}: ${row.title.substring(0, 50)}...`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkLanguages();
