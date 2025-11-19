// 번역이 필요한 블로그 포스트 확인
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTranslations() {
  console.log('🔍 번역 필요한 블로그 확인 중...\n');

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title_ko, slug, content_ko, content_en, content_zh, content_ja, content_tl')
    .eq('is_published', true);

  if (error) {
    console.error('❌ 에러:', error.message);
    return;
  }

  console.log(`📊 총 ${posts.length}개의 공개된 블로그 포스트\n`);

  const needsTranslation = posts.filter(post => {
    const hasKorean = post.content_ko && post.content_ko.length > 100;
    const hasFullEnglish = post.content_en && post.content_en.length > 500; // 긴 내용인지 확인
    const hasChinese = post.content_zh && post.content_zh.length > 100;
    const hasJapanese = post.content_ja && post.content_ja.length > 100;
    const hasTagalog = post.content_tl && post.content_tl.length > 100;

    return hasKorean && (!hasFullEnglish || !hasChinese || !hasJapanese || !hasTagalog);
  });

  console.log(`🌐 번역 필요: ${needsTranslation.length}개\n`);

  needsTranslation.forEach((post, index) => {
    const ko_len = post.content_ko?.length || 0;
    const en_len = post.content_en?.length || 0;
    const zh_len = post.content_zh?.length || 0;
    const ja_len = post.content_ja?.length || 0;
    const tl_len = post.content_tl?.length || 0;

    console.log(`${index + 1}. ${post.title_ko}`);
    console.log(`   Slug: ${post.slug}`);
    console.log(`   길이: KO=${ko_len} | EN=${en_len} | ZH=${zh_len} | JA=${ja_len} | TL=${tl_len}`);

    const missing = [];
    if (en_len < 500) missing.push('EN');
    if (zh_len < 100) missing.push('ZH');
    if (ja_len < 100) missing.push('JA');
    if (tl_len < 100) missing.push('TL');

    console.log(`   필요: ${missing.join(', ')}\n`);
  });
}

checkTranslations();
