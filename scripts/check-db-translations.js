/**
 * Check actual database translation state
 */

const API_URL = 'https://koreausimguide.com/api/translate/status';

async function checkStatus() {
  console.log('🔍 Checking database translation status...\n');

  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    console.log('📊 Translation Statistics:');
    console.log('═'.repeat(50));

    const stats = data.stats;
    const total = parseInt(stats.total_plans);

    console.log(`Total Plans: ${total}`);
    console.log('\nLanguage Coverage:');
    console.log(`  English (EN):    ${stats.en_count}/${total} (${Math.round(stats.en_count/total*100)}%)`);
    console.log(`  Vietnamese (VI): ${stats.vi_count}/${total} (${Math.round(stats.vi_count/total*100)}%)`);
    console.log(`  Thai (TH):       ${stats.th_count}/${total} (${Math.round(stats.th_count/total*100)}%)`);
    console.log(`  Tagalog (TL):    ${stats.tl_count}/${total} (${Math.round(stats.tl_count/total*100)}%)`);
    console.log(`  Uzbek (UZ):      ${stats.uz_count}/${total} (${Math.round(stats.uz_count/total*100)}%)`);
    console.log(`  Nepali (NE):     ${stats.ne_count}/${total} (${Math.round(stats.ne_count/total*100)}%)`);
    console.log(`  Mongolian (MN):  ${stats.mn_count}/${total} (${Math.round(stats.mn_count/total*100)}%)`);
    console.log(`  Indonesian (ID): ${stats.id_count}/${total} (${Math.round(stats.id_count/total*100)}%)`);
    console.log(`  Burmese (MY):    ${stats.my_count}/${total} (${Math.round(stats.my_count/total*100)}%)`);
    console.log(`  Chinese (ZH):    ${stats.zh_count}/${total} (${Math.round(stats.zh_count/total*100)}%)`);
    console.log(`  Russian (RU):    ${stats.ru_count}/${total} (${Math.round(stats.ru_count/total*100)}%)`);

    console.log('\n📄 Sample Plan (checking if actually translated):');
    console.log('═'.repeat(50));
    if (data.sample) {
      console.log(`Plan: ${data.sample.name}`);
      console.log(`\nKorean: ${data.sample.description}`);
      console.log(`\nEnglish: ${data.sample.description_en}`);
      console.log(`\nVietnamese: ${data.sample.description_vi}`);
      console.log(`\nChinese: ${data.sample.description_zh}`);

      // Check if it's actually Korean
      const hasKorean = /[가-힣]/.test(data.sample.description_en);
      if (hasKorean) {
        console.log('\n❌ WARNING: English translation contains Korean characters!');
        console.log('   Translation API appears to have failed.');
      } else {
        console.log('\n✅ English translation looks valid (no Korean characters detected)');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkStatus();
