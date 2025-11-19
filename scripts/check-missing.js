// 누락된 번역 확인
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkMissing() {
  console.log('🔍 누락된 번역 확인 중...\n');

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title_ko, slug, content_ko, content_en, content_vi, content_th, content_tl, content_uz, content_ne, content_mn, content_id, content_my, content_zh, content_ru')
    .eq('is_published', true);

  if (error) {
    console.error('❌ 에러:', error.message);
    return;
  }

  const missing = [];

  posts.forEach(post => {
    const issues = [];

    // 한국어는 있는데 다른 언어가 짧거나 없는 경우
    if (post.content_ko && post.content_ko.length > 100) {
      const langs = [
        { key: 'en', name: 'EN', minLength: 100 },
        { key: 'vi', name: 'VI', minLength: 100 },
        { key: 'th', name: 'TH', minLength: 100 },
        { key: 'tl', name: 'TL', minLength: 100 },
        { key: 'uz', name: 'UZ', minLength: 100 },
        { key: 'ne', name: 'NE', minLength: 100 },
        { key: 'mn', name: 'MN', minLength: 100 },
        { key: 'id', name: 'ID', minLength: 100 },
        { key: 'my', name: 'MY', minLength: 100 },
        { key: 'zh', name: 'ZH', minLength: 100 },
        { key: 'ru', name: 'RU', minLength: 100 },
      ];

      langs.forEach(lang => {
        if (!post[`content_${lang.key}`] || post[`content_${lang.key}`].length < lang.minLength) {
          issues.push(lang.name);
        }
      });
    }

    if (issues.length > 0) {
      missing.push({
        id: post.id,
        title: post.title_ko,
        slug: post.slug,
        missing: issues,
        lengths: {
          ko: post.content_ko?.length || 0,
          en: post.content_en?.length || 0,
          vi: post.content_vi?.length || 0,
          th: post.content_th?.length || 0,
          tl: post.content_tl?.length || 0,
          uz: post.content_uz?.length || 0,
          ne: post.content_ne?.length || 0,
          mn: post.content_mn?.length || 0,
          id: post.content_id?.length || 0,
          my: post.content_my?.length || 0,
          zh: post.content_zh?.length || 0,
          ru: post.content_ru?.length || 0,
        }
      });
    }
  });

  if (missing.length === 0) {
    console.log('✅ 모든 번역이 완료되었습니다!');
    return;
  }

  console.log(`⚠️  ${missing.length}개 블로그에 누락된 번역이 있습니다:\n`);

  missing.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title}`);
    console.log(`   ID: ${item.id}`);
    console.log(`   Slug: ${item.slug}`);
    console.log(`   누락: ${item.missing.join(', ')}`);
    console.log(`   길이 (1차): KO=${item.lengths.ko} | EN=${item.lengths.en} | VI=${item.lengths.vi} | TH=${item.lengths.th} | TL=${item.lengths.tl}`);
    console.log(`   길이 (2차): UZ=${item.lengths.uz} | NE=${item.lengths.ne} | MN=${item.lengths.mn} | ID=${item.lengths.id}`);
    console.log(`   길이 (3차): MY=${item.lengths.my} | ZH=${item.lengths.zh} | RU=${item.lengths.ru}\n`);
  });

  // 재번역을 위한 ID 목록 출력
  console.log('\n재번역이 필요한 블로그 ID 목록:');
  console.log(JSON.stringify(missing.map(m => ({ id: m.id, missing: m.missing })), null, 2));
}

checkMissing();
