import 'dotenv/config';
import { db } from '../server/storage/db.js';

// 한글 감지 함수
function containsKorean(text: string): boolean {
  const koreanRegex = /[가-힣]/;
  return koreanRegex.test(text);
}

// 언어별 문자 감지
function detectLanguageScript(text: string): string {
  if (/[가-힣]/.test(text)) return 'Korean';
  if (/[\u0E00-\u0E7F]/.test(text)) return 'Thai';
  if (/[\u0F00-\u0FFF]/.test(text)) return 'Tibetan/Mongolian';
  if (/[\u0400-\u04FF]/.test(text)) return 'Cyrillic (Russian)';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'Chinese';
  if (/[\u1000-\u109F]/.test(text)) return 'Burmese';
  if (/[\u0900-\u097F]/.test(text)) return 'Devanagari (Nepali)';
  return 'Latin/Other';
}

async function checkTranslationQuality() {
  try {
    console.log('🔍 Checking translation quality...\n');

    const LANGUAGES = ['en', 'vi', 'th', 'tl', 'uz', 'ne', 'mn', 'id', 'my', 'zh', 'ru'];

    const issues: any[] = [];

    for (const lang of LANGUAGES) {
      console.log(`\n━━━ Checking ${lang.toUpperCase()} ━━━`);

      const tips = await db.query(`
        SELECT id, title, excerpt, slug, original_tip_id
        FROM tips
        WHERE language = $1
        ORDER BY created_at DESC
      `, [lang]);

      console.log(`Found ${tips.rows.length} ${lang} tips`);

      for (const tip of tips.rows) {
        const hasKoreanInTitle = containsKorean(tip.title);
        const hasKoreanInExcerpt = tip.excerpt ? containsKorean(tip.excerpt) : false;

        const detectedScript = detectLanguageScript(tip.title);

        if (hasKoreanInTitle || hasKoreanInExcerpt) {
          console.log(`  ❌ [${lang}] ${tip.title.substring(0, 60)}...`);
          console.log(`     Korean detected! Script: ${detectedScript}`);
          console.log(`     Slug: ${tip.slug}`);
          console.log(`     ID: ${tip.id}`);

          issues.push({
            language: lang,
            tipId: tip.id,
            slug: tip.slug,
            title: tip.title,
            hasKoreanInTitle,
            hasKoreanInExcerpt,
            originalTipId: tip.original_tip_id
          });
        } else {
          console.log(`  ✅ [${lang}] ${tip.title.substring(0, 60)}... (${detectedScript})`);
        }
      }
    }

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Translation Quality Report');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (issues.length === 0) {
      console.log('\n✅ All translations are properly translated!');
      console.log('   No Korean text found in non-Korean tips.');
    } else {
      console.log(`\n❌ Found ${issues.length} translation quality issues:`);
      console.log('\nBy language:');

      const byLanguage = issues.reduce((acc, issue) => {
        acc[issue.language] = (acc[issue.language] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(byLanguage).forEach(([lang, count]) => {
        console.log(`  ${lang}: ${count} issues`);
      });

      console.log('\n\nDetailed issues:');
      issues.forEach((issue, i) => {
        console.log(`\n${i + 1}. [${issue.language}] ${issue.slug}`);
        console.log(`   Title: ${issue.title.substring(0, 80)}...`);
        console.log(`   Tip ID: ${issue.tipId}`);
        console.log(`   Original ID: ${issue.originalTipId}`);
        console.log(`   Korean in title: ${issue.hasKoreanInTitle}`);
        console.log(`   Korean in excerpt: ${issue.hasKoreanInExcerpt}`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

checkTranslationQuality();
